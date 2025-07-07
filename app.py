from flask import Flask, request, render_template, send_file, flash, redirect, url_for, jsonify, Response
import os
import io
import json
import threading
import time
from werkzeug.utils import secure_filename
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Border
from openpyxl.utils import get_column_letter
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import tempfile

app = Flask(__name__)
app.config['SECRET_KEY'] = 'excel-to-ppt-converter-secret-key'
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Progress tracking
progress_data = {}
progress_lock = threading.Lock()

ALLOWED_EXTENSIONS = {'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
        else:
            # Convert other types to string
            rgb_str = str(rgb_str)
            if len(rgb_str) == 8:
                rgb_str = rgb_str[2:]
        
        # Convert to RGB tuple
        return tuple(int(rgb_str[i:i+2], 16) for i in (0, 2, 4))
    except:
        return None

def get_cell_display_value(cell):
    """Get the display value of a cell as it appears in Excel, preserving formatting"""
    if cell.value is None:
        return ""
    
    # Check if cell has number formatting
    if hasattr(cell, 'number_format') and cell.number_format:
        try:
            # Import required modules for number formatting
            from openpyxl.styles.numbers import BUILTIN_FORMATS
            import datetime
            
            number_format = cell.number_format
            cell_value = cell.value
            
            # Handle dates
            if isinstance(cell_value, datetime.datetime):
                if 'h' in number_format.lower() or 'mm' in number_format.lower():
                    # Date with time
                    if 'yyyy' in number_format or 'yy' in number_format:
                        return cell_value.strftime('%m/%d/%Y %H:%M:%S')
                    else:
                        return cell_value.strftime('%H:%M:%S')
                else:
                    # Date only
                    if 'yyyy' in number_format:
                        return cell_value.strftime('%m/%d/%Y')
                    elif 'yy' in number_format:
                        return cell_value.strftime('%m/%d/%y')
                    else:
                        return cell_value.strftime('%m/%d')
            
            elif isinstance(cell_value, datetime.date):
                if 'yyyy' in number_format:
                    return cell_value.strftime('%m/%d/%Y')
                elif 'yy' in number_format:
                    return cell_value.strftime('%m/%d/%y')
                else:
                    return cell_value.strftime('%m/%d')
            
            # Handle numbers with specific formatting
            elif isinstance(cell_value, (int, float)):
                # Check for percentage
                if '%' in number_format:
                    if isinstance(cell_value, float):
                        return f"{cell_value * 100:.1f}%" if cell_value != int(cell_value * 100) else f"{int(cell_value * 100)}%"
                    else:
                        return f"{cell_value * 100}%"
                
                # Check for currency
                elif '$' in number_format or '€' in number_format or '£' in number_format:
                    currency_symbol = '$' if '$' in number_format else ('€' if '€' in number_format else '£')
                    if '0.00' in number_format or '.00' in number_format:
                        return f"{currency_symbol}{cell_value:.2f}"
                    else:
                        return f"{currency_symbol}{cell_value:.0f}" if cell_value == int(cell_value) else f"{currency_symbol}{cell_value}"
                
                # Check for decimal places
                elif '0.00' in number_format:
                    return f"{cell_value:.2f}"
                elif '0.0' in number_format:
                    return f"{cell_value:.1f}"
                elif '0.000' in number_format:
                    return f"{cell_value:.3f}"
                elif '0.0000' in number_format:
                    return f"{cell_value:.4f}"
                
                # Check if should display as integer
                elif isinstance(cell_value, float) and cell_value.is_integer():
                    return str(int(cell_value))
                else:
                    return str(cell_value)
            
            # For other types, convert to string
            else:
                return str(cell_value)
                
        except Exception as e:
            print(f"Warning: Could not apply number format '{cell.number_format}' to value '{cell.value}': {e}")
            # Fallback to basic formatting
            pass
    
    # Fallback to basic formatting if no number format or formatting failed
    cell_value = cell.value
    if isinstance(cell_value, (int, float)):
        if isinstance(cell_value, float) and cell_value.is_integer():
            return str(int(cell_value))
        else:
            return str(cell_value)
    else:
        return str(cell_value)

def get_cell_style(cell):
    """Extract styling information from an Excel cell"""
    style = {}
    
    # Font styling
    if cell.font:
        if cell.font.bold:
            style['bold'] = True
        if cell.font.italic:
            style['italic'] = True
        if cell.font.color:
            font_color = None
            if hasattr(cell.font.color, 'rgb') and cell.font.color.rgb:
                font_color = rgb_to_hex(str(cell.font.color.rgb))
            elif hasattr(cell.font.color, 'indexed') and cell.font.color.indexed is not None:
                # Handle indexed colors
                try:
                    from openpyxl.styles.colors import COLOR_INDEX
                    if cell.font.color.indexed < len(COLOR_INDEX):
                        indexed_color = COLOR_INDEX[cell.font.color.indexed]
                        if indexed_color != 'FF000000':  # Not default black
                            font_color = rgb_to_hex(indexed_color[2:])  # Remove FF prefix
                except:
                    pass
            if font_color:
                style['font_color'] = font_color
        if cell.font.size:
            style['font_size'] = cell.font.size
    
    # Background color - handle different fill types
    if cell.fill:
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
        if bg_color:
            style['bg_color'] = bg_color
    
    # Alignment
    if cell.alignment:
        style['alignment'] = cell.alignment.horizontal
    
    # Border information
    style['borders'] = {}
    if cell.border:
        if cell.border.top and cell.border.top.style:
            style['borders']['top'] = True
        if cell.border.bottom and cell.border.bottom.style:
            style['borders']['bottom'] = True
        if cell.border.left and cell.border.left.style:
            style['borders']['left'] = True
        if cell.border.right and cell.border.right.style:
            style['borders']['right'] = True
    
    return style


def find_actual_data_range(worksheet):
    """Find the actual data range, excluding empty rows/columns at the start and hidden rows/columns"""
    # Find first row with data (excluding hidden rows)
    start_row = 1
    for row in range(1, worksheet.max_row + 1):
        # Skip hidden rows
        if worksheet.row_dimensions[row].hidden:
            continue
        has_data = False
        for col in range(1, worksheet.max_column + 1):
            # Skip hidden columns
            if worksheet.column_dimensions[get_column_letter(col)].hidden:
                continue
            if worksheet.cell(row=row, column=col).value is not None:
                has_data = True
                break
        if has_data:
            start_row = row
            break
    
    # Find first column with data (excluding hidden columns)
    start_col = 1
    for col in range(1, worksheet.max_column + 1):
        # Skip hidden columns
        if worksheet.column_dimensions[get_column_letter(col)].hidden:
            continue
        has_data = False
        for row in range(start_row, worksheet.max_row + 1):
            # Skip hidden rows
            if worksheet.row_dimensions[row].hidden:
                continue
            if worksheet.cell(row=row, column=col).value is not None:
                has_data = True
                break
        if has_data:
            start_col = col
            break
    
    # Find last row with data (excluding hidden rows)
    end_row = start_row
    for row in range(worksheet.max_row, start_row - 1, -1):
        # Skip hidden rows
        if worksheet.row_dimensions[row].hidden:
            continue
        has_data = False
        for col in range(start_col, worksheet.max_column + 1):
            # Skip hidden columns
            if worksheet.column_dimensions[get_column_letter(col)].hidden:
                continue
            if worksheet.cell(row=row, column=col).value is not None:
                has_data = True
                break
        if has_data:
            end_row = row
            break
    
    # Find last column with data (excluding hidden columns)
    end_col = start_col
    for col in range(worksheet.max_column, start_col - 1, -1):
        # Skip hidden columns
        if worksheet.column_dimensions[get_column_letter(col)].hidden:
            continue
        has_data = False
        for row in range(start_row, end_row + 1):
            # Skip hidden rows
            if worksheet.row_dimensions[row].hidden:
                continue
            if worksheet.cell(row=row, column=col).value is not None:
                has_data = True
                break
        if has_data:
            end_col = col
            break
    
    return start_row, start_col, end_row, end_col

def get_visible_row_col_mapping(worksheet, start_row, start_col, end_row, end_col):
    """Create mappings between visible and actual row/column indices"""
    visible_rows = []
    visible_cols = []
    row_mapping = {}  # visible index -> actual row
    col_mapping = {}  # visible index -> actual col
    
    # Map visible rows
    visible_idx = 0
    for row in range(start_row, end_row + 1):
        if not worksheet.row_dimensions[row].hidden:
            visible_rows.append(row)
            row_mapping[visible_idx] = row
            visible_idx += 1
    
    # Map visible columns
    visible_idx = 0
    for col in range(start_col, end_col + 1):
        if not worksheet.column_dimensions[get_column_letter(col)].hidden:
            visible_cols.append(col)
            col_mapping[visible_idx] = col
            visible_idx += 1
    
    return visible_rows, visible_cols, row_mapping, col_mapping


def get_merged_cells_info_visible(worksheet, visible_rows, visible_cols, row_mapping, col_mapping):
    """Get information about merged cells for visible rows/columns only"""
    merged_info = {}
    
    # Create reverse mappings (actual -> visible index)
    actual_to_visible_row = {actual: visible for visible, actual in row_mapping.items()}
    actual_to_visible_col = {actual: visible for visible, actual in col_mapping.items()}
    
    for merged_range in worksheet.merged_cells.ranges:
        # Check if any part of the merged range is visible
        visible_in_range = False
        min_visible_row = None
        max_visible_row = None
        min_visible_col = None
        max_visible_col = None
        
        for row in range(merged_range.min_row, merged_range.max_row + 1):
            if row in actual_to_visible_row:
                visible_in_range = True
                vis_row = actual_to_visible_row[row]
                if min_visible_row is None or vis_row < min_visible_row:
                    min_visible_row = vis_row
                if max_visible_row is None or vis_row > max_visible_row:
                    max_visible_row = vis_row
        
        for col in range(merged_range.min_col, merged_range.max_col + 1):
            if col in actual_to_visible_col:
                vis_col = actual_to_visible_col[col]
                if min_visible_col is None or vis_col < min_visible_col:
                    min_visible_col = vis_col
                if max_visible_col is None or vis_col > max_visible_col:
                    max_visible_col = vis_col
        
        # If the merged range has visible cells, add it to merged_info
        if visible_in_range and min_visible_row is not None and min_visible_col is not None:
            merged_info[(min_visible_row, min_visible_col)] = {
                'width': max_visible_col - min_visible_col + 1 if max_visible_col is not None else 1,
                'height': max_visible_row - min_visible_row + 1 if max_visible_row is not None else 1,
                'end_row': max_visible_row if max_visible_row is not None else min_visible_row,
                'end_col': max_visible_col if max_visible_col is not None else min_visible_col
            }
            
            # Mark other cells in the visible merged range as 'skip'
            for r in range(min_visible_row, (max_visible_row if max_visible_row is not None else min_visible_row) + 1):
                for c in range(min_visible_col, (max_visible_col if max_visible_col is not None else min_visible_col) + 1):
                    if (r, c) != (min_visible_row, min_visible_col):
                        merged_info[(r, c)] = 'skip'
    
    return merged_info

def get_merged_cells_info(worksheet, start_row, start_col, end_row, end_col):
    """Get information about merged cells in the data range"""
    merged_info = {}
    
    for merged_range in worksheet.merged_cells.ranges:
        # Check if merged range intersects with our data range
        if (merged_range.min_row <= end_row and merged_range.max_row >= start_row and
            merged_range.min_col <= end_col and merged_range.max_col >= start_col):
            
            # Adjust coordinates relative to our data range
            rel_min_row = max(merged_range.min_row - start_row, 0)
            rel_min_col = max(merged_range.min_col - start_col, 0)
            rel_max_row = min(merged_range.max_row - start_row, end_row - start_row)
            rel_max_col = min(merged_range.max_col - start_col, end_col - start_col)
            
            # Store merged cell info
            merged_info[(rel_min_row, rel_min_col)] = {
                'width': rel_max_col - rel_min_col + 1,
                'height': rel_max_row - rel_min_row + 1,
                'end_row': rel_max_row,
                'end_col': rel_max_col
            }
            
            # Mark all cells in this merged range
            for r in range(rel_min_row, rel_max_row + 1):
                for c in range(rel_min_col, rel_max_col + 1):
                    if (r, c) != (rel_min_row, rel_min_col):  # Don't mark the main cell
                        merged_info[(r, c)] = 'skip'
    
    return merged_info

def calculate_optimal_column_widths_visible(worksheet, data_rows, data_cols, available_width, row_mapping, col_mapping):
    """Calculate optimal column widths based on text content, ensuring no text wrapping"""
    # Extremely generous character width estimation to prevent any wrapping
    base_char_width = 0.25  # Massively increased to ensure absolutely no text wrapping
    
    # Calculate content width for each column
    col_widths = []
    for col_idx in range(data_cols):
        max_content_length = 0
        max_header_length = 0
        max_font_size = 10
        
        # Check all cells in this column, with special attention to headers
        for row_idx in range(data_rows):
            # Use mapping to get actual Excel row/column
            actual_row = row_mapping[row_idx]
            actual_col = col_mapping[col_idx]
            cell = worksheet.cell(row=actual_row, column=actual_col)
            if cell.value is not None:
                # Use formatted text value for accurate length calculation
                text_value = get_cell_display_value(cell)
                content_length = len(text_value)
                max_content_length = max(max_content_length, content_length)
                
                # Give extra weight to header rows (first 3 rows)
                if row_idx < 3:
                    max_header_length = max(max_header_length, content_length)
                
                # Check if cell has larger font size
                style = get_cell_style(cell)
                if 'font_size' in style:
                    max_font_size = max(max_font_size, style['font_size'])
        
        # Calculate required width based on content, being very generous to prevent wrapping
        if max_content_length == 0:
            required_width = 0.6  # Minimum width for empty columns
        else:
            # Scale character width based on font size with generous multiplier
            char_width = base_char_width * (max_font_size / 10.0)
            
            # Be massively generous with padding to ensure absolutely no wrapping
            header_width = max_header_length * char_width + 1.2  # Huge padding for headers
            content_width = max_content_length * char_width + 1.0  # Huge padding for content
            required_width = max(header_width, content_width)
            
            # Add extra buffer for any text longer than 8 characters
            if max_content_length > 8:
                required_width *= 1.4  # 40% extra for longer text
            elif max_content_length > 4:
                required_width *= 1.25  # 25% extra for medium text
            
            # Much higher minimum width to prevent cramped appearance
            required_width = max(required_width, 1.5)
        
        col_widths.append(required_width)
    
    # Scale column widths to fit available space, but be very conservative about scaling down
    total_required_width = sum(col_widths)
    if total_required_width > available_width:
        # Only scale down if we're significantly over budget
        overage_ratio = total_required_width / available_width
        if overage_ratio > 1.6:  # Only scale if we're 60% over - very conservative
            scale_factor = available_width / total_required_width
            col_widths = [w * scale_factor for w in col_widths]
        else:
            # If only moderately over, keep original widths to prevent text wrapping
            pass  # Keep original widths to maintain readability
    else:
        # If we have extra space, distribute it proportionally
        extra_space = available_width - total_required_width
        if total_required_width > 0:
            for i in range(len(col_widths)):
                col_widths[i] += extra_space * (col_widths[i] / total_required_width)
    
    return col_widths

def calculate_table_dimensions_visible(worksheet, max_rows, max_cols, row_mapping, col_mapping):
    """Calculate table dimensions for shape-based table with optimal column sizing"""
    # Standard PowerPoint slide dimensions (16:9)
    slide_width = 10.0  # inches
    slide_height = 7.5  # inches
    
    # Conservative margins
    margin = 0.5  # Smaller margins since we have precise control
    title_space = 0.4  # Smaller title space
    
    # Available space for table
    available_width = slide_width - (2 * margin)  # 9.0 inches
    available_height = slide_height - (2 * margin) - title_space  # 6.6 inches
    
    # Calculate optimal column widths based on content
    col_widths = calculate_optimal_column_widths_visible(worksheet, max_rows, max_cols, available_width, row_mapping, col_mapping)
    total_width = sum(col_widths)
    
    # Calculate row height based on available height
    row_height = available_height / max_rows
    
    # Determine font size based on row height and column width
    avg_col_width = total_width / max_cols
    min_dimension = min(avg_col_width, row_height)
    
    if min_dimension < 0.1:  # Very small cells
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
    
    # Ensure minimum readable row height based on font size
    min_row_height = (font_size + 3) / 72  # Font size plus padding in inches
    if row_height < min_row_height:
        row_height = min_row_height
        # Recalculate available height to fit all rows
        total_height_needed = row_height * max_rows
        if total_height_needed > available_height:
            # Scale down to fit
            scale_factor = available_height / total_height_needed
            row_height = row_height * scale_factor
            font_size = max(6, int(font_size * scale_factor))
    
    print(f"ADAPTIVE TABLE: {max_rows}x{max_cols} grid")
    width_strs = [f'{w:.2f}\"' for w in col_widths]
    print(f"Variable column widths: {width_strs}")
    print(f'Row height: {row_height:.3f}\", Font size: {font_size}pt')
    print(f'Total size: {total_width:.1f}\" x {row_height * max_rows:.1f}\"')
    
    return total_width, available_height, font_size, col_widths, row_height

def create_grouped_shape_table_visible(slide, worksheet, data_rows, data_cols, left, top, table_width, font_size, col_widths, row_height, row_mapping, col_mapping):
    """Create a resizable grouped shape table that mimics Excel layout exactly"""
    
    # Get merged cell information for visible cells
    if row_mapping and col_mapping:
        visible_rows = [row_mapping[i] for i in range(data_rows)]
        visible_cols = [col_mapping[i] for i in range(data_cols)]
        merged_info = get_merged_cells_info_visible(worksheet, visible_rows, visible_cols, row_mapping, col_mapping)
    else:
        # Fallback: empty merged info if no mappings provided
        merged_info = {}
    
    # Calculate table height
    table_height = row_height * data_rows
    
    # List to collect all shapes for grouping
    all_shapes = []
    
    # Create background rectangle for the entire table (no border like Excel)
    table_bg = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        left,
        top,
        Inches(table_width),
        Inches(table_height)
    )
    table_bg.fill.solid()
    table_bg.fill.fore_color.rgb = RGBColor(255, 255, 255)  # White background
    table_bg.line.fill.background()  # No border like Excel default
    table_bg.shadow.inherit = False  # Remove drop shadow
    all_shapes.append(table_bg)
    
    # Create individual cell shapes
    for row_idx in range(data_rows):
        for col_idx in range(data_cols):
            try:
                # Skip cells that are part of a merged range (but not the main cell)
                if (row_idx, col_idx) in merged_info and merged_info[(row_idx, col_idx)] == 'skip':
                    continue
                
                # Use mapping to get actual Excel row/column  
                actual_row = row_mapping[row_idx]
                actual_col = col_mapping[col_idx]
                excel_cell = worksheet.cell(row=actual_row, column=actual_col)
                style = get_cell_style(excel_cell)
                
                # Calculate cell position using cumulative column widths
                cell_left_offset = sum(col_widths[:col_idx])  # Sum of previous column widths
                cell_left = left + Inches(cell_left_offset)
                cell_top = top + Inches(row_idx * row_height)
                
                # Check if this cell is merged
                cell_width_total = col_widths[col_idx]  # Start with this column's width
                cell_height_multiplier = 1
                
                if (row_idx, col_idx) in merged_info and isinstance(merged_info[(row_idx, col_idx)], dict):
                    merge_info = merged_info[(row_idx, col_idx)]
                    # For merged cells, sum the widths of all spanned columns
                    end_col = min(col_idx + merge_info['width'] - 1, len(col_widths) - 1)
                    cell_width_total = sum(col_widths[col_idx:end_col + 1])
                    cell_height_multiplier = merge_info['height']
                
                cell_width = Inches(cell_width_total)
                cell_height = Inches(row_height * cell_height_multiplier)
                
                # Create cell background if it has color (no drop shadow)
                if 'bg_color' in style:
                    cell_bg = slide.shapes.add_shape(
                        MSO_SHAPE.RECTANGLE,
                        cell_left,
                        cell_top,
                        cell_width,
                        cell_height
                    )
                    cell_bg.fill.solid()
                    cell_bg.fill.fore_color.rgb = RGBColor(*style['bg_color'])
                    cell_bg.line.fill.background()  # No border on colored cells
                    cell_bg.shadow.inherit = False  # Remove drop shadow
                    all_shapes.append(cell_bg)
                
                # Add text box for cell content (no drop shadow)
                text_box = slide.shapes.add_textbox(
                    cell_left,
                    cell_top,
                    cell_width,
                    cell_height
                )
                text_box.shadow.inherit = False  # Remove drop shadow
                all_shapes.append(text_box)
                
                # Set cell text with preserved formatting
                text_value = get_cell_display_value(excel_cell)
                text_box.text = text_value
                
                # Format text (remove all drop shadows)
                if text_box.text_frame and text_box.text_frame.paragraphs:
                    # Set minimal margins
                    text_box.text_frame.margin_left = Inches(0.02)
                    text_box.text_frame.margin_right = Inches(0.02)
                    text_box.text_frame.margin_top = Inches(0.01)
                    text_box.text_frame.margin_bottom = Inches(0.01)
                    
                    # Center text vertically
                    text_box.text_frame.vertical_anchor = MSO_ANCHOR.MIDDLE
                    
                    # Disable text wrapping for headers to prevent line breaks
                    if row_idx < 3:  # Header rows
                        text_box.text_frame.word_wrap = False
                    
                    paragraph = text_box.text_frame.paragraphs[0]
                    
                    if paragraph.runs:
                        run = paragraph.runs[0]
                    else:
                        run = paragraph.add_run()
                        run.text = text_box.text
                    
                    # Apply font styling
                    run.font.size = Pt(font_size)
                    
                    if 'bold' in style:
                        run.font.bold = style['bold']
                    if 'italic' in style:
                        run.font.italic = style['italic']
                    if 'font_color' in style:
                        run.font.color.rgb = RGBColor(*style['font_color'])
                    else:
                        run.font.color.rgb = RGBColor(0, 0, 0)  # Default black text
                    
                    # Apply alignment
                    if 'alignment' in style:
                        if style['alignment'] == 'center':
                            paragraph.alignment = PP_ALIGN.CENTER
                        elif style['alignment'] == 'right':
                            paragraph.alignment = PP_ALIGN.RIGHT
                        else:
                            paragraph.alignment = PP_ALIGN.LEFT
                    else:
                        # Default alignment based on content type
                        if isinstance(excel_cell.value, (int, float)):
                            paragraph.alignment = PP_ALIGN.RIGHT
                        else:
                            paragraph.alignment = PP_ALIGN.LEFT
                    
                    # Minimal paragraph spacing
                    paragraph.space_before = Pt(0)
                    paragraph.space_after = Pt(0)
                    paragraph.line_spacing = 1.0
                    
            except Exception as e:
                print(f"ERROR: Could not create cell [{row_idx+1}, {col_idx+1}]: {e}")
    
    # Draw gridlines only around cells that have data or background colors
    
    # First, identify which cells should have borders (data or colored)
    cells_with_borders = set()
    for row_idx in range(data_rows):
        for col_idx in range(data_cols):
            # Use mapping to get actual Excel row/column
            actual_row = row_mapping[row_idx]
            actual_col = col_mapping[col_idx]
            excel_cell = worksheet.cell(row=actual_row, column=actual_col)
            style = get_cell_style(excel_cell)
            
            # Cell should have borders if it has data or background color
            formatted_value = get_cell_display_value(excel_cell)
            has_data = formatted_value.strip()
            has_background = 'bg_color' in style
            
            if has_data or has_background:
                cells_with_borders.add((row_idx, col_idx))
    
    # For each cell that needs borders, draw the appropriate border lines
    cumulative_widths = [0]
    for col_idx in range(data_cols):
        cumulative_widths.append(cumulative_widths[-1] + col_widths[col_idx])
    
    # Draw borders for each cell that needs them
    for (row_idx, col_idx) in cells_with_borders:
        # Skip if this cell is part of a merged range (but not the main cell)
        if (row_idx, col_idx) in merged_info and merged_info[(row_idx, col_idx)] == 'skip':
            continue
        
        # Calculate cell position
        cell_left_pos = left + Inches(cumulative_widths[col_idx])
        cell_top_pos = top + Inches(row_idx * row_height)
        
        # Determine cell dimensions (considering merged cells)
        cell_width_spans = 1
        cell_height_spans = 1
        
        if (row_idx, col_idx) in merged_info and isinstance(merged_info[(row_idx, col_idx)], dict):
            merge_info = merged_info[(row_idx, col_idx)]
            cell_width_spans = merge_info['width']
            cell_height_spans = merge_info['height']
        
        cell_width_inches = sum(col_widths[col_idx:col_idx + cell_width_spans])
        cell_height_inches = row_height * cell_height_spans
        
        # Draw top border
        should_draw_top = True
        if row_idx > 0:
            # Check if cell above also has borders
            above_cell = (row_idx - 1, col_idx)
            if above_cell in cells_with_borders:
                # Check if it's part of the same merged cell
                if above_cell in merged_info and isinstance(merged_info[above_cell], dict):
                    above_merge = merged_info[above_cell]
                    if (row_idx - 1 + above_merge['height']) > row_idx:
                        should_draw_top = False
                elif (row_idx, col_idx) in merged_info and isinstance(merged_info[(row_idx, col_idx)], dict):
                    # This cell is merged and might connect with above
                    should_draw_top = True
        
        if should_draw_top:
            line = slide.shapes.add_connector(
                1,  # Straight line
                cell_left_pos,
                cell_top_pos,
                cell_left_pos + Inches(cell_width_inches),
                cell_top_pos
            )
            line.line.color.rgb = RGBColor(200, 200, 200)
            line.line.width = Pt(0.5)
            line.shadow.inherit = False
            all_shapes.append(line)
        
        # Draw bottom border
        line = slide.shapes.add_connector(
            1,  # Straight line
            cell_left_pos,
            cell_top_pos + Inches(cell_height_inches),
            cell_left_pos + Inches(cell_width_inches),
            cell_top_pos + Inches(cell_height_inches)
        )
        line.line.color.rgb = RGBColor(200, 200, 200)
        line.line.width = Pt(0.5)
        line.shadow.inherit = False
        all_shapes.append(line)
        
        # Draw left border
        should_draw_left = True
        if col_idx > 0:
            # Check if cell to the left also has borders
            left_cell = (row_idx, col_idx - 1)
            if left_cell in cells_with_borders:
                # Check if it's part of the same merged cell
                if left_cell in merged_info and isinstance(merged_info[left_cell], dict):
                    left_merge = merged_info[left_cell]
                    if (col_idx - 1 + left_merge['width']) > col_idx:
                        should_draw_left = False
        
        if should_draw_left:
            line = slide.shapes.add_connector(
                1,  # Straight line
                cell_left_pos,
                cell_top_pos,
                cell_left_pos,
                cell_top_pos + Inches(cell_height_inches)
            )
            line.line.color.rgb = RGBColor(200, 200, 200)
            line.line.width = Pt(0.5)
            line.shadow.inherit = False
            all_shapes.append(line)
        
        # Draw right border
        line = slide.shapes.add_connector(
            1,  # Straight line
            cell_left_pos + Inches(cell_width_inches),
            cell_top_pos,
            cell_left_pos + Inches(cell_width_inches),
            cell_top_pos + Inches(cell_height_inches)
        )
        line.line.color.rgb = RGBColor(200, 200, 200)
        line.line.width = Pt(0.5)
        line.shadow.inherit = False
        all_shapes.append(line)
    
    # Group all shapes together for unified resizing
    if len(all_shapes) > 1:
        try:
            # Create a group from all shapes
            grouped_table = slide.shapes._spTree.add_grpSp()
            
            # Move all shapes into the group
            for shape in all_shapes:
                grouped_table.append(shape._element)
                
            print(f"Successfully grouped {len(all_shapes)} shapes into resizable table")
            return grouped_table
        except Exception as e:
            print(f"Warning: Could not group shapes: {e}")
            # Return the background shape as fallback
            return all_shapes[0] if all_shapes else None
    else:
        return all_shapes[0] if all_shapes else None

def update_progress(session_id, percent, status):
    """Update progress for a session"""
    with progress_lock:
        progress_data[session_id] = {
            'percent': percent,
            'status': status,
            'timestamp': time.time()
        }

def convert_excel_to_ppt(excel_file_path, session_id=None):
    """Convert Excel workbook to PowerPoint presentation using shape-based tables"""
    start_time = time.time()
    
    try:
        # Load Excel workbook with optimizations
        if session_id:
            update_progress(session_id, 5, "Loading Excel workbook...")
        print("Loading Excel workbook...")
        # Suppress warnings about unsupported features like sparklines
        import warnings
        warnings.filterwarnings('ignore', category=UserWarning, message='.*sparkline.*')
        workbook = load_workbook(excel_file_path, data_only=True, read_only=False)
        print(f"Loaded workbook with {len(workbook.sheetnames)} sheets")
        if session_id:
            update_progress(session_id, 10, f"Loaded {len(workbook.sheetnames)} sheets")
        
        # Create PowerPoint presentation
        prs = Presentation()
        
        # Process each worksheet
        total_sheets = len([name for name in workbook.sheetnames if workbook[name].sheet_state != 'hidden'])
        processed_sheets = 0
        
        for sheet_name in workbook.sheetnames:
            worksheet = workbook[sheet_name]
            
            # Skip hidden sheets
            if worksheet.sheet_state == 'hidden':
                print(f"Skipping hidden sheet: '{sheet_name}'")
                continue
            
            # Update progress
            if session_id:
                update_progress(session_id, 15 + (processed_sheets / total_sheets) * 10, f"Analyzing sheet: {sheet_name}")
            
            # Find actual data range (trim whitespace and hidden rows/columns)
            start_row, start_col, end_row, end_col = find_actual_data_range(worksheet)
            
            # Skip empty worksheets
            if start_row > end_row or start_col > end_col:
                print(f"Skipping sheet '{sheet_name}' - no data found")
                continue
            
            # Update progress
            if session_id:
                update_progress(session_id, 20 + (processed_sheets / total_sheets) * 15, f"Processing data for sheet: {sheet_name}")
            
            # Get visible row/column mapping
            visible_rows, visible_cols, row_mapping, col_mapping = get_visible_row_col_mapping(
                worksheet, start_row, start_col, end_row, end_col
            )
            
            # Use visible rows/cols for data dimensions
            data_rows = len(visible_rows)
            data_cols = len(visible_cols)
            
            if data_rows == 0 or data_cols == 0:
                print(f"Skipping sheet '{sheet_name}' - no visible data")
                continue
            
            # Add slide
            slide_layout = prs.slide_layouts[5]  # Blank layout
            slide = prs.slides.add_slide(slide_layout)
            
            # Add minimal title (no drop shadow)
            title_shape = slide.shapes.title
            if title_shape:
                title_shape.text = sheet_name
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
                        title_run.text = sheet_name
                    title_run.font.size = Pt(11)
                    title_para.alignment = PP_ALIGN.CENTER
            
            print(f"\n{'='*60}")
            print(f"Processing sheet '{sheet_name}':")
            print(f"  Data range: {start_row}-{end_row} rows, {start_col}-{end_col} columns")
            print(f"  Actual data: {data_rows} rows x {data_cols} columns")
            
            # Update progress
            if session_id:
                update_progress(session_id, 35 + (processed_sheets / total_sheets) * 20, f"Calculating dimensions for sheet: {sheet_name}")
            
            # Calculate table dimensions with adaptive column widths
            print(f"Calculating table dimensions for sheet '{sheet_name}'...")
            table_width, available_height, font_size, col_widths, row_height = calculate_table_dimensions_visible(
                worksheet, data_rows, data_cols, row_mapping, col_mapping
            )
            
            # Position table
            margin = 0.5
            left = Inches(margin)
            top = Inches(margin + 0.4)
            
            # Update progress
            if session_id:
                update_progress(session_id, 55 + (processed_sheets / total_sheets) * 30, f"Creating table for sheet: {sheet_name}")
            
            print(f"Creating grouped shape table at ({margin:.1f}\", {margin+0.4:.1f}\")")
            
            # Create the grouped shape table with proper data range and variable column widths
            print(f"Building PowerPoint table for sheet '{sheet_name}' with {data_rows}x{data_cols} visible cells...")
            table_shape = create_grouped_shape_table_visible(
                slide, worksheet, data_rows, data_cols, left, top, 
                table_width, font_size, col_widths, row_height, row_mapping, col_mapping
            )
            
            print(f"Completed sheet '{sheet_name}' with grouped resizable table")
            processed_sheets += 1
            if session_id:
                progress_percent = 10 + (processed_sheets / total_sheets) * 80
                update_progress(session_id, progress_percent, f"Completed sheet {processed_sheets}/{total_sheets}: {sheet_name}")
        
        # Save PowerPoint file
        if session_id:
            update_progress(session_id, 95, "Saving PowerPoint file...")
        output_path = os.path.join(app.config['UPLOAD_FOLDER'], 'converted_presentation.pptx')
        prs.save(output_path)
        if session_id:
            update_progress(session_id, 100, "Conversion complete!")
        
        elapsed_time = time.time() - start_time
        print(f"Conversion completed in {elapsed_time:.2f} seconds")
        
        return output_path
        
    except TimeoutError as e:
        if session_id:
            update_progress(session_id, 0, "Conversion timed out - file too large")
        raise Exception("Conversion timed out. File may be too large or complex.")
        
    except Exception as e:
        if session_id:
            update_progress(session_id, 0, f"Error: {str(e)}")
        raise Exception(f"Error converting Excel to PowerPoint: {str(e)}")

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        # Check if file was uploaded
        if 'file' not in request.files:
            flash('No file selected')
            return redirect(request.url)
        
        file = request.files['file']
        
        # Check if file was actually selected
        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)
        
        # Validate file type
        if not allowed_file(file.filename):
            flash('Please upload an Excel file (.xlsx)')
            return redirect(request.url)
        
        try:
            # Save uploaded file
            filename = secure_filename(file.filename)
            input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(input_path)
            
            # Get session ID for progress tracking
            session_id = request.form.get('session_id', str(int(time.time() * 1000)))
            
            # Convert to PowerPoint
            output_path = convert_excel_to_ppt(input_path, session_id)
            
            # Clean up input file
            if os.path.exists(input_path):
                os.remove(input_path)
            
            # Send converted file
            return send_file(
                output_path,
                as_attachment=True,
                download_name=f"{filename.rsplit('.', 1)[0]}_converted.pptx",
                mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation'
            )
            
        except Exception as e:
            flash(f'Error processing file: {str(e)}')
            return redirect(request.url)
    
    return render_template('index.html')

@app.route('/progress/<session_id>')
def get_progress(session_id):
    """Get progress for a session"""
    with progress_lock:
        if session_id in progress_data:
            return jsonify(progress_data[session_id])
        else:
            return jsonify({'percent': 0, 'status': 'Not found', 'timestamp': time.time()})

@app.errorhandler(413)
def too_large(e):
    flash('File is too large. Maximum size is 16MB.')
    return redirect(url_for('upload_file'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)