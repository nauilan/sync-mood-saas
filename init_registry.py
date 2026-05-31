"""Registra os 3 arquivos já processados no registry sem reprocessar."""
import hashlib, json, os
from datetime import datetime

REGISTRY_PATH = r'C:\Users\Usuário\Desktop\sync-mood-saas\processed_registry.json'

FILES = [
    (r'C:\Users\Usuário\Downloads\TOP SHOW MUSIC LIMIT - IMUSICA S.A. - DIST - 2026-04-17 - - ST505168.TXT',
     'ST505168', 'IMUSICA'),
    (r'C:\Users\Usuário\Downloads\EDI MUSIC - SPOTIFY - DIST - 2026-03-25 - - ST492348.TXT',
     'ST492348', 'SPOTIFY'),
    (r'C:\Users\Usuário\Downloads\TOP SHOW MUSIC LIMIT - SPOTIFY - DIST - 2026-03-25 - - ST492347.TXT',
     'ST492347', 'SPOTIFY'),
]

def file_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()

registry = {'statements': {}, 'file_hashes': {}}
now = '2026-05-27 00:00:00'  # data retroativa do processamento original

for path, stmt_id, source in FILES:
    if not os.path.exists(path):
        print(f"  [AVISO] não encontrado: {path}")
        continue
    fh = file_hash(path)
    registry['statements'][stmt_id] = {
        'arquivo': os.path.basename(path),
        'caminho': path,
        'source': source,
        'processado_em': now,
        'hash': fh,
    }
    registry['file_hashes'][fh] = stmt_id
    print(f"  Registrado: {stmt_id} | {os.path.basename(path)}")

with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
    json.dump(registry, f, ensure_ascii=False, indent=2)

print(f"\nRegistry salvo em: {REGISTRY_PATH}")
print(f"Statements registrados: {list(registry['statements'].keys())}")
