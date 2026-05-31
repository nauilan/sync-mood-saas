"""Lê um trecho do mock-obras.ts para ver a estrutura real de um link."""
import re

with open(r'apps/web/lib/mock-obras.ts', 'r', encoding='utf-8') as f:
    src = f.read()

# Pegar o trecho de um link qualquer
idx = src.find('links:')
chunk = src[idx:idx+800]
print(chunk)
