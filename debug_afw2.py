import re

with open('apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

# Find AFW2 (DESCER PRA BC)
m = re.search(r'codigo:\s*"AFW2"', src)
if not m:
    print("AFW2 not found")
else:
    # Find start of obra block
    start = src.rfind('{', 0, m.start())
    # Find end
    depth = 0; pos = start
    while pos < len(src):
        if src[pos] == '{': depth += 1
        elif src[pos] == '}':
            depth -= 1
            if depth == 0:
                break
        pos += 1
    block = src[start:pos+1]
    print(block[:3000])
