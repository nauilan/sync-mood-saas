import os, re, sys

ls_path = r'C:\Users\Usuário\AppData\Local\Google\Chrome\User Data\Default\Local Storage\leveldb'

# Buscar token JWT do Supabase em todos os arquivos LDB/LOG
supabase_tokens = {}
jwt_pattern = re.compile(rb'eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}')
sb_key_pattern = re.compile(rb'sb[-_][a-zA-Z0-9_\-]{20,}')

for fname in os.listdir(ls_path):
    if fname in ('LOCK', 'CURRENT', 'LOG', 'LOG.old', 'MANIFEST-000001'):
        continue
    fpath = os.path.join(ls_path, fname)
    try:
        with open(fpath, 'rb') as f:
            data = f.read()
        # Buscar supabase.com entries
        if b'supabase' in data:
            print(f'\n=== {fname} ({len(data)} bytes) ===')
            # Encontrar JWTs
            jwts = jwt_pattern.findall(data)
            for jwt in set(jwts):
                print(f'  JWT: {jwt[:60].decode("ascii","ignore")}...')
            # Encontrar sb- keys
            sb_keys = sb_key_pattern.findall(data)
            for k in set(sb_keys):
                print(f'  SB-KEY: {k.decode("ascii","ignore")}')
            # Mostrar contexto ao redor de supabase
            for m in re.finditer(rb'.{0,30}supabase.{0,80}', data):
                chunk = m.group()
                printable = ''.join(chr(b) if 32 <= b < 127 else '.' for b in chunk)
                if 'token' in printable.lower() or 'access' in printable.lower() or 'session' in printable.lower():
                    print(f'  CTX: {printable}')
    except Exception as e:
        print(f'Erro {fname}: {e}')

print('\nFim da busca')
