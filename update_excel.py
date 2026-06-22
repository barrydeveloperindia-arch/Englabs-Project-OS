import pandas as pd
import os
from datetime import datetime

file_path = r"G:\HR Team Managements\Englabs Projects APK\Projects\Current Projects  DETAISL.xlsx"
projects = [
    {'Project ID': 'EQ5487', 'Client Name': 'EndureAir', 'Status': 'Pending', 'Date Added': datetime.now().strftime('%Y-%m-%d')},
    {'Project ID': 'EQ5488', 'Client Name': 'RND Mechanical', 'Status': 'Pending', 'Date Added': datetime.now().strftime('%Y-%m-%d')},
    {'Project ID': 'EQ5489', 'Client Name': 'Aebocode', 'Status': 'Pending', 'Date Added': datetime.now().strftime('%Y-%m-%d')},
    {'Project ID': 'EQ5490', 'Client Name': 'Orient Electric 1', 'Status': 'Pending', 'Date Added': datetime.now().strftime('%Y-%m-%d')},
    {'Project ID': 'EQ5491', 'Client Name': 'Orient Electric 2', 'Status': 'Pending', 'Date Added': datetime.now().strftime('%Y-%m-%d')}
]

df_new = pd.DataFrame(projects)

try:
    if os.path.exists(file_path):
        with pd.ExcelWriter(file_path, mode='a', engine='openpyxl', if_sheet_exists='overlay') as writer:
            workbook = writer.book
            sheet = workbook.active
            start_row = sheet.max_row
            df_new.to_excel(writer, index=False, header=False, startrow=start_row)
        print("Excel updated successfully.")
    else:
        df_new.to_excel(file_path, index=False)
        print("Created new Excel file with records.")
except Exception as e:
    print(f"Error updating Excel: {e}")
