# Excel to PowerPoint Converter

A professional web application that converts Excel workbooks into perfectly formatted PowerPoint presentations. The application features a modern React frontend with a powerful FastAPI backend, providing an intuitive interface for uploading Excel files and converting them to high-quality PowerPoint slides.

## 🚀 Features

### Advanced Excel Processing
- **Multi-sheet support** - Convert multiple worksheets into separate slides
- **Intelligent table detection** - Automatically identifies data regions and tables
- **Data range selection** - Choose specific ranges from each worksheet
- **Format preservation** - Maintains fonts, colors, alignment, and styling
- **Merged cell support** - Handles complex merged cell layouts
- **Smart data trimming** - Removes empty rows and columns automatically

### Professional PowerPoint Output
- **Shape-based tables** - Custom implementation for precise control over table formatting
- **Adaptive column sizing** - Intelligent width calculation based on content
- **Perfect slide fit** - Always scales to fit within slide boundaries
- **Corporate formatting** - Clean, professional appearance with customizable styling
- **Auto-split large tables** - Automatically splits large tables across multiple slides
- **Header repetition** - Optionally repeat headers on split slides

### User-Friendly Interface
- **Drag-and-drop upload** - Easy file uploading with visual feedback
- **Live preview** - See how slides will look before conversion
- **Table range selector** - Interactive selection of data ranges
- **Formatting options** - Customize fonts, alignment, and spacing
- **Progress tracking** - Real-time conversion progress indicators

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Tailwind CSS
- **Backend**: FastAPI with Python 3.8+
- **File Processing**: openpyxl for Excel, python-pptx for PowerPoint
- **Data Analysis**: pandas for data manipulation
- **Containerization**: Docker and Docker Compose

### System Architecture
```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│  React Frontend │ ◄─────────────────► │  FastAPI Backend │
│   (Port 3000)   │                     │   (Port 5000)    │
└─────────────────┘                     └─────────────────┘
        │                                        │
        │                                        │
        ▼                                        ▼
┌─────────────────┐                     ┌─────────────────┐
│   Static Files  │                     │  File Processing │
│   (Nginx Proxy) │                     │   (Temp Storage) │
└─────────────────┘                     └─────────────────┘
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

### Basic Usage

1. **Upload Excel File**
   - Click "Upload Excel File" or drag and drop your .xlsx file
   - The application will analyze the file and display available worksheets

2. **Select Data Ranges**
   - Choose worksheets and specific data ranges to convert
   - Preview the data to ensure correct selection
   - The system automatically detects table structures

3. **Configure Formatting**
   - Adjust font size, family, and alignment
   - Set row/column spacing and slide orientation
   - Configure options for large table handling

4. **Generate Slides**
   - Click "Generate Slides" to start conversion
   - Monitor progress through the status indicator
   - Download the generated PowerPoint file

### Advanced Features

#### Table Range Selection
- **Auto-detection**: System automatically identifies data regions
- **Manual selection**: Specify exact cell ranges (e.g., A1:Z100)
- **Multi-range support**: Select multiple ranges from the same sheet

#### Formatting Options
- **Font settings**: Size (8-24pt), family (Arial, Times New Roman, etc.)
- **Alignment**: Left, center, right alignment for tables
- **Spacing**: Adjust row and column spacing (0.5x - 2.0x)
- **Orientation**: Horizontal (16:9) or vertical (4:3) slides

#### Large Table Handling
- **Auto-split**: Automatically split tables exceeding row limits
- **Header repetition**: Repeat headers on each split slide
- **Custom limits**: Set maximum rows per slide (10-50 rows)

## 🔌 API Documentation

### Core Endpoints

#### `POST /api/analyze-excel`
Analyzes uploaded Excel file and returns sheet information.

**Request**: Multipart form data with Excel file
**Response**: 
```json
{
  "file_id": "unique_file_identifier",
  "sheets": [
    {
      "name": "Sheet1",
      "rows": 100,
      "columns": 10,
      "tables": [...],
      "data_preview": [...]
    }
  ]
}
```

#### `POST /api/preview-slide`
Generates preview of how a slide will look.

**Request**:
```json
{
  "file_id": "file_identifier",
  "table_range": {
    "sheet_name": "Sheet1",
    "start_cell": "A1",
    "end_cell": "Z100",
    "has_headers": true
  },
  "formatting": {
    "font_size": 10,
    "font_family": "Arial",
    "table_alignment": "center"
  }
}
```

#### `POST /api/convert-to-pptx`
Converts selected ranges to PowerPoint presentation.

**Request**: ConversionRequest with selected ranges and formatting options
**Response**: PowerPoint file download

#### Health Check Endpoints
- `GET /health` - Backend health status
- `GET /api/health` - API health status

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
│   ├── static/               # Static assets
│   ├── templates/            # HTML templates
│   ├── uploads/              # File upload directory
│   └── temp/                 # Temporary file storage
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── FileUpload.tsx
│   │   │   ├── FormatOptions.tsx
│   │   │   ├── SlidePreview.tsx
│   │   │   └── TableSelector.tsx
│   │   ├── services/         # API services
│   │   │   └── api.ts
│   │   ├── types/            # TypeScript types
│   │   │   └── index.ts
│   │   └── App.tsx           # Main app component
│   ├── package.json          # Node dependencies
│   ├── Dockerfile            # Frontend Docker configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
├── nginx/                     # Nginx configuration
│   └── nginx.prod.conf       # Production Nginx config
├── docker-compose.yml        # Development Docker Compose
├── docker-compose.prod.yml   # Production Docker Compose
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
- **FileUpload**: Drag-and-drop file upload with validation
- **TableSelector**: Interactive table range selection
- **FormatOptions**: Formatting configuration panel
- **SlidePreview**: Live preview of generated slides

### Key Features Implementation
- **Smart Table Detection**: Analyzes cell patterns to identify tables
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance**: Optimized for large file processing

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
- Check file permissions and size limits
- Verify the file is not corrupted

#### Docker build failures
```bash
# Clean Docker cache
docker system prune -af

# Rebuild without cache
docker-compose build --no-cache
```

#### Frontend not connecting to backend
- Check if backend is running on port 5000
- Verify CORS settings in backend configuration
- Check firewall and network settings

#### Memory issues with large files
- Increase Docker memory limits
- Process files in smaller chunks
- Check available system memory

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
uvicorn main:app --reload --log-level debug
```

#### Frontend Debugging
```bash
# Enable verbose logging
export REACT_APP_DEBUG=true
npm start
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