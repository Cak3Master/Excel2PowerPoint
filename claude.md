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
- **Backend**: FastAPI (Python web framework) with comprehensive API endpoints
- **Excel Processing**: openpyxl (preserves formatting and merged cell information)
- **PowerPoint Generation**: python-pptx with custom shape-based table implementation
- **Pivot Table Generation**: pandas for data manipulation and Excel pivot table creation
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
- **Excel Export**: Generate Excel files with formatted pivot tables using pandas

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

### Recent Fixes and Improvements:

#### Fixed Issues (Latest Updates):
1. **Column Header Extraction and Preservation**:
   - **CRITICAL FIX**: Resolved column names showing as A, B, C instead of actual header names
   - Implemented intelligent header detection that analyzes all sheets in Excel files
   - Added smart sheet selection algorithm that prioritizes sheets with meaningful headers
   - Enhanced header extraction to handle various Excel layouts and merged cells
   - Fixed issue where first sheet's headers were used regardless of quality
   - Now correctly extracts and displays original column names like "LOB", "ETP Name", "Status"

2. **Intelligent Multi-Sheet Processing**:
   - Added comprehensive analysis of all Excel sheets to find best available headers
   - Implemented fallback logic that only uses Excel column letters (A, B, C) as last resort
   - Enhanced debug logging to trace header extraction process
   - Fixed backend logic to select sheets with >50% meaningful headers over generic ones

3. **Excel Processing Dependencies**:
   - Resolved missing openpyxl dependency issues causing import errors
   - Fixed backend crashes related to Excel file processing
   - Enhanced error handling for malformed Excel files
   - Added proper dependency management for production deployment

4. **Preset Creation Frequency Error**: 
   - Fixed duplicate preset creation that was causing 500 errors
   - Improved validation to prevent redundant preset generation
   - Enhanced error handling for preset management

5. **Excel Generation with Actual Pivot Tables**:
   - Implemented proper pandas pivot table generation using openpyxl
   - Fixed Excel export to include actual pivot table objects, not just formatted data
   - Added support for multiple pivot tables in single Excel file
   - Improved data aggregation and summarization

6. **Notification System Improvements**:
   - Fixed notification scaling and positioning issues
   - Improved notification timeout and auto-dismiss functionality
   - Enhanced notification styling for better readability
   - Added proper notification state management

7. **Comprehensive Debugging System**:
   - Added extensive logging throughout the application
   - Implemented debug endpoints for testing and troubleshooting
   - Enhanced error messages with detailed context
   - Added performance monitoring and timing metrics

8. **Pivot Table Field List Editor**:
   - Fixed field list population issues
   - Improved drag-and-drop functionality
   - Enhanced field validation and error handling
   - Fixed null checks and configuration validation

9. **Duplicate Component Rendering**:
   - Fixed MultiSourceUpload component duplicate rendering
   - Improved React key management and component lifecycle
   - Enhanced state management to prevent duplicate renders

#### Development Workflow and Debugging:

**Backend Development**:
- FastAPI application with comprehensive endpoints
- Automatic API documentation at `/docs`
- File upload handling with proper validation
- Temporary file management and cleanup
- Error handling with detailed JSON responses

**Frontend Development**:
- React with TypeScript for type safety
- Zustand for state management with persistence
- Tailwind CSS for responsive design
- Component-based architecture with proper separation of concerns
- Real-time updates and notifications

**Testing and Debugging**:
- Backend endpoint testing via FastAPI docs interface
- Frontend debugging with React DevTools
- Network request monitoring in browser DevTools
- Comprehensive logging for troubleshooting
- File upload and processing verification

#### Known Issues and Solutions:

1. **Large File Processing**:
   - **Issue**: Memory usage spikes with very large Excel files
   - **Solution**: Implement chunked processing and streaming uploads
   - **Workaround**: Process files under 50MB for optimal performance

2. **Complex Pivot Table Configurations**:
   - **Issue**: Some advanced pivot table features not fully supported
   - **Solution**: Enhanced pandas integration with more aggregation options
   - **Status**: Ongoing improvement

3. **Browser Compatibility**:
   - **Issue**: Some features may not work in older browsers
   - **Solution**: Modern browser requirement (Chrome 90+, Firefox 88+, Safari 14+)
   - **Workaround**: Display browser compatibility warning

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

### Required Dependencies:

#### Backend (Python):
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
openpyxl==3.1.2
pandas==2.1.3
python-pptx==0.6.23
pydantic==2.5.0
```

#### Frontend (Node.js):
```
react: ^18.2.0
typescript: ^4.9.5
tailwindcss: ^3.3.0
zustand: ^4.4.7
axios: ^1.6.0
react-dropzone: ^14.2.3
@headlessui/react: ^1.7.17
@heroicons/react: ^2.0.18
```

### Performance:
- Processes large tables (51x20 = 1,020 cells) in seconds
- Creates thousands of individual shapes with precise formatting
- Scales to handle multiple worksheets automatically
- Memory efficient with proper cleanup of temporary files
- Real-time pivot table configuration with instant feedback
- Optimized Excel generation with actual pivot table objects

### Current Development Status:
- **Core Features**: Complete and functional
- **Pivot Table System**: Fully implemented with Excel export
- **Label Management**: Complete with validation
- **File Upload**: Working with proper error handling
- **Notification System**: Fixed and optimized
- **PowerPoint Export**: Functional with formatting preservation
- **Documentation**: Updated with current features and troubleshooting

### Next Steps for Enhancement:
1. **Advanced Data Validation**: Enhanced column type detection and validation
2. **Chart Generation**: Add chart creation from pivot table data
3. **Template System**: Predefined templates for common report types
4. **Batch Processing**: Process multiple files simultaneously
5. **User Management**: Add user accounts and saved configurations
6. **Cloud Storage**: Integration with cloud storage providers
7. **Advanced Analytics**: Statistical analysis and data insights
8. **Export Options**: Additional export formats (PDF, CSV, etc.)