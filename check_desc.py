import re
content = open(r'C:\Users\Usuário\Desktop\sync-mood-saas\apps\web\lib\mock-cc.ts', encoding='utf-8').read()
descs = re.findall(r'descricao: "([^"]+)"', content)
print(f'Total descricoes: {len(descs)}')
for d in descs[:8]:
    print(' ', d)
