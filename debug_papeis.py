import re
from collections import Counter

with open(r'apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

papeis = re.findall(r'\bpapel:\s*"([^"]+)"', src)
print("Papeis no catálogo:")
for p, c in Counter(papeis).most_common():
    print(f"  {p:30} {c:5}x")
