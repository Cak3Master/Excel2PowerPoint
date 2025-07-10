# Excel to PowerPoint Converter with Advanced Analytics

A comprehensive web application that converts Excel workbooks into perfectly formatted PowerPoint presentations, featuring advanced pivot table creation, label-based data management, and multi-source data integration. The application combines a modern React TypeScript frontend with a powerful Flask backend to provide enterprise-grade data processing capabilities.

## ✨ Recent Updates

### Latest Improvements (Current Version)
- **Fixed Preset Creation Frequency Error**: Resolved duplicate preset creation causing server errors
- **Enhanced Excel Generation**: Now generates actual Excel pivot tables using pandas, not just formatted data
- **Improved Notification System**: Fixed scaling, positioning, and auto-dismiss functionality
- **Comprehensive Debugging**: Added extensive logging and debug endpoints
- **Fixed Pivot Table Field Editor**: Resolved field list population and drag-and-drop issues
- **Eliminated Duplicate Rendering**: Fixed MultiSourceUpload component rendering duplicates
- **Enhanced Error Handling**: Better validation and user-friendly error messages
- **Performance Optimizations**: Improved memory usage and processing speed

### Current Feature Status
- ✅ **Core Features**: Complete and fully functional
- ✅ **Pivot Table System**: Implemented with real Excel pivot table generation
- ✅ **Label Management**: Complete with validation and color coding
- ✅ **File Upload**: Working with proper error handling and progress indicators
- ✅ **Notification System**: Fixed and optimized for better user experience
- ✅ **PowerPoint Export**: Functional with formatting preservation
- ✅ **Documentation**: Updated with current features and troubleshooting guides

## 🚀 Features

### Advanced Data Management
- **Multi-source data upload** - Upload and combine multiple Excel files
- **Label-based organization** - Create reusable labels for recurring data structures
- **Data relationship detection** - Automatically identify connections between datasets
- **Column validation** - Validate data against expected column structures
- **Usage tracking** - Monitor how frequently data labels are used
- **Search and filtering** - Find labels and data sources quickly

### Powerful Pivot Table Creation
- **Multiple pivot tables** - Create multiple pivot tables from single or combined data sources
- **Intuitive field configuration** - Drag-and-drop interface for rows, columns, and values
- **Advanced aggregations** - Sum, count, average, min, max calculations
- **Preset management** - Save and reuse pivot table configurations
- **Real-time search** - Search through available fields and data sources
- **Excel export** - Generate comprehensive Excel files with formatted pivot tables

### Professional PowerPoint Output
- **Shape-based tables** - Custom implementation for precise control over table formatting
- **Adaptive column sizing** - Intelligent width calculation based on content
- **Perfect slide fit** - Always scales to fit within slide boundaries
- **Corporate formatting** - Clean, professional appearance with customizable styling
- **Format preservation** - Maintains fonts, colors, alignment, and styling
- **Merged cell support** - Handles complex merged cell layouts

### Modern User Interface
- **Responsive design** - Works seamlessly on desktop and mobile devices
- **Real-time feedback** - Live updates and progress indicators
- **Error handling** - Comprehensive error messages and recovery options
- **Accessibility** - Full keyboard navigation and screen reader support
- **Theme support** - Light and dark mode options
- **Multi-language** - Internationalization ready

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Tailwind CSS, Zustand state management
- **Backend**: FastAPI with Python 3.8+, RESTful API architecture
- **File Processing**: openpyxl for Excel, python-pptx for PowerPoint
- **Data Analysis**: pandas for data manipulation, pivot table generation
- **State Management**: Zustand for frontend state, in-memory data storage
- **Containerization**: Docker and Docker Compose with multi-stage builds

### System Architecture
```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│  React Frontend │ ◄─────────────────► │  Flask Backend   │
│   (Port 3000)   │                     │   (Port 8000)    │
│                 │                     │                  │
│ • Label Manager │                     │ • Data Processing│
│ • Pivot Builder │                     │ • Label Storage  │
│ • File Upload   │                     │ • Excel Export   │
│ • Excel Preview │                     │ • PPT Generation │
└─────────────────┘                     └─────────────────┘
        │                                        │
        │                                        │
        ▼                                        ▼
┌─────────────────┐                     ┌─────────────────┐
│   Static Files  │                     │  File Processing │
│   (Nginx Proxy) │                     │   (Temp Storage) │
└─────────────────┘                     └─────────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ SQLite Database │
                                        │ • Labels        │
                                        │ • Presets       │
                                        │ • Relationships │
                                        └─────────────────┘
```

## 📋 Prerequisites

### Required Software
- **Docker** 20.10+ and Docker Compose 2.0+
- **Node.js** 16+ (for local development)
- **Python** 3.8+ (for local development)
- **Git** (for version control)

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 1GB free space for dependencies
- **Network**: Internet connection for initial setup

## 🛠️ Installation & Setup

### Quick Start with Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd excel2powerpoint
```

2. **Start the application**
```bash
docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/docs

### Local Development Setup

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Required Python packages:
# - fastapi==0.104.1
# - uvicorn[standard]==0.24.0
# - python-multipart==0.0.6
# - openpyxl==3.1.2
# - pandas==2.1.3
# - python-pptx==0.6.23
# - pydantic==2.5.0

# Run the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 📖 Usage Guide

### Getting Started

1. **Upload Data Sources**
   - Navigate to the "Data Sources" section
   - Click "Upload Files" or drag and drop your .xlsx files
   - The system analyzes each file and extracts metadata

2. **Create Data Labels (Optional)**
   - Go to the "Labels" section to create reusable data labels
   - Define expected columns and validation rules
   - Assign colors and descriptions for easy identification

3. **Configure Pivot Tables**
   - Select your data sources
   - Use the intuitive interface to configure pivot tables:
     - Drag fields to Rows, Columns, or Values areas
     - Choose aggregation methods (sum, count, average, etc.)
     - Search through available fields
   - Save configurations as presets for future use

4. **Generate Excel Files**
   - Click "Generate Preview" to see how your Excel file will look
   - Export the final Excel file with all configured pivot tables
   - Optionally export to PowerPoint format

### Advanced Features

#### Label Management
- **Create Labels**: Define reusable templates for recurring data structures
- **Validation**: Ensure uploaded data matches expected column structures
- **Usage Tracking**: Monitor how frequently labels are used
- **Search**: Quickly find labels by name, description, or column names

#### Pivot Table Configuration
- **Multi-source Integration**: Combine data from multiple Excel files
- **Relationship Detection**: Automatically identify connections between datasets
- **Field Search**: Search through available columns and data sources
- **Preset Management**: Save and load pivot table configurations

#### Data Export Options
- **Excel Export**: Generate comprehensive Excel files with multiple pivot tables
- **PowerPoint Export**: Convert data to formatted presentation slides
- **Custom Layouts**: Choose between separate sheets or combined layouts
- **Raw Data Inclusion**: Optionally include source data in exports

#### PowerPoint Conversion
- **Smart Table Detection**: Automatically identifies data regions and tables
- **Format Preservation**: Maintains fonts, colors, alignment, and styling
- **Adaptive Sizing**: Intelligent width calculation based on content
- **Merged Cell Support**: Handles complex merged cell layouts
- **Professional Output**: Clean, corporate-quality presentations

## 🔌 API Documentation

### Core Endpoints

#### Data Source Management
- `POST /upload` - Upload Excel files and extract metadata
- `GET /data-sources` - List all uploaded data sources
- `DELETE /data-sources/{id}` - Delete a specific data source

#### Label Management
- `GET /labels` - List all data labels
- `POST /labels` - Create a new data label
- `PUT /labels/{id}` - Update an existing label
- `DELETE /labels/{id}` - Delete a label

#### Pivot Table Configuration
- `GET /pivot-presets` - List all pivot table presets
- `POST /pivot-presets` - Create a new pivot preset
- `PUT /pivot-presets/{id}` - Update a pivot preset
- `DELETE /pivot-presets/{id}` - Delete a pivot preset
- `GET /pivot-presets/by-label/{label_id}` - Get presets by label

#### Data Processing
- `POST /detect-relationships` - Analyze relationships between data sources
- `POST /generate-pivot-table` - Create pivot table from configuration
- `POST /generate-excel-from-preset` - Generate Excel file from preset
- `POST /export-pivot-table` - Export pivot table to Excel or PowerPoint

#### Health Check
- `GET /health` - Backend health status

### API Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": {...},
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Example Usage

#### Creating a Data Label
```bash
curl -X POST http://localhost:8000/labels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Sales Report",
    "description": "Standard monthly sales data structure",
    "color": "#3B82F6",
    "expected_columns": ["Date", "Product", "Sales", "Region"]
  }'
```

#### Generating Excel from Preset
```bash
curl -X POST http://localhost:8000/generate-excel-from-preset \
  -H "Content-Type: application/json" \
  -d '{
    "preset_id": "preset_123",
    "data_source_ids": ["source_1", "source_2"]
  }'
```

## 🐳 Docker Setup

### Development Environment
```bash
# Start services in development mode
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment
```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up --build -d

# Scale services
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d
```

### Docker Configuration

#### Environment Variables
- `PORT`: Backend server port (default: 5000)
- `MAX_UPLOAD_SIZE`: Maximum file upload size (default: 100MB)
- `CORS_ORIGINS`: Allowed CORS origins
- `NODE_ENV`: Node environment (development/production)
- `REACT_APP_API_URL`: Frontend API URL

#### Volume Mounts
- `./backend/uploads:/app/uploads` - File upload storage
- `./backend/temp:/app/temp` - Temporary file processing

## 💻 Development

### Project Structure
```
excel2powerpoint/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main application file
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Backend Docker configuration
│   ├── uploads/              # File upload directory
│   └── temp/                 # Temporary file storage
├── frontend/                  # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── labels/       # Label management
│   │   │   │   └── LabelManager.tsx
│   │   │   ├── pivot/        # Pivot table components
│   │   │   │   ├── PivotPageEnhanced.tsx
│   │   │   │   ├── PivotTableManager.tsx
│   │   │   │   ├── PivotConfiguration.tsx
│   │   │   │   ├── ExcelFilePreview.tsx
│   │   │   │   └── DataSourceSelector.tsx
│   │   │   ├── upload/       # File upload components
│   │   │   │   └── MultiSourceUpload.tsx
│   │   │   └── SlidePreview.tsx
│   │   ├── services/         # API services
│   │   │   └── api.ts
│   │   ├── stores/           # Zustand state management
│   │   │   └── appStore.ts
│   │   ├── types/            # TypeScript types
│   │   │   └── index.ts
│   │   └── App.tsx           # Main app component
│   ├── package.json          # Node dependencies
│   ├── Dockerfile            # Frontend Docker configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
├── docker-compose.yml        # Development Docker Compose
├── CLAUDE.md                 # Project documentation
└── README.md                 # This file
```

### Development Commands

#### Backend Development
```bash
# Install development dependencies
pip install -r requirements.txt

# Run with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 5000

# Run tests
python -m pytest

# Format code
black .
```

#### Frontend Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Code Quality

#### Backend Standards
- **Linting**: flake8, black
- **Type checking**: mypy
- **Testing**: pytest
- **Documentation**: Docstrings for all functions

#### Frontend Standards
- **Linting**: ESLint, Prettier
- **Type checking**: TypeScript strict mode
- **Testing**: React Testing Library
- **Styling**: Tailwind CSS utility classes

## 📁 Project Components

### Backend Components
- **File Analysis**: Excel file parsing and table detection
- **Data Processing**: Cell value extraction and formatting
- **PowerPoint Generation**: Shape-based table creation
- **API Layer**: RESTful endpoints for frontend communication

### Frontend Components
- **LabelManager**: Create and manage data source labels
- **PivotPageEnhanced**: Main pivot table workflow interface
- **PivotTableManager**: Configure multiple pivot tables
- **PivotConfiguration**: Drag-and-drop field configuration
- **ExcelFilePreview**: Preview generated Excel files
- **DataSourceSelector**: Select and manage data sources
- **MultiSourceUpload**: Upload multiple Excel files
- **SlidePreview**: Live preview of generated slides

### Key Features Implementation
- **Label-Based Organization**: Reusable templates for data structures
- **Advanced Pivot Tables**: Multiple pivot tables with complex configurations
- **Real-time Search**: Search through fields and data sources
- **Data Relationship Detection**: Automatically identify data connections
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance**: Optimized for large file processing and multiple data sources

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Add tests for new features
- Update documentation for API changes
- Ensure Docker builds pass
- Test both frontend and backend changes

### Code Review Process
- All changes require review before merging
- Automated tests must pass
- Documentation must be updated
- Performance impact should be considered

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Common Issues

#### "File not found" errors
- Ensure the uploaded file is in .xlsx format
- Check file permissions and size limits (max 100MB)
- Verify the file is not corrupted or password-protected
- Check backend uploads directory permissions

#### Pivot table generation errors
- Verify data sources are properly uploaded
- Check that field names match between configuration and data
- Ensure pivot table configuration has at least one row, column, or value field
- Review console logs for detailed error messages

#### Excel export failures
- Confirm pandas and openpyxl are properly installed
- Check that pivot table configuration is valid
- Verify data sources contain actual data
- Ensure sufficient disk space for temporary files

#### Docker build failures
```bash
# Clean Docker cache
docker system prune -af

# Rebuild without cache
docker-compose build --no-cache

# Check logs for specific errors
docker-compose logs backend
docker-compose logs frontend
```

#### Frontend not connecting to backend
- Check if backend is running on port 5000
- Verify CORS settings allow frontend origin
- Check firewall and network settings
- Ensure FastAPI server is accessible: http://localhost:5000/docs

#### Memory issues with large files
- Increase Docker memory limits (recommended 4GB+)
- Process files in smaller chunks
- Check available system memory
- Monitor temp directory disk usage

#### Notification system issues
- Check browser console for JavaScript errors
- Verify Zustand store state management
- Clear browser cache and local storage
- Check notification timeout and scaling settings

#### Label creation frequency errors
- This issue has been fixed in recent updates
- Ensure latest code is deployed
- Check browser console for validation errors
- Verify label name uniqueness requirements

### Performance Optimization

#### Large File Processing
- Split large tables across multiple slides
- Reduce image quality for faster processing
- Use streaming for file uploads

#### Memory Usage
- Monitor Docker container memory usage
- Implement file cleanup after processing
- Use pagination for large datasets

### Debug Mode

#### Backend Debugging
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
uvicorn main:app --reload --log-level debug --host 0.0.0.0 --port 5000

# Check API endpoints
curl http://localhost:5000/health
curl http://localhost:5000/docs

# Monitor file uploads
ls -la backend/uploads/
ls -la backend/temp/
```

#### Frontend Debugging
```bash
# Enable verbose logging
export REACT_APP_DEBUG=true
npm start

# Check network requests in browser DevTools
# Monitor Zustand store state
# Check React component re-renders
```

#### Development Testing
```bash
# Test file upload
curl -X POST http://localhost:5000/upload \
  -F "file=@sample.xlsx" \
  -F "label_id=optional_label_id"

# Test pivot table generation
curl -X POST http://localhost:5000/generate-pivot-table \
  -H "Content-Type: application/json" \
  -d '{"data_source_ids": ["source_id"], "configuration": {...}}'
```

## 🆘 Support

### Getting Help
- Check the [Issues](https://github.com/your-repo/excel2powerpoint/issues) page
- Review the [API Documentation](http://localhost:5000/docs)
- Contact the development team

### Reporting Issues
Please include:
- Operating system and version
- Docker version (if using Docker)
- Steps to reproduce the issue
- Expected vs actual behavior
- Sample files (if applicable)

---

**Made with ❤️ for seamless Excel to PowerPoint conversion**