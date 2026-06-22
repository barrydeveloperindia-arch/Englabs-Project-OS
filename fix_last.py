import re

app_file = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"

with open(app_file, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Replace any lingering `userRole`
app_content = re.sub(r"userRole=\{userRole\}", "userRole={currentUser?.role as any}", app_content)

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("Fixed last userRole")
