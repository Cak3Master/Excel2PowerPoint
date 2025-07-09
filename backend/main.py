from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import openpyxl
from openpyxl.utils import get_column_letter, column_index_from_string
from openpyxl.utils.cell import coordinate_from_string
import pandas as pd
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import tempfile
import os
import io
import base64
from datetime import datetime
import json
import uuid

def rgb_to_hex(rgb_str):
    """Convert RGB string to hex color"""
    if not rgb_str or rgb_str == '00000000' or rgb_str == 'FFFFFFFF':
        return None
    try:
        # Handle different input formats
        if isinstance(rgb_str, str):
            # Remove alpha channel if present
            if len(rgb_str) == 8:
                rgb_str = rgb_str[2:]  # Skip alpha channel (ARGB -> RGB)
            elif len(rgb_str) == 6:
                pass  # Already RGB
            else:
                return None
        # Convert to RGB tuple
        return tuple(int(rgb_str[i:i+2], 16) for i in (0, 2, 4))
    except:
        return None

def get_cell_background_color(cell):
    """Extract background color from Excel cell"""
    if not cell.fill:
        return None
        
    bg_color = None
    if hasattr(cell.fill, 'fgColor') and cell.fill.fgColor:
        if hasattr(cell.fill.fgColor, 'rgb') and cell.fill.fgColor.rgb:
            bg_color = rgb_to_hex(str(cell.fill.fgColor.rgb))
        elif hasattr(cell.fill.fgColor, 'indexed') and cell.fill.fgColor.indexed is not None:
            # Handle indexed colors (Excel's built-in color palette)
            try:
                from openpyxl.styles.colors import COLOR_INDEX
                if cell.fill.fgColor.indexed < len(COLOR_INDEX):
                    indexed_color = COLOR_INDEX[cell.fill.fgColor.indexed]
                    if indexed_color != 'FF000000':  # Not black
                        bg_color = rgb_to_hex(indexed_color[2:])  # Remove FF prefix
            except:
                pass
    return bg_color

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

class TableRange(BaseModel):
    sheet_name: str
    start_cell: str
    end_cell: str
    has_headers: bool = True

class FormattingOptions(BaseModel):
    font_size: int = 10
    font_family: str = "Arial"
    table_alignment: str = "center"  # center, left, right
    row_spacing: float = 1.0
    column_spacing: float = 1.0
    slide_orientation: str = "horizontal"  # horizontal, vertical
    repeat_headers: bool = True
    auto_split: bool = True
    max_rows_per_slide: int = 20
    # Preview editor settings
    column_widths: List[float] = []
    row_heights: List[float] = []
    show_gridlines: bool = True
    show_horizontal_gridlines: bool = True
    show_vertical_gridlines: bool = True
    preview_rows: int = 50
    preview_columns: int = 20
    header_rows: int = 1

class ConversionRequest(BaseModel):
    file_id: str
    selected_ranges: List[TableRange]
    formatting_options: FormattingOptions

class SheetInfo(BaseModel):
    name: str
    rows: int
    columns: int
    tables: List[Dict[str, Any]]
    data_preview: List[List[Any]]

def detect_tables_in_sheet(ws):
    """Detect potential tables in a worksheet"""
    tables = []
    max_row = ws.max_row
    max_col = ws.max_column
    
    # Find regions with data
    data_regions = []
    visited = set()
    
    for row in range(1, min(max_row + 1, 100)):  # Limit to first 100 rows for performance
        for col in range(1, min(max_col + 1, 50)):  # Limit to first 50 columns
            cell_coord = f"{get_column_letter(col)}{row}"
            if cell_coord in visited:
                continue
                
            cell = ws.cell(row=row, column=col)
            if cell.value is not None:
                # Found data, now find the extent of this table
                start_row, start_col = row, col
                end_row, end_col = row, col
                
                # Find the extent of the data region
                for r in range(row, min(max_row + 1, row + 50)):
                    for c in range(col, min(max_col + 1, col + 20)):
                        if ws.cell(row=r, column=c).value is not None:
                            end_row = max(end_row, r)
                            end_col = max(end_col, c)
                            visited.add(f"{get_column_letter(c)}{r}")
                
                # Check if this is a substantial table (more than 2x2)
                if (end_row - start_row >= 1) or (end_col - start_col >= 1):
                    tables.append({
                        "start_cell": f"{get_column_letter(start_col)}{start_row}",
                        "end_cell": f"{get_column_letter(end_col)}{end_row}",
                        "rows": end_row - start_row + 1,
                        "columns": end_col - start_col + 1,
                        "has_headers": True  # Assume first row is header
                    })
                    
                    # Mark all cells in this region as visited
                    for r in range(start_row, end_row + 1):
                        for c in range(start_col, end_col + 1):
                            visited.add(f"{get_column_letter(c)}{r}")
    
    return tables

def get_data_preview(ws, max_rows=10, max_cols=10):
    """Get a preview of the worksheet data"""
    preview = []
    for row in range(1, min(ws.max_row + 1, max_rows + 1)):
        row_data = []
        for col in range(1, min(ws.max_column + 1, max_cols + 1)):
            cell = ws.cell(row=row, column=col)
            value = cell.value
            if value is not None:
                row_data.append(str(value))
            else:
                row_data.append("")
        preview.append(row_data)
    return preview

@app.post("/api/analyze-excel")
async def analyze_excel(file: UploadFile = File(...)):
    """Analyze Excel file and return sheet information"""
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")
    
    try:
        # Save uploaded file temporarily
        content = await file.read()
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        
        sheets_info = []
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            
            sheet_info = SheetInfo(
                name=sheet_name,
                rows=ws.max_row,
                columns=ws.max_column,
                tables=[],  # No longer detecting tables automatically
                data_preview=get_data_preview(ws)
            )
            sheets_info.append(sheet_info.dict())
        
        # Store the file temporarily for later conversion
        file_id = f"{uuid.uuid4().hex}.xlsx"
        file_path = os.path.join(tempfile.gettempdir(), file_id)
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Extract only worksheets for the frontend
        worksheets = []
        
        for sheet_info in sheets_info:
            # Convert sheet to worksheet format
            worksheet = {
                "name": sheet_info["name"],
                "rows": sheet_info["rows"], 
                "columns": sheet_info["columns"],
                "has_data": len(sheet_info["data_preview"]) > 0
            }
            worksheets.append(worksheet)
        
        return {
            "message": "Excel file analyzed successfully",
            "file_id": file_id,
            "worksheets": worksheets,
            "tables": []  # Empty array for backward compatibility
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PreviewRequest(BaseModel):
    file_id: str
    table_id: str
    options: FormattingOptions
    preview_rows: int = 50
    preview_columns: int = 20

@app.post("/api/preview-slide")
async def preview_slide(request: PreviewRequest):
    """Generate a preview of how a slide will look"""
    try:
        # Load the Excel file
        file_path = os.path.join(tempfile.gettempdir(), request.file_id)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {request.file_id}")
        
        wb = openpyxl.load_workbook(file_path, data_only=True)
        
        # Parse table_id to get sheet name and table info
        # Format: "SheetName_table_0" or "worksheet_SheetName"
        if request.table_id.startswith("worksheet_"):
            # It's a full worksheet
            sheet_name = request.table_id.replace("worksheet_", "")
            ws = wb[sheet_name]
            # Use the entire data area
            start_row, start_col = 1, 1
            end_row, end_col = ws.max_row, ws.max_column
        else:
            # Parse table ID: "SheetName_table_N"
            parts = request.table_id.split("_table_")
            if len(parts) != 2:
                raise HTTPException(status_code=400, detail=f"Invalid table_id format: {request.table_id}")
            
            sheet_name = parts[0]
            table_index = int(parts[1])
            
            # Re-analyze the sheet to find the table
            ws = wb[sheet_name]
            tables = detect_tables_in_sheet(ws)
            
            if table_index >= len(tables):
                raise HTTPException(status_code=404, detail=f"Table {table_index} not found in sheet {sheet_name}")
            
            table = tables[table_index]
            start_col, start_row = coordinate_from_string(table["start_cell"])
            end_col, end_row = coordinate_from_string(table["end_cell"])
            start_col = column_index_from_string(start_col)
            end_col = column_index_from_string(end_col)
        
        # Get table data with formatting
        table_data = []
        for row in range(start_row, min(end_row + 1, start_row + request.preview_rows)):  # Limit rows for preview
            row_data = []
            for col in range(start_col, min(end_col + 1, start_col + request.preview_columns)):  # Limit columns for preview
                cell = ws.cell(row=row, column=col)
                bg_color = get_cell_background_color(cell)
                cell_data = {
                    "value": str(cell.value) if cell.value is not None else "",
                    "font_bold": cell.font.bold if cell.font else False,
                    "font_color": cell.font.color.rgb if cell.font and cell.font.color and cell.font.color.rgb else "000000",
                    "fill_color": bg_color,
                    "alignment": cell.alignment.horizontal if cell.alignment else "left"
                }
                row_data.append(cell_data)
            table_data.append(row_data)
        
        # Calculate dimensions
        num_rows = len(table_data)
        num_cols = len(table_data[0]) if table_data else 0
        
        # Check if splitting is needed
        needs_split = num_rows > request.options.max_rows_per_slide and request.options.auto_split
        estimated_slides = (num_rows // request.options.max_rows_per_slide) + 1 if needs_split else 1
        
        return {
            "slide_content": table_data,
            "slide_count": estimated_slides,
            "message": f"Preview generated for {num_rows} rows x {num_cols} columns"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_cell_display_value(cell_data):
    """Get the display value of a cell as it appears in the frontend"""
    if not cell_data or not cell_data.get("value"):
        return ""
    return str(cell_data.get("value", ""))

def create_grouped_shape_table(slide, table_data, formatting, left, top, title=""):
    """Create a resizable grouped shape table that mimics Excel layout exactly"""
    print(f"Creating grouped shape table. Title: {title}")
    print(f"Table data dimensions: {len(table_data)} rows, {len(table_data[0]) if table_data else 0} columns")
    
    num_rows = len(table_data)
    num_cols = len(table_data[0]) if table_data else 0
    
    if num_rows == 0 or num_cols == 0:
        print(f"No table data to render: {num_rows} rows, {num_cols} columns")
        return None
    
    # Calculate table dimensions with reasonable constraints
    max_table_width = 10.0  # inches - standard slide width with margins
    max_table_height = 6.5 if title else 7.2  # inches
    
    # Use custom column widths if provided, otherwise calculate optimal widths
    print(f"🔍 DEBUG: formatting.column_widths = {formatting.column_widths}")
    print(f"🔍 DEBUG: num_cols = {num_cols}")
    print(f"🔍 DEBUG: len(column_widths) = {len(formatting.column_widths) if formatting.column_widths else 'None'}")
    
    if formatting.column_widths and len(formatting.column_widths) >= num_cols:
        # Simple proportional scaling - direct ratio preservation
        custom_widths = formatting.column_widths[:num_cols]
        print(f"🔄 NEW PROPORTIONAL SCALING - Received custom column widths: {custom_widths[:5]}")
        
        # Calculate the total proportional units
        total_width_units = sum(custom_widths)
        
        # Convert pixel widths to inches EXTREMELY generously
        # Use a very generous pixel-to-inch conversion (60 DPI instead of 72)
        col_widths = []
        for width_pixels in custom_widths:
            # Convert pixels to inches using 60 DPI for EXTREMELY generous sizing
            width_inches = width_pixels / 60.0  # Even more generous than 72 DPI
            col_widths.append(width_inches)
        
        print(f"Proportional column widths: {[f'{w:.3f}in' for w in col_widths[:5]]}")
        
        # Ensure minimum column width but don't scale down
        min_width = 1.0  # Increased minimum width to 1 inch
        for i, width in enumerate(col_widths):
            if width < min_width:
                col_widths[i] = min_width
        
        print(f"Final column widths: {[f'{w:.3f}in' for w in col_widths[:5]]}")
    else:
        # Calculate optimal column widths based on content
        col_widths = []
        for col_idx in range(num_cols):
            max_content_length = 0
            for row_idx in range(num_rows):
                cell_data = table_data[row_idx][col_idx]
                text_value = get_cell_display_value(cell_data)
                content_length = len(text_value)
                max_content_length = max(max_content_length, content_length)
            
            # Calculate required width based on content
            char_width = 0.15  # Generous character width
            required_width = max(max_content_length * char_width + 0.3, 0.8)  # Minimum 0.8"
            col_widths.append(required_width)
        
        # Don't scale down column widths - let them be as wide as needed
        # This prevents text wrapping in PowerPoint
        print(f"Using content-based column widths without scaling: {[f'{w:.3f}in' for w in col_widths[:5]]}")
    
    # Use custom row heights if provided, otherwise uniform
    if formatting.row_heights and len(formatting.row_heights) >= num_rows:
        # Convert custom heights from pixels to inches with conservative scaling
        custom_heights = formatting.row_heights[:num_rows]
        
        # Convert pixels to inches (96 DPI is standard for web)
        row_heights = [h / 96 for h in custom_heights]  # Direct pixel to inch conversion
        
        # Only scale down if the total height exceeds available space
        total_height = sum(row_heights)
        if total_height > max_table_height:
            # Conservative scaling - only scale down when necessary
            scale_factor = max_table_height / total_height
            row_heights = [h * scale_factor for h in row_heights]
            print(f"Scaled row heights down by factor {scale_factor:.3f} to fit slide")
        
        print(f"Using custom row heights: {[f'{h:.2f}in' for h in row_heights]}") 
        
        # Ensure minimum row height
        row_heights = [max(h, 0.15) for h in row_heights]  # Minimum 0.15 inch per row
    else:
        row_height = min(max_table_height / num_rows, 0.4)  # Max 0.4" per row
        row_heights = [row_height for _ in range(num_rows)]
    
    # Calculate actual table dimensions
    table_width = sum(col_widths)
    table_height = sum(row_heights)
    
    # Determine font size based on cell dimensions
    avg_col_width = table_width / num_cols
    avg_row_height = table_height / num_rows
    min_dimension = min(avg_col_width, avg_row_height)
    
    if min_dimension < 0.1:
        font_size = 6
    elif min_dimension < 0.15:
        font_size = 7
    elif min_dimension < 0.2:
        font_size = 8
    elif min_dimension < 0.25:
        font_size = 9
    elif min_dimension < 0.3:
        font_size = 10
    elif min_dimension < 0.4:
        font_size = 11
    else:
        font_size = 12
    
    # Override font size if specified in formatting
    if hasattr(formatting, 'font_size') and formatting.font_size:
        font_size = formatting.font_size
    
    print(f"Table dimensions: {table_width:.2f}\" x {table_height:.2f}\"")
    print(f"Font size: {font_size}pt")
    
    # List to collect all shapes for grouping
    all_shapes = []
    
    # Create background rectangle for the entire table
    table_bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        left,
        top,
        Inches(table_width),
        Inches(table_height)
    )
    table_bg.fill.solid()
    table_bg.fill.fore_color.rgb = RGBColor(255, 255, 255)  # White background
    table_bg.line.fill.background()  # No border
    table_bg.shadow.inherit = False  # Remove drop shadow
    all_shapes.append(table_bg)
    
    # Create individual cell shapes
    current_top_offset = 0
    for row_idx in range(num_rows):
        current_left_offset = 0
        current_row_height = row_heights[row_idx]
        
        for col_idx in range(num_cols):
            cell_data = table_data[row_idx][col_idx]
            current_col_width = col_widths[col_idx]
            
            # Calculate cell position
            cell_left = left + Inches(current_left_offset)
            cell_top = top + Inches(current_top_offset)
            cell_width = Inches(current_col_width)
            cell_height = Inches(current_row_height)
            
            # Create cell background if it has color
            if cell_data.get("fill_color"):
                cell_bg = slide.shapes.add_shape(
                    MSO_SHAPE.RECTANGLE,
                    cell_left,
                    cell_top,
                    cell_width,
                    cell_height
                )
                cell_bg.fill.solid()
                try:
                    color = cell_data["fill_color"]
                    if isinstance(color, (list, tuple)) and len(color) == 3:
                        r, g, b = color
                        cell_bg.fill.fore_color.rgb = RGBColor(r, g, b)
                    elif isinstance(color, str) and len(color) >= 6:
                        rgb_hex = color
                        if len(rgb_hex) == 8:
                            rgb_hex = rgb_hex[2:]
                        r = int(rgb_hex[0:2], 16)
                        g = int(rgb_hex[2:4], 16)
                        b = int(rgb_hex[4:6], 16)
                        cell_bg.fill.fore_color.rgb = RGBColor(r, g, b)
                except Exception as e:
                    print(f"Error setting cell background color: {e}")
                    cell_bg.fill.fore_color.rgb = RGBColor(255, 255, 255)
                
                cell_bg.line.fill.background()  # No border on colored cells
                cell_bg.shadow.inherit = False  # Remove drop shadow
                all_shapes.append(cell_bg)
            
            # Add text box for cell content
            text_value = get_cell_display_value(cell_data)
            if text_value:
                text_box = slide.shapes.add_textbox(
                    cell_left,
                    cell_top,
                    cell_width,
                    cell_height
                )
                text_box.shadow.inherit = False  # Remove drop shadow
                text_box.line.fill.background()  # No border
                text_box.fill.background()  # Transparent fill
                all_shapes.append(text_box)
                
                # Set cell text with formatting
                text_box.text = text_value
                
                # Format text
                if text_box.text_frame and text_box.text_frame.paragraphs:
                    # Set minimal margins
                    text_box.text_frame.margin_left = Inches(0.02)
                    text_box.text_frame.margin_right = Inches(0.02)
                    text_box.text_frame.margin_top = Inches(0.01)
                    text_box.text_frame.margin_bottom = Inches(0.01)
                    
                    # Center text vertically
                    text_box.text_frame.vertical_anchor = MSO_ANCHOR.MIDDLE
                    
                    # Disable text wrapping for headers
                    if row_idx < 3:  # Header rows
                        text_box.text_frame.word_wrap = False
                    
                    paragraph = text_box.text_frame.paragraphs[0]
                    
                    if paragraph.runs:
                        run = paragraph.runs[0]
                    else:
                        run = paragraph.add_run()
                        run.text = text_value
                    
                    # Apply font styling
                    run.font.size = Pt(font_size)
                    run.font.name = getattr(formatting, 'font_family', 'Arial')
                    
                    if cell_data.get("font_bold"):
                        run.font.bold = True
                    
                    # Set font color
                    if cell_data.get("font_color"):
                        try:
                            font_color = cell_data["font_color"]
                            if isinstance(font_color, str) and len(font_color) >= 6:
                                rgb_hex = font_color
                                if len(rgb_hex) == 8:
                                    rgb_hex = rgb_hex[2:]
                                r = int(rgb_hex[0:2], 16)
                                g = int(rgb_hex[2:4], 16)
                                b = int(rgb_hex[4:6], 16)
                                run.font.color.rgb = RGBColor(r, g, b)
                            else:
                                run.font.color.rgb = RGBColor(0, 0, 0)  # Default black
                        except:
                            run.font.color.rgb = RGBColor(0, 0, 0)  # Default black
                    else:
                        run.font.color.rgb = RGBColor(0, 0, 0)  # Default black
                    
                    # Apply alignment
                    alignment = cell_data.get("alignment", "left")
                    if alignment == "center":
                        paragraph.alignment = PP_ALIGN.CENTER
                    elif alignment == "right":
                        paragraph.alignment = PP_ALIGN.RIGHT
                    else:
                        paragraph.alignment = PP_ALIGN.LEFT
                    
                    # Minimal paragraph spacing
                    paragraph.space_before = Pt(0)
                    paragraph.space_after = Pt(0)
                    paragraph.line_spacing = 1.0
            
            current_left_offset += current_col_width
        
        current_top_offset += current_row_height
    
    # Draw gridlines if enabled
    if getattr(formatting, 'show_gridlines', True):
        # Calculate cumulative positions for gridlines
        cumulative_widths = [0]
        for col_width in col_widths:
            cumulative_widths.append(cumulative_widths[-1] + col_width)
        
        cumulative_heights = [0]
        for row_height in row_heights:
            cumulative_heights.append(cumulative_heights[-1] + row_height)
        
        # Draw vertical gridlines
        if getattr(formatting, 'show_vertical_gridlines', True):
            for i in range(len(cumulative_widths)):
                line_x = left + Inches(cumulative_widths[i])
                line = slide.shapes.add_connector(
                    1,  # Straight line
                    line_x, top,
                    line_x, top + Inches(table_height)
                )
                line.line.color.rgb = RGBColor(200, 200, 200)
                line.line.width = Pt(0.5)
                line.shadow.inherit = False
                all_shapes.append(line)
        
        # Draw horizontal gridlines
        if getattr(formatting, 'show_horizontal_gridlines', True):
            for i in range(len(cumulative_heights)):
                line_y = top + Inches(cumulative_heights[i])
                line = slide.shapes.add_connector(
                    1,  # Straight line
                    left, line_y,
                    left + Inches(table_width), line_y
                )
                line.line.color.rgb = RGBColor(200, 200, 200)
                line.line.width = Pt(0.5)
                line.shadow.inherit = False
                all_shapes.append(line)
    
    print(f"Created table with {len(all_shapes)} shapes")
    return all_shapes[0] if all_shapes else None

def create_slide_with_table(prs, table_data, formatting, title=""):
    """Create a slide with a table using the main branch's working approach"""
    print(f"Creating slide with table. Title: {title}")
    print(f"Table data dimensions: {len(table_data)} rows, {len(table_data[0]) if table_data else 0} columns")
    
    slide_layout = prs.slide_layouts[5]  # Blank slide
    slide = prs.slides.add_slide(slide_layout)
    
    num_rows = len(table_data)
    num_cols = len(table_data[0]) if table_data else 0
    
    if num_rows == 0 or num_cols == 0:
        print(f"No table data to render: {num_rows} rows, {num_cols} columns")
        return slide
    
    # Add title if provided
    if title:
        title_shape = slide.shapes.title
        if title_shape:
            title_shape.text = title
            title_shape.top = Inches(0.1)
            title_shape.height = Inches(0.3)
            title_shape.left = Inches(0.5)
            title_shape.width = Inches(9.0)
            title_shape.shadow.inherit = False  # Remove drop shadow from title
            
            if title_shape.text_frame.paragraphs:
                title_para = title_shape.text_frame.paragraphs[0]
                if title_para.runs:
                    title_run = title_para.runs[0]
                else:
                    title_run = title_para.add_run()
                    title_run.text = title
                title_run.font.size = Pt(14)
                title_para.alignment = PP_ALIGN.CENTER
    
    # Position table
    margin = 0.5
    left = Inches(margin)
    top = Inches(margin + (0.4 if title else 0))
    
    print(f"Creating grouped shape table at position ({margin:.1f}\", {margin + (0.4 if title else 0):.1f}\")")
    
    # Create the grouped shape table
    table_shape = create_grouped_shape_table(
        slide, table_data, formatting, left, top, title
    )
    
    print(f"Table creation completed. Final slide has {len(slide.shapes)} shapes")
    return slide

@app.post("/api/convert-to-pptx")
async def convert_to_pptx(request: ConversionRequest):
    """Convert selected Excel ranges to PowerPoint"""
    try:
        # Load the Excel file
        file_path = os.path.join(tempfile.gettempdir(), request.file_id)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {request.file_id}")
        
        wb = openpyxl.load_workbook(file_path, data_only=True)
        
        # Create presentation
        prs = Presentation()
        
        # Set slide size based on orientation
        if request.formatting_options.slide_orientation == "vertical":
            prs.slide_width = Inches(7.5)
            prs.slide_height = Inches(10)
        else:
            prs.slide_width = Inches(10)
            prs.slide_height = Inches(7.5)
        
        # Process each selected range
        for table_range in request.selected_ranges:
            ws = wb[table_range.sheet_name]
            
            # Extract data from the specified range
            start_col, start_row = coordinate_from_string(table_range.start_cell)
            end_col, end_row = coordinate_from_string(table_range.end_cell)
            
            start_col_idx = column_index_from_string(start_col)
            end_col_idx = column_index_from_string(end_col)
            
            # Get table data
            table_data = []
            for row in range(start_row, end_row + 1):
                row_data = []
                for col in range(start_col_idx, end_col_idx + 1):
                    cell = ws.cell(row=row, column=col)
                    bg_color = get_cell_background_color(cell)
                    row_data.append({
                        "value": str(cell.value) if cell.value is not None else "",
                        "font_bold": cell.font.bold if cell.font else False,
                        "font_color": cell.font.color.rgb if cell.font and cell.font.color and cell.font.color.rgb else "000000",
                        "fill_color": bg_color,
                        "alignment": cell.alignment.horizontal if cell.alignment else "left"
                    })
                table_data.append(row_data)
            
            # Check if we need to split the table
            num_rows = len(table_data)
            if request.formatting_options.auto_split and num_rows > request.formatting_options.max_rows_per_slide:
                # Split table across multiple slides
                headers = table_data[0] if table_range.has_headers else []
                data_start = 1 if table_range.has_headers else 0
                
                slide_num = 1
                for i in range(data_start, num_rows, request.formatting_options.max_rows_per_slide):
                    slide_data = []
                    
                    # Add headers if requested
                    if request.formatting_options.repeat_headers and headers:
                        slide_data.append(headers)
                    
                    # Add data rows
                    end_idx = min(i + request.formatting_options.max_rows_per_slide, num_rows)
                    slide_data.extend(table_data[i:end_idx])
                    
                    # Create slide
                    title = f"{table_range.sheet_name} - Part {slide_num}"
                    create_slide_with_table(prs, slide_data, request.formatting_options, title)
                    slide_num += 1
            else:
                # Create single slide for the table
                title = table_range.sheet_name
                create_slide_with_table(prs, table_data, request.formatting_options, title)
        
        # Save presentation
        output_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pptx')
        prs.save(output_file.name)
        output_file.close()
        
        # Note: Keep Excel file for subsequent downloads
        # File will be cleaned up by temp directory cleanup
        # try:
        #     os.unlink(file_path)
        # except:
        #     pass
        
        # Return the file and ensure it gets deleted after download
        return FileResponse(
            output_file.name,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pptx",
            background=None  # Ensure file is not deleted before sending
        )
        
    except Exception as e:
        # Note: Keep Excel file for subsequent downloads
        # try:
        #     if 'file_path' in locals() and os.path.exists(file_path):
        #         os.unlink(file_path)
        # except:
        #     pass
        raise HTTPException(status_code=500, detail=str(e))

# Worksheet range for multi-worksheet conversion
class WorksheetRangeRequest(BaseModel):
    worksheetName: str
    startCell: str
    endCell: str
    includeInDownload: bool

# Multi-worksheet conversion request
class MultiWorksheetConvertRequest(BaseModel):
    file_id: str
    worksheet_ranges: List[WorksheetRangeRequest]
    options: FormattingOptions

# Simple conversion endpoint that matches frontend expectations
class SimpleConvertRequest(BaseModel):
    file_id: str
    table_id: str
    options: FormattingOptions

@app.post("/api/convert-to-pptx-simple")
async def convert_to_pptx_simple(request: SimpleConvertRequest):
    """Convert ALL sheets to PowerPoint with one slide per sheet"""
    try:
        # Load the Excel file
        file_path = os.path.join(tempfile.gettempdir(), request.file_id)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {request.file_id}")
        
        wb = openpyxl.load_workbook(file_path, data_only=True)
        
        # Create presentation
        prs = Presentation()
        
        # Set slide size based on orientation
        if request.options.slide_orientation == "vertical":
            prs.slide_width = Inches(7.5)
            prs.slide_height = Inches(10)
        else:
            prs.slide_width = Inches(10)
            prs.slide_height = Inches(7.5)
        
        # Process each sheet in the workbook
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            
            # Skip empty sheets
            if ws.max_row <= 1 and ws.max_column <= 1:
                continue
                
            # Use the preview settings if this sheet was customized
            sheet_key = f"{request.file_id}_{sheet_name}"
            
            # Determine the data range to use
            if hasattr(request.options, 'preview_rows') and hasattr(request.options, 'preview_columns'):
                end_row = min(ws.max_row, request.options.preview_rows or 50)
                end_col = min(ws.max_column, request.options.preview_columns or 20)
            else:
                end_row = min(ws.max_row, 50)  # Default limit
                end_col = min(ws.max_column, 20)  # Default limit
            
            # Extract data from the sheet
            table_data = []
            for row in range(1, end_row + 1):
                row_data = []
                for col in range(1, end_col + 1):
                    cell = ws.cell(row=row, column=col)
                    bg_color = get_cell_background_color(cell)
                    row_data.append({
                        "value": str(cell.value) if cell.value is not None else "",
                        "font_bold": cell.font.bold if cell.font else False,
                        "font_color": cell.font.color.rgb if cell.font and cell.font.color and cell.font.color.rgb else "000000",
                        "fill_color": bg_color,
                        "alignment": cell.alignment.horizontal if cell.alignment else "left"
                    })
                table_data.append(row_data)
            
            # Create slide for this sheet
            if table_data:
                create_slide_with_table(prs, table_data, request.options, f"Sheet: {sheet_name}")
        
        # Save presentation
        output_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pptx')
        prs.save(output_file.name)
        output_file.close()
        
        # Note: Keep Excel file for subsequent downloads
        # File will be cleaned up by temp directory cleanup
        # try:
        #     os.unlink(file_path)
        # except:
        #     pass
        
        # Return the file
        return FileResponse(
            output_file.name,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pptx",
            background=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/convert-multi-worksheet")
async def convert_multi_worksheet(request: MultiWorksheetConvertRequest):
    """Convert multiple worksheet ranges to PowerPoint"""
    try:
        # Load the Excel file
        file_path = os.path.join(tempfile.gettempdir(), request.file_id)
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {request.file_id}")
        
        wb = openpyxl.load_workbook(file_path, data_only=True)
        
        # Create presentation
        prs = Presentation()
        
        # Set slide size based on orientation
        if request.options.slide_orientation == "vertical":
            prs.slide_width = Inches(7.5)
            prs.slide_height = Inches(10)
        else:
            prs.slide_width = Inches(10)
            prs.slide_height = Inches(7.5)
        
        # Process each included worksheet range
        for ws_range in request.worksheet_ranges:
            if not ws_range.includeInDownload:
                continue
                
            try:
                ws = wb[ws_range.worksheetName]
            except KeyError:
                continue  # Skip if worksheet doesn't exist
            
            # Parse the cell range
            start_col, start_row = coordinate_from_string(ws_range.startCell)
            end_col, end_row = coordinate_from_string(ws_range.endCell)
            
            start_col_idx = column_index_from_string(start_col)
            end_col_idx = column_index_from_string(end_col)
            
            # Extract data from the specified range
            table_data = []
            print(f"Processing range {ws_range.startCell}:{ws_range.endCell} for worksheet {ws_range.worksheetName}")
            print(f"Parsed coordinates: start=({start_col},{start_row}) end=({end_col},{end_row})")
            print(f"Column indices: start={start_col_idx} end={end_col_idx}")
            
            for row in range(start_row, min(end_row + 1, ws.max_row + 1)):
                row_data = []
                for col in range(start_col_idx, min(end_col_idx + 1, ws.max_column + 1)):
                    cell = ws.cell(row=row, column=col)
                    bg_color = get_cell_background_color(cell)
                    row_data.append({
                        "value": str(cell.value) if cell.value is not None else "",
                        "font_bold": cell.font.bold if cell.font else False,
                        "font_color": cell.font.color.rgb if cell.font and cell.font.color and cell.font.color.rgb else "000000",
                        "fill_color": bg_color,
                        "alignment": cell.alignment.horizontal if cell.alignment else "left"
                    })
                table_data.append(row_data)
            
            print(f"Extracted {len(table_data)} rows with {len(table_data[0]) if table_data else 0} columns")
            for i, row in enumerate(table_data[:3]):  # Print first 3 rows for debugging
                print(f"Row {i}: {[cell['value'] for cell in row[:5]]}")
            
            # Create slide for this range
            if table_data:
                range_title = f"{ws_range.worksheetName} ({ws_range.startCell}:{ws_range.endCell})"
                print(f"Creating slide with title: {range_title}")
                create_slide_with_table(prs, table_data, request.options, range_title)
            else:
                print(f"No data found for range {ws_range.startCell}:{ws_range.endCell}")
        
        # Save presentation
        output_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pptx')
        prs.save(output_file.name)
        output_file.close()
        
        # Note: Keep Excel file for subsequent downloads
        # File will be cleaned up by temp directory cleanup
        # try:
        #     os.unlink(file_path)
        # except:
        #     pass
        
        # Return the file
        return FileResponse(
            output_file.name,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pptx",
            background=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Excel to PowerPoint API", "version": "1.0.0"}

@app.get("/health")
async def health_check_root():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)