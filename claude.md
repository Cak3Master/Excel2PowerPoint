This Claude project is designed to build a comprehensive web-based tool that lets users upload complex Excel workbooks and converts each sheet into a fully formatted slide in a PowerPoint presentation, with advanced pivot table functionality and intelligent data management.

### Project Name: Excel-to-PPT Slide Converter with Pivot Table Analytics

### Goal:
Create a web app that:
- Accepts `.xlsx` uploads via clean web interface with drag-and-drop functionality
- **Label-based data management**: Create reusable labels for recurring data structures
- **Advanced pivot table creation**: Configure multiple pivot tables with intuitive field mapping
- **Multi-source data integration**: Combine multiple Excel files with relationship detection
- **Excel export functionality**: Generate comprehensive Excel files with pivot tables and raw data
- **PowerPoint slide generation**: Convert Excel sheets to formatted PowerPoint slides
- Preserves ALL visible formatting (merged cells, fonts, colors, alignment)
- Automatically resizes content to fit within slide boundaries (no clipping)
- Corporate-quality output with no drop shadows or unwanted formatting

### Technical Stack:
- **Backend**: Flask (Python web framework) with comprehensive API endpoints
- **Excel Processing**: openpyxl (preserves formatting and merged cell information)
- **PowerPoint Generation**: python-pptx with custom shape-based table implementation
- **Frontend**: React with TypeScript, Tailwind CSS, and modern component architecture
- **State Management**: Zustand for application state and notifications
- **Data Management**: Label-based organization with preset configurations
- **Deployment**: Docker-ready with production configurations

### Key Features:
1. **Multi-Source Data Upload**: Upload multiple Excel files with automatic metadata extraction
2. **Label-Based Organization**: Create and manage reusable labels for data structures
3. **Advanced Pivot Table Builder**: Intuitive drag-and-drop interface for field configuration
4. **Data Relationship Detection**: Automatically identify relationships between datasets
5. **Preset Management**: Save and reuse pivot table configurations
6. **Excel Export**: Generate comprehensive Excel files with multiple pivot tables
7. **PowerPoint Conversion**: Convert Excel sheets to formatted presentation slides
8. **Real-time Search**: Search through available fields and columns
9. **Professional Output**: Clean formatting with no drop shadows or unwanted effects
10. **Responsive Design**: Modern UI that works on desktop and mobile devices

### Advanced Implementation Details:

#### Label-Based Data Management:
- **Reusable Data Labels**: Create labels for recurring data structures and patterns
- **Expected Column Mapping**: Define expected columns for data validation
- **Usage Tracking**: Monitor how frequently labels are used
- **Color-Coded Organization**: Visual organization with customizable colors
- **Validation Rules**: Ensure data consistency across uploads
- **Search and Filter**: Quickly find labels by name, description, or column names

#### Pivot Table System:
- **Multiple Pivot Tables**: Create multiple pivot tables from single or combined data sources
- **Field Configuration**: Drag-and-drop interface for rows, columns, and values
- **Aggregation Options**: Sum, count, average, min, max calculations
- **Preset Management**: Save and load pivot table configurations
- **Real-time Search**: Search through available fields and data sources
- **Live Preview**: See configuration changes in real-time
- **Excel Export**: Generate Excel files with formatted pivot tables

#### Data Relationship Detection:
- **Automatic Analysis**: Identify potential relationships between datasets
- **Common Field Detection**: Find matching column names and data types
- **Relationship Mapping**: Visual representation of data connections
- **Multi-source Integration**: Combine data from multiple Excel files
- **Validation Checks**: Ensure data integrity across sources

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
- **Frontend Architecture**: React with TypeScript for type safety and modern component patterns
- **State Management**: Zustand stores for application state and notifications
- **API Design**: RESTful endpoints for data management, pivot tables, and export functionality
- **Component Structure**: Modular components for labels, pivot tables, and file management
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Performance**: Efficient data processing with lazy loading and pagination
- **Accessibility**: ARIA labels and keyboard navigation support
- **Testing**: Unit tests for critical components and API endpoints
- **Docker Support**: Containerized deployment for easy scaling
- **Security**: Input validation and sanitization for file uploads

### Performance:
- Processes large tables (51x20 = 1,020 cells) in seconds
- Creates thousands of individual shapes with precise formatting
- Scales to handle multiple worksheets automatically
- Memory efficient with proper cleanup of temporary files