import json
with open('dist_resultado.json','r',encoding='utf-8') as f:
    data = json.load(f)

mv = data['titular_creditos'].get('MARCUS VINICIUS OLIVEIRA SANTANA', {})
print('MARCUS VINICIUS OLIVEIRA SANTANA:')
print(f"  Total: R$ {mv['total']:.2f}")
obras = mv.get('obras', [])
print(f"  Obras com distribuicao: {len(obras)}")
for o in obras[:5]:
    print(f"    codigo={o['codigo']} | pct={o['pct']:.4f}% | valor=R$ {o['valor']:.4f}")
