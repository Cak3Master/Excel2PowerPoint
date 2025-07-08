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
import tempfile
import os
import io
import base64
from datetime import datetime
import json
import uuid

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
            tables = detect_tables_in_sheet(ws)
            preview = get_data_preview(ws)
            
            sheet_info = SheetInfo(
                name=sheet_name,
                rows=ws.max_row,
                columns=ws.max_column,
                tables=tables,
                data_preview=preview
            )
            sheets_info.append(sheet_info.dict())
        
        # Store the file temporarily for later conversion
        file_id = f"{uuid.uuid4().hex}.xlsx"
        file_path = os.path.join(tempfile.gettempdir(), file_id)
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Extract tables from all sheets for the frontend
        all_tables = []
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
            
            # Add tables with unique IDs
            for i, table in enumerate(sheet_info["tables"]):
                table_obj = {
                    "id": f"{sheet_info['name']}_table_{i}",
                    "name": f"Table {i+1}",
                    "worksheet": sheet_info["name"],
                    "range": f"{table['start_cell']}:{table['end_cell']}",
                    "rows": table["rows"],
                    "columns": table["columns"],
                    "display_name": f"{sheet_info['name']} - Table {i+1} ({table['start_cell']}:{table['end_cell']})"
                }
                all_tables.append(table_obj)
        
        return {
            "message": "Excel file analyzed successfully",
            "file_id": file_id,
            "worksheets": worksheets,
            "tables": all_tables
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PreviewRequest(BaseModel):
    file_id: str
    table_id: str
    options: FormattingOptions

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
        
        # Get table data as simple strings
        table_data = []
        for row in range(start_row, min(end_row + 1, start_row + 50)):  # Limit to 50 rows for preview
            row_data = []
            for col in range(start_col, min(end_col + 1, start_col + 20)):  # Limit to 20 columns for preview
                cell = ws.cell(row=row, column=col)
                value = str(cell.value) if cell.value is not None else ""
                row_data.append(value)
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

def create_slide_with_table(prs, table_data, formatting, title=""):
    """Create a slide with a table using shape-based approach"""
    slide_layout = prs.slide_layouts[5]  # Blank slide
    slide = prs.slides.add_slide(slide_layout)
    
    # Set slide dimensions
    slide_width = prs.slide_width
    slide_height = prs.slide_height
    
    # Calculate margins
    left_margin = Inches(0.5)
    top_margin = Inches(1.0) if title else Inches(0.5)
    right_margin = Inches(0.5)
    bottom_margin = Inches(0.5)
    
    # Add title if provided
    if title:
        title_box = slide.shapes.add_textbox(left_margin, Inches(0.2), slide_width - left_margin - right_margin, Inches(0.5))
        title_frame = title_box.text_frame
        title_frame.text = title
        title_frame.paragraphs[0].font.size = Pt(18)
        title_frame.paragraphs[0].font.bold = True
    
    # Calculate available space
    available_width = slide_width - left_margin - right_margin
    available_height = slide_height - top_margin - bottom_margin
    
    # Calculate cell dimensions
    num_rows = len(table_data)
    num_cols = len(table_data[0]) if table_data else 0
    
    if num_rows == 0 or num_cols == 0:
        return slide
    
    # Calculate column widths based on content
    col_widths = []
    for col_idx in range(num_cols):
        max_width = 50  # Minimum width
        for row_idx in range(num_rows):
            cell_text = table_data[row_idx][col_idx].get("value", "")
            # Estimate width based on character count
            estimated_width = len(str(cell_text)) * 7 + 20  # 7 pixels per char + padding
            max_width = max(max_width, estimated_width)
        col_widths.append(max_width)
    
    # Scale column widths to fit available width
    total_width = sum(col_widths)
    if total_width > 0:
        scale_factor = float(available_width) / total_width / 72  # Convert to inches
        col_widths = [w * scale_factor for w in col_widths]
    else:
        col_widths = [available_width / num_cols for _ in range(num_cols)]
    
    # Calculate row height
    row_height = min(available_height / num_rows, Inches(0.5))
    
    # Create table using shapes
    current_top = top_margin
    
    for row_idx in range(num_rows):
        current_left = left_margin
        
        for col_idx in range(num_cols):
            cell_data = table_data[row_idx][col_idx]
            cell_width = col_widths[col_idx]
            
            # Create text box for cell
            text_box = slide.shapes.add_textbox(
                current_left, current_top, 
                cell_width, row_height
            )
            
            # Add border
            line = text_box.line
            line.color.rgb = RGBColor(200, 200, 200)
            line.width = Pt(0.5)
            
            # Set fill color
            if cell_data.get("fill_color") and cell_data["fill_color"] != "FFFFFF":
                fill = text_box.fill
                fill.solid()
                try:
                    rgb_hex = cell_data["fill_color"]
                    if len(rgb_hex) == 8:  # ARGB format
                        rgb_hex = rgb_hex[2:]  # Remove alpha
                    r = int(rgb_hex[0:2], 16)
                    g = int(rgb_hex[2:4], 16)
                    b = int(rgb_hex[4:6], 16)
                    fill.fore_color.rgb = RGBColor(r, g, b)
                except:
                    pass
            
            # Add text
            text_frame = text_box.text_frame
            text_frame.margin_left = Pt(5)
            text_frame.margin_right = Pt(5)
            text_frame.margin_top = Pt(2)
            text_frame.margin_bottom = Pt(2)
            text_frame.word_wrap = True
            
            p = text_frame.paragraphs[0]
            p.text = str(cell_data.get("value", ""))
            
            # Set font properties
            font = p.font
            font.name = formatting.font_family
            font.size = Pt(formatting.font_size)
            
            if cell_data.get("font_bold"):
                font.bold = True
            
            # Set alignment
            alignment_map = {
                "left": PP_ALIGN.LEFT,
                "center": PP_ALIGN.CENTER,
                "right": PP_ALIGN.RIGHT
            }
            p.alignment = alignment_map.get(cell_data.get("alignment", "left"), PP_ALIGN.LEFT)
            
            # Handle table alignment
            if formatting.table_alignment == "center":
                text_frame.vertical_anchor = MSO_ANCHOR.MIDDLE
            
            current_left += cell_width
        
        current_top += row_height
    
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
                    row_data.append({
                        "value": str(cell.value) if cell.value is not None else "",
                        "font_bold": cell.font.bold if cell.font else False,
                        "font_color": cell.font.color.rgb if cell.font and cell.font.color and cell.font.color.rgb else "000000",
                        "fill_color": cell.fill.fgColor.rgb if cell.fill and cell.fill.fgColor and cell.fill.fgColor.rgb else "FFFFFF",
                        "alignment": cell.alignment.horizontal if cell.alignment else "left"
                    })
                table_data.append(row_data)
            
            # Check if we need to split the table
            num_rows = len(table_data)
            if request.formatting_options.auto_split_large_tables and num_rows > request.formatting_options.max_rows_per_slide:
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
        
        # Clean up Excel file
        try:
            os.unlink(file_path)
        except:
            pass  # Ignore cleanup errors
        
        # Return the file and ensure it gets deleted after download
        return FileResponse(
            output_file.name,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            filename=f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pptx",
            background=None  # Ensure file is not deleted before sending
        )
        
    except Exception as e:
        # Clean up on error
        try:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.unlink(file_path)
        except:
            pass
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