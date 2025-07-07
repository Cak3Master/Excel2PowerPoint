#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the conversion function directly
from app import convert_excel_to_ppt

def test_conversion(excel_file):
    """Test the actual conversion function to see the output"""
    print(f"Testing conversion of {excel_file}...")
    
    try:
        # This will run the same code path as the Flask app
        output_path = convert_excel_to_ppt(excel_file)
        print(f"Conversion completed. Output: {output_path}")
    except Exception as e:
        print(f"Conversion failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_conversion(sys.argv[1])
    else:
        print("Usage: python test_conversion.py <excel_file>")
        print("Available files:")
        for f in ["test_hidden.xlsx", "comprehensive_test.xlsx", "large_test.xlsx"]:
            if os.path.exists(f):
                print(f"  {f}")