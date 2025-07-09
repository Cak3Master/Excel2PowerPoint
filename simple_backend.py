#!/usr/bin/env python3
"""
Simple backend server for Excel2PowerPoint frontend
"""
import os
import json
import time
import uuid
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
# import pandas as pd  # Will be added later
# from io import BytesIO

# Initialize FastAPI app
app = FastAPI(title="Excel2PowerPoint API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data storage
mock_data = {
    "data_sources": [],
    "presets": [],
    "export_history": []
}

# Create downloads directory if it doesn't exist
downloads_dir = "downloads"
os.makedirs(downloads_dir, exist_ok=True)

def generate_excel_file(pivot_data, filename):
    """Generate a CSV file as Excel substitute for now"""
    try:
        # Generate file path (use .csv for now)
        csv_filename = filename.replace('.xlsx', '.csv')
        file_path = os.path.join(downloads_dir, csv_filename)
        
        # Write CSV file
        with open(file_path, 'w') as f:
            # Write header
            f.write(','.join(pivot_data["columns"]) + '\n')
            # Write data rows
            for row in pivot_data["data"]:
                f.write(','.join(str(cell) for cell in row) + '\n')
        
        return file_path
    except Exception as e:
        print(f"Error generating CSV file: {e}")
        return None

def generate_mock_pptx_file(pivot_data, filename):
    """Generate a mock PowerPoint file (just a text file for demo)"""
    try:
        file_path = os.path.join(downloads_dir, filename)
        
        # Create a simple text representation for demo
        with open(file_path, 'w') as f:
            f.write("PowerPoint Export - Pivot Table Data\n")
            f.write("=" * 40 + "\n\n")
            f.write("Columns: " + ", ".join(pivot_data["columns"]) + "\n\n")
            f.write("Data Rows:\n")
            for row in pivot_data["data"]:
                f.write(" | ".join(str(cell) for cell in row) + "\n")
            f.write("\nFormat: Tabular Layout\n")
            f.write("Subtotals: Disabled\n")
            f.write("Grand Total: Enabled\n")
        
        return file_path
    except Exception as e:
        print(f"Error generating PowerPoint file: {e}")
        return None

# Response models
class AgentResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

# Agent endpoints
@app.post("/agents/pivot")
async def create_pivot_table(request: Request, file: UploadFile = File(None)):
    """Create pivot table from uploaded file or handle pivot actions"""
    try:
        # Handle file upload for pivot table creation
        if file:
            # Create a DataSource object structure that matches frontend expectations
            data_source = {
                "id": f"ds_{int(time.time())}",
                "name": file.filename or "uploaded_file.xlsx",
                "type": "excel",
                "upload_time": time.strftime("%Y-%m-%d %H:%M:%S"),
                "metadata": {
                    "row_count": 150,  # Mock data - in real implementation, would parse the file
                    "column_count": 5,
                    "columns": ["Name", "Sales", "Region", "Date", "Amount"],
                    "file_size": file.size if hasattr(file, 'size') else 0
                }
            }
            return AgentResponse(
                success=True,
                message="Data source uploaded successfully",
                data=data_source
            )
        
        # Handle JSON requests for other pivot actions
        try:
            body = await request.json()
            action = body.get("action", "create_pivot")
            
            if action == "detect_relationships":
                return AgentResponse(
                    success=True,
                    message="Relationships detected successfully",
                    data={
                        "relationships": [
                            {"from": "table1", "to": "table2", "type": "one_to_many", "confidence": 0.95}
                        ],
                        "join_strategies": [
                            {"strategy": "inner_join", "recommended": True}
                        ]
                    }
                )
            elif action == "configure_pivot":
                # Generate mock pivot table preview data that matches PivotResult structure
                config_id = f"pivot_{int(time.time())}"
                
                # Create PivotResult structure - Tabular format without subtotals
                pivot_result = {
                    "columns": ["Product", "Region", "Q1 Sales", "Q2 Sales", "Q3 Sales", "Q4 Sales", "Total"],
                    "rows": [
                        ["Product A", "North", 15000, 18000, 22000, 25000, 80000],
                        ["Product A", "South", 12000, 14000, 16000, 18000, 60000],
                        ["Product A", "East", 20000, 23000, 25000, 28000, 96000],
                        ["Product A", "West", 18000, 20000, 22000, 24000, 84000],
                        ["Product B", "North", 10000, 12000, 14000, 16000, 52000],
                        ["Product B", "South", 8000, 9000, 10000, 11000, 38000],
                        ["Product B", "East", 15000, 17000, 19000, 21000, 72000],
                        ["Product B", "West", 13000, 15000, 17000, 19000, 64000],
                        ["Grand Total", "All Regions", 111000, 128000, 145000, 162000, 546000]
                    ],
                    "data": [
                        ["Product A", "North", 15000, 18000, 22000, 25000, 80000],
                        ["Product A", "South", 12000, 14000, 16000, 18000, 60000],
                        ["Product A", "East", 20000, 23000, 25000, 28000, 96000],
                        ["Product A", "West", 18000, 20000, 22000, 24000, 84000],
                        ["Product B", "North", 10000, 12000, 14000, 16000, 52000],
                        ["Product B", "South", 8000, 9000, 10000, 11000, 38000],
                        ["Product B", "East", 15000, 17000, 19000, 21000, 72000],
                        ["Product B", "West", 13000, 15000, 17000, 19000, 64000],
                        ["Grand Total", "All Regions", 111000, 128000, 145000, 162000, 546000]
                    ],
                    "total_rows": 9,
                    "page": 1,
                    "page_size": 100,
                    "total_pages": 1,
                    "metadata": {
                        "row_count": 9,
                        "column_count": 7,
                        "row_fields": body.get("row_fields", []),
                        "column_fields": body.get("column_fields", []),
                        "value_fields": body.get("value_fields", []),
                        "aggregation_time": 45,
                        "layout": "tabular",
                        "show_subtotals": False,
                        "show_grand_totals": True
                    },
                    "summary": {
                        "total_rows": 9,
                        "total_columns": 7,
                        "grand_total": 546000
                    }
                }
                
                return AgentResponse(
                    success=True,
                    message="Pivot configuration saved",
                    data={
                        "config_id": config_id,
                        "preview_data": pivot_result
                    }
                )
            elif action == "execute_pivot" or action == "preview_pivot":
                # Generate full pivot table data with correct PivotResult structure - Tabular format without subtotals
                pivot_result = {
                    "columns": ["Product", "Region", "Q1 Sales", "Q2 Sales", "Q3 Sales", "Q4 Sales", "Total"],
                    "rows": [
                        ["Product A", "North", 15000, 18000, 22000, 25000, 80000],
                        ["Product A", "South", 12000, 14000, 16000, 18000, 60000],
                        ["Product A", "East", 20000, 23000, 25000, 28000, 96000],
                        ["Product A", "West", 18000, 20000, 22000, 24000, 84000],
                        ["Product B", "North", 10000, 12000, 14000, 16000, 52000],
                        ["Product B", "South", 8000, 9000, 10000, 11000, 38000],
                        ["Product B", "East", 15000, 17000, 19000, 21000, 72000],
                        ["Product B", "West", 13000, 15000, 17000, 19000, 64000],
                        ["Grand Total", "All Regions", 111000, 128000, 145000, 162000, 546000]
                    ],
                    "data": [
                        ["Product A", "North", 15000, 18000, 22000, 25000, 80000],
                        ["Product A", "South", 12000, 14000, 16000, 18000, 60000],
                        ["Product A", "East", 20000, 23000, 25000, 28000, 96000],
                        ["Product A", "West", 18000, 20000, 22000, 24000, 84000],
                        ["Product B", "North", 10000, 12000, 14000, 16000, 52000],
                        ["Product B", "South", 8000, 9000, 10000, 11000, 38000],
                        ["Product B", "East", 15000, 17000, 19000, 21000, 72000],
                        ["Product B", "West", 13000, 15000, 17000, 19000, 64000],
                        ["Grand Total", "All Regions", 111000, 128000, 145000, 162000, 546000]
                    ],
                    "total_rows": 9,
                    "page": 1,
                    "page_size": 100,
                    "total_pages": 1,
                    "metadata": {
                        "row_count": 9,
                        "column_count": 7,
                        "row_fields": body.get("row_fields", []),
                        "column_fields": body.get("column_fields", []),
                        "value_fields": body.get("value_fields", []),
                        "aggregation_time": 67,
                        "layout": "tabular",
                        "show_subtotals": False,
                        "show_grand_totals": True
                    },
                    "summary": {
                        "total_rows": 9,
                        "total_columns": 7,
                        "grand_total": 546000
                    }
                }
                
                return AgentResponse(
                    success=True,
                    message="Pivot table generated successfully",
                    data=pivot_result
                )
            else:
                return AgentResponse(
                    success=True,
                    message="Pivot action completed",
                    data={"action": action, "result": "success"}
                )
        except:
            # If no JSON body, return default response
            return AgentResponse(
                success=True,
                message="Pivot table created successfully",
                data={
                    "pivot_id": "pivot_123",
                    "columns": ["Name", "Sales", "Region"],
                    "rows": [["John", 1000, "East"], ["Jane", 1500, "West"]],
                    "metadata": {
                        "row_count": 2,
                        "column_count": 3,
                        "total_sales": 2500
                    }
                }
            )
            
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to process pivot request",
            error=str(e)
        )

@app.post("/agents/visualization")
async def create_visualization(request: Request):
    """Create visualization from data"""
    try:
        body = await request.json()
        return AgentResponse(
            success=True,
            message="Visualization created successfully",
            data={
                "chart_id": "chart_456",
                "chart_type": "bar",
                "data": body.get("data", []),
                "recommendations": [
                    {
                        "chart_type": "bar",
                        "title": "Sales by Region",
                        "confidence": 0.95,
                        "reasoning": "Good for comparing categorical data"
                    }
                ]
            }
        )
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to create visualization",
            error=str(e)
        )

@app.post("/agents/export")
async def export_data(request: Request):
    """Export data to various formats"""
    try:
        body = await request.json()
        action = body.get("action", "export_data")
        
        if action == "export_pivot":
            # Get the pivot data (in real implementation, this would be retrieved from storage)
            pivot_data = {
                "columns": ["Product", "Region", "Q1 Sales", "Q2 Sales", "Q3 Sales", "Q4 Sales", "Total"],
                "data": [
                    ["Product A", "North", 15000, 18000, 22000, 25000, 80000],
                    ["Product A", "South", 12000, 14000, 16000, 18000, 60000],
                    ["Product A", "East", 20000, 23000, 25000, 28000, 96000],
                    ["Product A", "West", 18000, 20000, 22000, 24000, 84000],
                    ["Product B", "North", 10000, 12000, 14000, 16000, 52000],
                    ["Product B", "South", 8000, 9000, 10000, 11000, 38000],
                    ["Product B", "East", 15000, 17000, 19000, 21000, 72000],
                    ["Product B", "West", 13000, 15000, 17000, 19000, 64000],
                    ["Grand Total", "All Regions", 111000, 128000, 145000, 162000, 546000]
                ]
            }
            
            format_type = body.get('format', 'excel')
            unique_id = str(uuid.uuid4())[:8]
            
            if format_type == 'excel':
                filename = f"pivot_table_tabular_{unique_id}.xlsx"
                file_path = generate_excel_file(pivot_data, filename)
                # Update filename to match the actual generated file
                if file_path:
                    filename = os.path.basename(file_path)
            else:  # powerpoint
                filename = f"pivot_table_tabular_{unique_id}.txt"  # Mock file for demo
                file_path = generate_mock_pptx_file(pivot_data, filename)
            
            if file_path:
                return AgentResponse(
                    success=True,
                    message="Pivot table exported successfully in tabular format without subtotals",
                    data={
                        "download_url": f"/download/{filename}",
                        "filename": filename,
                        "export_settings": {
                            "format": "tabular",
                            "show_subtotals": False,
                            "show_grand_totals": True,
                            "layout": "tabular"
                        }
                    }
                )
            else:
                return AgentResponse(
                    success=False,
                    message="Failed to generate export file",
                    error="File generation failed"
                )
        elif action == "create_export":
            return AgentResponse(
                success=True,
                message="Export job created successfully",
                data={
                    "job_id": f"job_{int(time.time())}",
                    "status": "queued",
                    "estimated_completion": "2024-01-01T12:00:00Z"
                }
            )
        elif action == "download_export":
            return AgentResponse(
                success=True,
                message="Export download ready",
                data={
                    "download_url": f"/downloads/export_{body.get('job_id', 'unknown')}.xlsx",
                    "filename": f"export_{body.get('job_id', 'unknown')}.xlsx"
                }
            )
        else:
            # Default export action
            return AgentResponse(
                success=True,
                message="Export completed successfully",
                data={
                    "export_id": "export_789",
                    "format": body.get("format", "excel"),
                    "download_url": "/downloads/export_789.xlsx",
                    "file_size": "2.5MB"
                }
            )
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to export data",
            error=str(e)
        )

# Data source endpoints
@app.post("/data/upload")
async def upload_data_source(file: UploadFile = File(...)):
    """Upload and process data source"""
    try:
        # Mock processing
        data_source = {
            "id": f"ds_{int(time.time())}",
            "name": file.filename,
            "type": "excel",
            "size": file.size,
            "columns": ["Column1", "Column2", "Column3"],
            "rows": 100,
            "uploaded_at": time.time()
        }
        mock_data["data_sources"].append(data_source)
        
        return AgentResponse(
            success=True,
            message="Data source uploaded successfully",
            data=data_source
        )
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to upload data source",
            error=str(e)
        )

@app.get("/data/sources")
async def get_data_sources():
    """Get all data sources"""
    return AgentResponse(
        success=True,
        message="Data sources retrieved successfully",
        data={"sources": mock_data["data_sources"]}
    )

# Preset endpoints
@app.get("/presets")
async def get_presets():
    """Get all presets"""
    return AgentResponse(
        success=True,
        message="Presets retrieved successfully",
        data={"presets": mock_data["presets"]}
    )

@app.post("/presets")
async def create_preset(request: Request):
    """Create new preset"""
    try:
        body = await request.json()
        preset = {
            "id": f"preset_{int(time.time())}",
            "name": body.get("name", "Untitled Preset"),
            "description": body.get("description", ""),
            "category": body.get("category", "custom"),
            "preset_type": body.get("preset_type", "workflow"),
            "type": body.get("type", "workflow"),
            "tags": body.get("tags", []),
            "configuration": body.get("configuration", {}),
            "workflow_steps": body.get("workflow_steps", []),
            "schedule": body.get("schedule", {"enabled": False, "frequency": "daily"}),
            "created_at": time.time(),
            "updated_at": time.time()
        }
        mock_data["presets"].append(preset)
        
        return AgentResponse(
            success=True,
            message="Preset created successfully",
            data=preset
        )
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to create preset",
            error=str(e)
        )

@app.put("/presets/{preset_id}")
async def update_preset(preset_id: str, request: Request):
    """Update existing preset"""
    try:
        body = await request.json()
        # Find and update preset
        for preset in mock_data["presets"]:
            if preset["id"] == preset_id:
                preset.update(body)
                preset["updated_at"] = time.time()
                return AgentResponse(
                    success=True,
                    message="Preset updated successfully",
                    data=preset
                )
        
        raise HTTPException(status_code=404, detail="Preset not found")
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to update preset",
            error=str(e)
        )

@app.delete("/presets/{preset_id}")
async def delete_preset(preset_id: str):
    """Delete preset"""
    try:
        mock_data["presets"] = [p for p in mock_data["presets"] if p["id"] != preset_id]
        return AgentResponse(
            success=True,
            message="Preset deleted successfully"
        )
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to delete preset",
            error=str(e)
        )

@app.post("/presets/{preset_id}/execute")
async def execute_preset(preset_id: str):
    """Execute preset"""
    try:
        return AgentResponse(
            success=True,
            message="Preset execution started",
            data={
                "execution_id": f"exec_{int(time.time())}",
                "status": "running",
                "results": []
            }
        )
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to execute preset",
            error=str(e)
        )

# Export endpoints
@app.get("/exports/history")
async def get_export_history():
    """Get export history"""
    return AgentResponse(
        success=True,
        message="Export history retrieved successfully",
        data={"exports": mock_data["export_history"]}
    )

# Data analysis endpoints
@app.post("/data/analyze")
async def analyze_data(request: Request):
    """Analyze uploaded data"""
    try:
        body = await request.json()
        return AgentResponse(
            success=True,
            message="Data analysis completed",
            data={
                "analysis_id": f"analysis_{int(time.time())}",
                "columns": [
                    {"name": "Sales", "type": "float64", "sample_values": [1000, 1500, 2000]},
                    {"name": "Region", "type": "object", "sample_values": ["East", "West", "North"]}
                ],
                "statistics": {
                    "total_rows": 100,
                    "total_columns": 5,
                    "missing_values": 2
                }
            }
        )
    except Exception as e:
        return AgentResponse(
            success=False,
            message="Failed to analyze data",
            error=str(e)
        )

# File download endpoint
@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download generated files"""
    file_path = os.path.join(downloads_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine media type based on extension
    if filename.endswith('.xlsx'):
        media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    elif filename.endswith('.csv'):
        media_type = 'text/csv'
    elif filename.endswith('.txt'):
        media_type = 'text/plain'
    else:
        media_type = 'application/octet-stream'
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)