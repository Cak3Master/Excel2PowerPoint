# Excel-to-PPT Slide Converter

This professional web application converts complex Excel workbooks into perfectly formatted PowerPoint presentations. Each worksheet becomes a separate slide with corporate-quality table formatting that fits precisely within slide boundaries.

## ✨ Key Features

### 🎯 **Advanced Table Processing**
- **Shape-based tables**: Custom implementation bypassing PowerPoint's limitations
- **Adaptive column sizing**: Intelligent width calculation based on content and headers  
- **Perfect merged cell support**: Preserves Excel merged cell layouts exactly
- **Auto data trimming**: Removes empty rows/columns automatically
- **Header optimization**: Prevents text wrapping in header rows

### 🎨 **Professional Formatting**
- **Complete style preservation**: Fonts, colors, bold, italic, alignment
- **Cell background colors**: Exact color matching from Excel
- **No drop shadows**: Clean, corporate appearance
- **Subtle gridlines**: Excel-like appearance with smart header handling
- **Variable column widths**: Each column sized optimally for its content

### 📊 **Smart Scaling**
- **Automatic fit**: Always scales to fit within slide boundaries
- **Font optimization**: 6-12pt scaling based on table size
- **Content-driven sizing**: Headers get priority for width calculation
- **Proportional scaling**: Maintains readability while fitting slides

## 🚀 Setup

### Prerequisites
- Python 3.7+
- pip package manager

### Installation

1. **Clone or download this project**

2. **Create a virtual environment** (required for externally managed Python environments):
```bash
python3 -m venv venv
```

3. **Activate the virtual environment**:
```bash
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

4. **Install dependencies**:
```bash
pip install -r requirements.txt
```

5. **Run the application**:
```bash
python app.py
```

6. **Open your browser** and navigate to `http://localhost:5000`

## 📖 Usage

1. **Upload**: Click "Choose File" and select an Excel (.xlsx) file
2. **Convert**: Click "Convert to PowerPoint" 
3. **Download**: The converted PowerPoint file automatically downloads
4. **Open**: View your perfectly formatted slides in PowerPoint

## 🔧 Technical Details

### Supported Excel Features:
- ✅ **Multiple worksheets** (each becomes a separate slide)
- ✅ **Merged cells** (preserved exactly as in Excel)
- ✅ **Cell background colors** (exact color matching)
- ✅ **Font styling** (bold, italic, color, size)
- ✅ **Text alignment** (left, center, right)
- ✅ **Complex data types** (numbers, text, formulas)
- ✅ **Large tables** (tested with 50+ rows, 20+ columns)

### PowerPoint Output:
- **Shape-based tables**: Individual text boxes for precise control
- **Variable column widths**: Content-optimized sizing  
- **Corporate formatting**: Clean, professional appearance
- **Perfect fit**: Always within slide boundaries (9.0" × 6.6" usable area)
- **Standard dimensions**: 16:9 PowerPoint slides
- **No artifacts**: Zero drop shadows or unwanted effects

### Advanced Implementation:
- **Smart algorithm**: Analyzes content length and font sizes
- **Header priority**: Extra width allocation for header text
- **Merged cell mapping**: Tracks all merged ranges and dimensions  
- **Cumulative positioning**: Mathematical precision for shape placement
- **Memory efficient**: Proper cleanup of temporary files

## 🌐 Deployment

### Render (Recommended)
1. Connect your GitHub repository to Render
2. Set the build command: `pip install -r requirements.txt`
3. Set the start command: `python app.py`
4. Deploy!

### Other Platforms
- **Vercel**: Compatible with Python runtime
- **Heroku**: Use Procfile with `web: python app.py`
- **AWS/GCP**: Container deployment ready

### Local Development
- Runs on `http://localhost:5000` by default
- Debug mode enabled for development
- Hot reload on file changes

## 📁 Project Structure
```
Excel2PowerPoint/
├── app.py              # Main Flask application with shape-based table engine
├── requirements.txt    # Python dependencies
├── templates/
│   └── index.html     # Modern upload interface
├── static/
│   └── style.css      # Responsive styling with gradient background
├── claude.md          # Project documentation for Claude
├── README.md          # This file
└── venv/              # Virtual environment (created during setup)
```

## 🛡️ Error Handling & Validation

- **File type validation**: Only .xlsx files accepted
- **Size limits**: 16MB maximum file size
- **Empty worksheet detection**: Skips worksheets with no data
- **Graceful error handling**: Clear error messages for users
- **Memory management**: Automatic cleanup of uploaded files
- **Data range validation**: Handles edge cases and malformed data

## 🎯 Performance

- **Fast processing**: Large tables (1,000+ cells) processed in seconds
- **Efficient memory usage**: Streams data without loading entire files
- **Scalable architecture**: Handles multiple concurrent users
- **Optimized output**: Minimal file sizes with maximum quality

## 💼 Corporate Ready

This tool produces PowerPoint presentations that meet professional corporate standards:
- Clean, shadow-free appearance
- Consistent formatting across slides  
- Readable fonts with optimal sizing
- Perfect slide boundary compliance
- Excel-accurate data representation

Perfect for business reports, data presentations, and executive dashboards!