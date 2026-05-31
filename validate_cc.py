import json
from collections import defaultdict

with open(r'C:\Users\Usuário\Desktop\sync-mood-saas\dist_resultado.json', encoding='utf-8') as f:
    d = json.load(f)

obras = d['cc_obras']
titulares = d['titular_creditos']

total_obras = round(sum(o['saldo'] for o in obras), 4)
total_tit   = round(sum(v['total'] for v in titulares.values()), 4)
total_dist  = round(sum(x['valor_destinado'] for o in obras for x in o['distribuicoes']), 4)
diff        = round(total_obras - total_tit, 4)

print('='*60)
print('VALIDACAO DE DISTRIBUICAO — CONTA CORRENTE')
print('='*60)
print(f'Total recebido (CC Obras):       R$ {total_obras:>12.4f}')
print(f'Total distribuido (titulares):   R$ {total_tit:>12.4f}')
print(f'Total soma distribuicoes:        R$ {total_dist:>12.4f}')
print(f'Diferenca obras vs titulares:    R$ {diff:>12.4f}  ({100*abs(diff)/total_obras:.4f}%)')
print()

# Por obra: verificar se 100% foi distribuido
obras_ok, obras_nok = 0, 0
for o in obras:
    soma = round(sum(x['valor_destinado'] for x in o['distribuicoes']), 4)
    if abs(o['saldo'] - soma) < 0.01:
        obras_ok += 1
    else:
        obras_nok += 1

print(f'Obras com 100% distribuido:  {obras_ok}')
print(f'Obras com distribuicao diff: {obras_nok}')
print()

# Top 15 titulares por valor total recebido
print('='*60)
print(f'TOP 15 TITULARES POR VALOR TOTAL RECEBIDO')
print('='*60)
print(f'{"#":>3} {"Titular":<50} {"Total R$":>12} {"Movimentos":>10} {"Papel":>15}')
print('-'*95)
sorted_tit = sorted(titulares.items(), key=lambda x: -x[1]['total'])
for i, (nome, data) in enumerate(sorted_tit[:15], 1):
    papeis = set(m['papel'] for m in data['movimentos'])
    papel_str = '/'.join(sorted(papeis))[:15]
    print(f'{i:>3} {nome:<50} R$ {data["total"]:>10.4f} {len(data["movimentos"]):>10}   {papel_str}')

print()
print(f'TOTAL (122 titulares): R$ {total_tit:.4f}')
print()

# Validar por titular: soma dos movimentos == total declarado
erros = []
for nome, data in titulares.items():
    soma_movs = round(sum(m['valor'] for m in data['movimentos']), 4)
    if abs(soma_movs - data['total']) > 0.001:
        erros.append((nome, data['total'], soma_movs))

print(f'Titulares com total consistente: {len(titulares) - len(erros)}')
print(f'Titulares com inconsistencia:    {len(erros)}')
if erros:
    for nome, t, s in erros[:5]:
        print(f'  {nome}: declarado={t:.4f} soma_movs={s:.4f}')
