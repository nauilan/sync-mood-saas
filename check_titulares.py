import json
with open('dist_resultado.json','r',encoding='utf-8') as f:
    data = json.load(f)
print('Titulares controlados (distribuição apenas por links com editora):')
total = 0
for nome, v in sorted(data['titular_creditos'].items(), key=lambda x: -x[1]['total']):
    total += v['total']
    print(f"  {nome:45} R$ {v['total']:>12.2f}")
print(f"\n  TOTAL: R$ {total:.2f}")
