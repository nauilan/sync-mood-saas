"""
Analisa o layout dos TXT Spotify para mapear campos e validar parser.
"""
import re

files = {
    'EDI_ST492348': r'C:\Users\Usuário\AppData\Local\Microsoft\Windows\INetCache\IE\T5KA4AHT\EDI_MUSIC_-_SPOTIFY_-_DIST_-_2026-03-25_-_-_ST492348[1].TXT',
    'TSM_ST492347': r'C:\Users\Usuário\AppData\Local\Microsoft\Windows\INetCache\IE\D1H0Z66W\TOP_SHOW_MUSIC_LIMIT_-_SPOTIFY_-_DIST_-_2026-03-25_-_-_ST492347[1].TXT',
}

def parse_line(raw):
    # Remove line number prefix "NNN|"
    content = re.sub(r'^\d+\|', '', raw.strip())

    # Publishers_SongCode: 14-char [0-9A-Z] imediatamente antes do Song_Title (50 chars)
    # Padrão: ([0-9A-Z]{14})([A-Z][A-Z0-9\s_]{4,49}\s{5,})
    code_m = re.search(r'([0-9A-Z]{14})([A-Z][A-Z0-9 _\'\.\/\-]{4,49}\s{2,})', content)
    if not code_m:
        return None
    song_code = code_m.group(1)
    song_title = code_m.group(2).strip()

    # ROYALTIES_TO_BE_PAID: último \d{12}\.\d{9} antes de SPOTIFY ou nome da fonte
    royalty_m = re.findall(r'(\d{12}\.\d{9})', content)
    royalty = float(royalty_m[-1]) if royalty_m else 0.0

    # Publisher: primeiros ~30 chars depois dos 20 chars de trans_id
    # Padrão observado: transID(20) + payeeID(6?) + publisher(30)
    # Usar heurística: primeiro bloco de letras maiúsculas após os dígitos iniciais
    pub_m = re.search(r'\d{6}([A-Z][A-Z ]{5,29})\s', content)
    publisher = pub_m.group(1).strip() if pub_m else ''

    # Datas: YYYYMMDD — primeiro par de 8 dígitos que começa com 202
    dates = re.findall(r'(202\d{5})', content)
    start_date = f"{dates[0][6:8]}/{dates[0][4:6]}/{dates[0][:4]}" if len(dates) > 0 else ''
    end_date   = f"{dates[1][6:8]}/{dates[1][4:6]}/{dates[1][:4]}" if len(dates) > 1 else ''

    # Source: SPOTIFY (do filename)
    source = 'SPOTIFY'

    return {
        'song_code': song_code,
        'song_title': song_title,
        'royalty': royalty,
        'publisher': publisher,
        'start_date': start_date,
        'end_date': end_date,
        'source': source,
    }

for label, path in files.items():
    print(f"\n{'='*60}")
    print(f"Arquivo: {label}")
    rows = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            r = parse_line(line)
            if r:
                rows.append(r)
    print(f"Linhas parseadas: {len(rows)}")
    print(f"Amostra (3 linhas):")
    for r in rows[:3]:
        print(f"  code={r['song_code']} | title={r['song_title'][:25]} | R$={r['royalty']:.9f} | pub={r['publisher'][:20]} | {r['start_date']} a {r['end_date']}")

    # Agrupado por song_code
    from collections import defaultdict
    agg = defaultdict(float)
    for r in rows:
        agg[r['song_code']] += r['royalty']
    print(f"\nTotal R$: {sum(agg.values()):.4f}")
    print(f"Códigos distintos: {len(agg)}")
    print(f"Top 5:")
    for k, v in sorted(agg.items(), key=lambda x: -x[1])[:5]:
        print(f"  {k} | R$ {v:.4f}")
