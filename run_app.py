#!/usr/bin/env python3
import re

# Read the app.py file
with open('app.py', 'r') as f:
    lines = f.readlines()

# Fix line 293
for i, line in enumerate(lines):
    if i == 292:  # Line 293 (0-indexed)
        lines[i] = '    print(f"Variable column widths: {[str(round(w, 2)) + chr(34) for w in col_widths]}")\n'

# Write the fixed content
with open('app_fixed.py', 'w') as f:
    f.writelines(lines)

# Run the app
import os
os.system('python3 app_fixed.py')