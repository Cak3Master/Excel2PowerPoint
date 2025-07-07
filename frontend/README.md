# Excel to PowerPoint Frontend

This is the React frontend for the Excel to PowerPoint converter application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will run on http://localhost:3000

## Features

- **File Upload**: Drag and drop or click to upload Excel files (.xlsx, .xls)
- **Table Selection**: Choose from detected tables or full worksheets
- **Formatting Options**:
  - Font size and family
  - Table alignment (center/left/right)
  - Row and column spacing
  - Slide orientation (horizontal/vertical)
  - Header repetition on each slide
  - Auto-split vs shrink-to-fit for large tables
- **Live Preview**: See how your table will look in PowerPoint
- **Download**: Convert and download the PowerPoint file

## Project Structure

```
src/
├── components/
│   ├── FileUpload.tsx      # File upload component
│   ├── TableSelector.tsx   # Table/worksheet selection
│   ├── FormatOptions.tsx   # Formatting controls
│   └── SlidePreview.tsx    # PowerPoint preview
├── services/
│   └── api.ts             # Backend API integration
├── types/
│   └── index.ts           # TypeScript type definitions
├── App.tsx                # Main application component
├── index.tsx              # Application entry point
└── index.css              # Global styles with Tailwind CSS
```

## API Integration

The frontend communicates with the backend API running on http://localhost:5000 with the following endpoints:

- `POST /api/analyze-excel`: Upload and analyze Excel file
- `POST /api/preview-slide`: Generate slide preview
- `POST /api/convert-to-pptx`: Convert to PowerPoint file

## Technologies Used

- React 18 with TypeScript
- Tailwind CSS for styling
- Axios for API requests
- React Scripts for build tooling