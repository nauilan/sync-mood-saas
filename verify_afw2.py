import json
data = json.load(open('dist_resultado.json', encoding='utf-8'))

for o in data['cc_obras']:
    if o['obra_codigo'] == 'AFW2':
        print('DESCER PRA BC (AFW2) - Verificacao CWR:')
        saldo = o['saldo']
        print(f'  Royalty recebido: R$ {saldo:.4f}')
        total_dist = sum(d['valor_destinado'] for d in o['distribuicoes'])
        print(f'  Total distribuido: R$ {total_dist:.4f}')
        print(f'  Diferenca: R$ {abs(saldo-total_dist):.6f}')
        print()
        print(f'  {"Titular":<45} {"Papel":<20} {"% aplicado":>12}  {"Valor R$":>12}')
        print(f'  {"-"*45} {"-"*20} {"-"*12}  {"-"*12}')
        for d in o['distribuicoes']:
            nome = d['titular_nome'] or '?'
            print(f'  {nome[:45]:<45} {d["tipo_destino"]:<20} {d["percentual_aplicado"]:>11.4f}%  R${d["valor_destinado"]:>10.4f}')
        soma_pct = sum(d['percentual_aplicado'] for d in o['distribuicoes'])
        print(f'  {"TOTAL":<45} {"":20} {soma_pct:>11.4f}%  R${total_dist:>10.4f}')
        break
