import re

with open(r'apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

idx = src.find('codigo: "29"')
if idx == -1:
    idx = src.find("codigo: '29'")
chunk = src[max(0,idx-200):idx+3000]
print(chunk[:3000])
