This Claude project is designed to build a web-based tool that lets users upload complex Excel workbooks and converts each sheet into a fully formatted slide in a PowerPoint presentation.

### Project Name: Excel-to-PPT Slide Converter

### Goal:
Create a web app that:
- Accepts `.xlsx` uploads via clean web interface
- Processes each sheet individually with intelligent data trimming
- Extracts tables and preserves ALL visible formatting:  
  - Merged cells (preserved exactly as in Excel)
  - Font style, size, color, bold, italic
  - Cell background colors  
  - Text alignment (left, center, right)
  - Smart column width optimization
- Automatically resizes content to fit within slide boundaries (no clipping)
- Generates a `.pptx` file with one slide per sheet using shape-based table layout
- Corporate-quality output with no drop shadows or unwanted formatting

### Technical Stack:
- **Backend**: Flask (Python web framework)
- **Excel Processing**: openpyxl (preserves formatting and merged cell information)
- **PowerPoint Generation**: python-pptx with custom shape-based table implementation
- **Frontend**: Modern HTML/CSS with responsive design and file upload
- **Deployment**: Ready for Render, Vercel, or similar platforms

### Key Features:
1. **File Upload Interface**: Clean web form with drag-and-drop .xlsx file uploads
2. **Smart Excel Processing**: Automatically trims whitespace and finds actual data range
3. **Shape-Based Tables**: Custom implementation bypassing PowerPoint's table limitations
4. **Adaptive Column Sizing**: Intelligent width calculation based on content and headers
5. **Merged Cell Support**: Perfect preservation of Excel merged cell layouts
6. **Professional Formatting**: Clean appearance with no drop shadows or unwanted effects
7. **Header Optimization**: Special handling for header rows with no text wrapping
8. **Auto-Download**: Seamless .pptx file generation and download

### Advanced Implementation Details:

#### Shape-Based Table System:
- **Individual text boxes**: Each cell is a precisely positioned text box
- **Variable column widths**: Content-driven sizing with header priority
- **Merged cell support**: Spans multiple text boxes for merged ranges
- **Clean gridlines**: Subtle Excel-like appearance, hidden in header areas
- **Perfect positioning**: Mathematical precision using cumulative width calculations

#### Smart Column Width Algorithm:
- Analyzes text content length in each column
- Prioritizes header text to prevent wrapping
- Scales proportionally to fit within slide boundaries
- Provides extra padding for headers vs data cells
- Handles font size variations automatically

#### Content Processing:
- **Data range detection**: Automatically finds first/last rows and columns with data
- **Merged cell mapping**: Tracks all merged ranges and their dimensions
- **Style extraction**: Preserves fonts, colors, alignment, and backgrounds
- **Format conversion**: Handles numbers, text, and mixed content types

#### Professional Output:
- **No drop shadows**: Explicit removal from all shapes and elements
- **Excel-like gridlines**: Nearly invisible lines (RGB 230,230,230, 0.1pt width)
- **Clean headers**: No gridlines in header area for professional appearance
- **Optimal fonts**: 6-12pt scaling based on table size and content

### Development Notes:
- Uses shape-based approach instead of PowerPoint's native table API
- Bypasses PowerPoint's minimum row height limitations completely  
- Handles complex Excel files with 50+ rows and 20+ columns efficiently
- Ensures all content fits within standard slide margins (0.5" margins)
- Provides comprehensive error handling for edge cases
- Maintains corporate PowerPoint presentation standards

### Performance:
- Processes large tables (51x20 = 1,020 cells) in seconds
- Creates thousands of individual shapes with precise formatting
- Scales to handle multiple worksheets automatically
- Memory efficient with proper cleanup of temporary files