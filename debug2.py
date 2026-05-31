import re, json

with open('apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

# Find first codigo
m = re.search(r'codigo:\s*["\']([^"\']+)["\']', src)
if m:
    print('Found at pos', m.start(), ':',  m.group(0))
    print('Context:', src[max(0,m.start()-300):m.end()+100])
