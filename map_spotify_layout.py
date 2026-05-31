"""
Mapeia posições exatas no formato B-55 UBEM para Spotify TXT.
"""
import re

path = r'C:\Users\Usuário\AppData\Local\Microsoft\Windows\INetCache\IE\D1H0Z66W\TOP_SHOW_MUSIC_LIMIT_-_SPOTIFY_-_DIST_-_2026-03-25_-_-_ST492347[1].TXT'

with open(path, 'r', encoding='utf-8', errors='replace') as f:
    first_line = f.readline().strip()

# Remover prefixo "NNN|"
content = re.sub(r'^\d+\|', '', first_line)
print(f"Comprimento total: {len(content)}")
print()

# Sabemos que Publishers_SongCode = 00000000000170 para ESTRELA
# Localizar o índice exato
code = '00000000000170'
idx = content.index(code)
print(f"Publishers_SongCode '{code}' encontrado na posição: {idx}")
print()

# Imprimir campos ao redor
print(f"Chars [0:30]:   {repr(content[0:30])}")
print(f"Chars [28:60]:  {repr(content[28:60])}")
print(f"Chars [58:100]: {repr(content[58:100])}")
print(f"Chars [98:120]: {repr(content[98:120])}")
print(f"Chars [120:140]:{repr(content[120:140])}")
print(f"Chars [136:166]:{repr(content[136:166])}")
print(f"Chars [146:180]:{repr(content[146:180])}")
print(f"Chars [{idx}:{idx+14}]: {repr(content[idx:idx+14])}  <- Publishers_SongCode")
print(f"Chars [{idx+14}:{idx+64}]: {repr(content[idx+14:idx+64])}  <- Song_Title (50 chars)")
print(f"Chars [{idx+64}:{idx+164}]: {repr(content[idx+64:idx+164])}  <- Song_Owners (100 chars)")
print()

# Datas
print("Buscando datas YYYYMMDD...")
for m in re.finditer(r'(202[0-9]{5})', content):
    print(f"  pos {m.start()}: {m.group(1)}")

# Royalty: último \d{12}\.\d{9} antes de SPOTIFY
royalty_matches = list(re.finditer(r'(\d{12}\.\d{9})', content))
if royalty_matches:
    last = royalty_matches[-1]
    print(f"\nÚltima ocorrência royalty: pos {last.start()} → {last.group(1)}")
    val = float('0.' + last.group(1).split('.')[1]) + float(last.group(1).split('.')[0])
    print(f"  Valor: {float(last.group(1)):.9f}")

# Calcular offsets fixos
# publisher_offset = posição inicial do publisher
# Depois do prefixo de 28 chars
print(f"\nChars before code position {idx}:")
print(f"  [idx-20:idx] = {repr(content[idx-20:idx])}  <- track_id (20 chars)")

# Verificar datas
start_d = content[idx-46:idx-38] if idx >= 46 else ''
end_d   = content[idx-38:idx-30] if idx >= 38 else ''
print(f"  Tentativa StartDate [{idx-46}:{idx-38}] = {repr(start_d)}")
print(f"  Tentativa EndDate   [{idx-38}:{idx-30}] = {repr(end_d)}")
