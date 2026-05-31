import os, re, sys, urllib.request, json, ssl

ls_path = r'C:\Users\Usuário\AppData\Local\Google\Chrome\User Data\Default\Local Storage\leveldb'
jwt_pattern = re.compile(rb'eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}')

all_tokens = set()
for fname in os.listdir(ls_path):
    fpath = os.path.join(ls_path, fname)
    if not fname.endswith(('.ldb', '.log')):
        continue
    try:
        with open(fpath, 'rb') as f:
            data = f.read()
        if b'supabase' in data:
            for m in jwt_pattern.finditer(data):
                tok = m.group().decode('ascii', 'ignore')
                # Filtrar tokens curtos demais
                if len(tok) > 200:
                    all_tokens.add(tok)
    except:
        pass

print(f'Tokens unicos encontrados: {len(all_tokens)}')
ctx = ssl.create_default_context()
PROJECT_REF = 'tigubwxotanaznqqxogf'

for i, token in enumerate(all_tokens):
    try:
        req = urllib.request.Request(
            f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query',
            data=json.dumps({'query': 'SELECT 1 AS ok'}).encode(),
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
            body = r.read().decode()
            print(f'TOKEN {i} FUNCIONOU! Resposta: {body[:100]}')
            # Salvar token valido
            with open('valid_token.txt', 'w') as f:
                f.write(token)
            print('Token salvo em valid_token.txt')
            break
    except urllib.error.HTTPError as e:
        code = e.code
        if code != 403:
            print(f'TOKEN {i}: HTTP {code}')
    except:
        pass
else:
    print('Nenhum token funcionou para o Management API')
