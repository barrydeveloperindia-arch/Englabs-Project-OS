filepath = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("(updated: any)", "(updated)")
content = content.replace("(action: any)", "(action)")
content = content.replace("(log: any)", "(log)")
content = content.replace("(newProj: any)", "(newProj)")
content = content.replace("(trip: any)", "(trip)")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Regex damage fixed.")
