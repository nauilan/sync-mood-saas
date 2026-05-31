import re
with open(r"C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-titulares-cwr.ts", encoding="utf-8") as f:
    content = f.read()
for m in re.finditer(r'razao_social: "([^"]+)"', content):
    print(m.group(1))
