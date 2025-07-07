#!/usr/bin/env python3

from openpyxl import Workbook
from openpyxl.utils import get_column_letter

def create_large_test_file():
    """Create a test file that might show 189x44 to test hidden cell detection"""
    wb = Workbook()
    ws = wb.active
    ws.title = "Large Test"
    
    # Create a large grid with data
    for row in range(1, 200):  # 199 rows
        for col in range(1, 50):  # 49 columns
            cell = ws.cell(row=row, column=col)
            cell.value = f"R{row}C{col}"
    
    # Hide every 10th row
    hidden_rows = 0
    for row in range(10, 200, 10):  # Hide rows 10, 20, 30, etc.
        ws.row_dimensions[row].hidden = True
        hidden_rows += 1
    
    # Hide every 5th column  
    hidden_cols = 0
    for col in range(5, 50, 5):  # Hide columns 5, 10, 15, etc.
        col_letter = get_column_letter(col)
        ws.column_dimensions[col_letter].hidden = True
        hidden_cols += 1
    
    print(f"Created test file with:")
    print(f"  Total data: 199 rows x 49 columns")
    print(f"  Hidden: {hidden_rows} rows, {hidden_cols} columns")
    print(f"  Expected visible: {199 - hidden_rows} rows, {49 - hidden_cols} columns")
    
    wb.save("large_test.xlsx")
    print("Saved as large_test.xlsx")

if __name__ == "__main__":
    create_large_test_file()