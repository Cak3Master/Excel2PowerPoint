#!/usr/bin/env python3
import re

# Read the app.py file
with open('app.py', 'r') as f:
    content = f.read()

# Fix the f-string issue by replacing the problematic line
content = content.replace(
    'print(f"Variable column widths: {[f\'{w:.2f}\\"\' for w in col_widths]}")',
    'print(f"Variable column widths: {[str(round(w, 2)) + \'\\\"\' for w in col_widths]}")'
)

# Write the fixed content to a new file
with open('app_fixed.py', 'w') as f:
    f.write(content)

# Run the fixed app
import subprocess
subprocess.run(['python3', 'app_fixed.py'])