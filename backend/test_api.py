#!/usr/bin/env python3
"""Test script to verify the backend API is working correctly"""

import requests
import json
import os
import sys

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            print("✓ Health check passed:", response.json())
            return True
        else:
            print("✗ Health check failed:", response.status_code)
            return False
    except Exception as e:
        print("✗ Health check error:", str(e))
        return False

def test_analyze_excel():
    """Test the analyze Excel endpoint"""
    print("\nTesting analyze Excel endpoint...")
    
    # Create a sample Excel file for testing
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Test Sheet"
    
    # Add some test data
    data = [
        ["Name", "Age", "City"],
        ["Alice", 25, "New York"],
        ["Bob", 30, "London"],
        ["Charlie", 35, "Paris"]
    ]
    
    for row_idx, row_data in enumerate(data, 1):
        for col_idx, value in enumerate(row_data, 1):
            ws.cell(row=row_idx, column=col_idx, value=value)
    
    # Save to a temporary file
    test_file = "/tmp/test_excel.xlsx"
    wb.save(test_file)
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('test.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post(f"{BASE_URL}/api/analyze-excel", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Analyze Excel passed:")
            print(f"  - File ID: {result['file_id']}")
            print(f"  - Sheets: {len(result['sheets'])}")
            return True, result['file_id']
        else:
            print("✗ Analyze Excel failed:", response.status_code)
            print("Response:", response.text)
            return False, None
    except Exception as e:
        print("✗ Analyze Excel error:", str(e))
        return False, None
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.remove(test_file)

def test_convert_to_pptx(file_id):
    """Test the convert to PPTX endpoint"""
    print("\nTesting convert to PPTX endpoint...")
    
    request_data = {
        "file_id": file_id,
        "selected_ranges": [
            {
                "sheet_name": "Test Sheet",
                "start_cell": "A1",
                "end_cell": "C4",
                "has_headers": True
            }
        ],
        "formatting_options": {
            "font_size": 12,
            "font_family": "Arial",
            "table_alignment": "center",
            "row_spacing": 1.0,
            "column_spacing": 1.0,
            "slide_orientation": "horizontal",
            "repeat_headers": True,
            "auto_split_large_tables": True,
            "max_rows_per_slide": 20
        }
    }
    
    try:
        headers = {'Content-Type': 'application/json'}
        response = requests.post(
            f"{BASE_URL}/api/convert-to-pptx",
            json=request_data,
            headers=headers
        )
        
        if response.status_code == 200:
            print("✓ Convert to PPTX passed")
            print(f"  - Response content type: {response.headers.get('content-type')}")
            print(f"  - Response size: {len(response.content)} bytes")
            
            # Save the PPTX file for inspection
            output_file = "/tmp/test_output.pptx"
            with open(output_file, 'wb') as f:
                f.write(response.content)
            print(f"  - Output saved to: {output_file}")
            return True
        else:
            print("✗ Convert to PPTX failed:", response.status_code)
            print("Response:", response.text)
            return False
    except Exception as e:
        print("✗ Convert to PPTX error:", str(e))
        return False

def main():
    """Run all tests"""
    print("Starting backend API tests...\n")
    
    # Check if the server is running
    if not test_health_check():
        print("\nError: Backend server is not running!")
        print("Please start the server with: python main.py")
        sys.exit(1)
    
    # Test analyze Excel
    success, file_id = test_analyze_excel()
    if not success or not file_id:
        print("\nError: Failed to analyze Excel file!")
        sys.exit(1)
    
    # Test convert to PPTX
    if not test_convert_to_pptx(file_id):
        print("\nError: Failed to convert to PPTX!")
        sys.exit(1)
    
    print("\n✓ All tests passed!")

if __name__ == "__main__":
    main()