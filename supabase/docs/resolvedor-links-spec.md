# resolvedor_links() — Especificação Técnica

**Status:** Especificado — não implementado  
**Arquivo futuro:** `apps/web/lib/resolver-links.ts`  
**Dependências futuras:** módulo de contratos assinados, módulo de cadastro manual com IA de extração  
**Não altera:** `bridge-analitico.ts`, `obras_analitico`, `cc_obras_movimentos`, distribuição  

---

## Papel da IA — conceito fundamental

> **A IA não é uma fonte de dados. A IA é uma ferramenta de extração.**

No Sync Mood, a IA poderá ler documentos anexados pelo usuário (contratos PDF, letras, documentos assinados) e **sugerir** campos como título, autores, percentuais, editoras e cessões. Mas:

- Toda sugestão da IA fica com `status_validacao_humana = 'pendente_validacao'`
- A linha **não entra na bridge** até que um operador humano revise e confirme
- Após aprovação humana, a linha é tratada como `fonte_controle = 'manual'` ou `'contrato'`
- **A IA nunca tem autoridade de validação**

A expressão correta é sempre: *"informação extraída por IA e validada por humano"* — nunca *"IA validada"*.

---

## Propósito

Camada intermediária que roda **antes** da bridge.  
Responsável por decidir qual fonte de percentuais prevalece para cada linha de `obras_links_titulares`, quando existirem múltiplas fontes disponíveis.

A bridge continua source-agnostic: ela lê os percentuais do banco sem saber de onde vieram.  
O resolvedor é quem garante que o banco sempre contenha o valor da fonte mais confiável.

```
Fontes disponíveis
  ├── CWR importado
  ├── Contrato assinado e validado por humano
  ├── Cadastro manual validado por humano
  └── Extração por IA → pendente_validacao → validação humana → manual/contrato
         ↓
   resolvedor_links()       ← esta especificação
         ↓
   obras_links_titulares    ← percentuais e fonte_controle atualizados
         ↓
   executarBridge()         ← não muda
         ↓
   obras_analitico
```

---

## Campos de suporte já existentes no banco

| Campo | Tabela | Adicionado em |
|---|---|---|
| `fonte_controle` | `obras_links_titulares` | migration 014 |
| `fonte` | `obras_links_titulares_direitos` | migration 016 |
| `status_controle` | `obras_links_titulares` | migration 006 |
| `contrato_id` | `obras_links_titulares` | migration 006 |
| `status_validacao_humana` | `obras_links_titulares` | migration 020 |
| `observacao_validacao` | `obras_links_titulares` | migration 020 |

---

## Interface TypeScript (futura)

```typescript
// lib/resolver-links.ts

export interface FonteDisponivel {
  tipo: 'cwr' | 'contrato' | 'manual'
  // Nota: 'ia' não existe como tipo de fonte definitivo.
  // Extrações por IA são tratadas como 'manual' com status_validacao_humana='pendente_validacao'
  // e só se tornam fonte válida após confirmação humana.
  titulares: LinkTitularInput[]     // mesmo tipo usado pela bridge
  validado_por_humano: boolean      // true = operador confirmou; false = bloqueia bridge
  data_referencia: Date
  documento_id?: string             // FK futura → obras_documentos (contrato PDF, etc.)
  contrato_id?: string              // FK → contratos
  extraido_por_ia?: boolean         // flag informativa: indica que IA auxiliou a extração
}

export interface ResolvedorInput {
  tenant_id: string
  obra_id: string
  fontes: FonteDisponivel[]
}

export interface ConflitoDeFonte {
  titular_nome: string
  campo: 'percentual_fonomecanico' | 'percentual_exec_publica' | 'percentual_sincronizacao'
  valor_fonte_a: number
  valor_fonte_b: number
  fonte_a: string
  fonte_b: string
  decisao: 'fonte_a_vence' | 'fonte_b_vence' | 'requer_validacao_humana'
  motivo: string
}

export interface ResolvedorOutput {
  links_resolvidos: ObraLinkInput[]           // pronto para a bridge
  conflitos: ConflitoDeFonte[]                // registros para auditoria
  fonte_vencedora_por_titular: Record<string, 'cwr' | 'contrato' | 'manual'>
  linhas_bloqueadas: string[]                 // titular_ids bloqueados até validação humana
}

export function resolverLinks(input: ResolvedorInput): ResolvedorOutput
```

---

## Hierarquia de decisão

```
Para cada linha de obras_links_titulares:

1. Existe contrato com status IN ('vigente','assinado','ativo')
   E data_inicio <= hoje
   E (data_fim IS NULL OR data_fim >= hoje)
   E validado_por_humano = true?
   → USA CONTRATO
   → fonte_controle = 'contrato'
   → status_validacao_humana = 'nao_requerida'

2. Existe cadastro manual com status_validacao_humana = 'validado'?
   (inclui extração por IA já confirmada por operador humano)
   → USA MANUAL VALIDADO
   → fonte_controle = 'manual'
   → status_validacao_humana = 'validado'

3. Existe linha importada do CWR (fonte_controle = 'cwr')?
   → USA CWR
   → fonte_controle = 'cwr'
   → status_validacao_humana = 'nao_requerida'

4. Existe extração por IA ou cadastro manual NÃO validado por humano?
   → BLOQUEIA esta linha
   → fonte_controle = 'manual'
   → status_validacao_humana = 'pendente_validacao'
   → Linha não entra na bridge até aprovação humana
   → Sistema exibe alerta de pendência ao operador

5. Nenhuma fonte disponível?
   → CRIA linha placeholder
   → status_controle = 'pendente'
   → status_validacao_humana = 'pendente_validacao'
   → Impede o cálculo do Analítico para este link
```

---

## Cenários de conflito e comportamento esperado

### Cenário 1 — Contrato e CWR concordam
```
Contrato: 25% editorial para LR Edições
CWR:      E = 12,5% (resultado correto de 50% × 25%)
→ Usa contrato (hierarquia 1)
→ Sem conflito registrado
→ Bridge calcula normalmente
```

### Cenário 2 — Contrato e CWR divergem
```
Contrato: 30% editorial para LR Edições
CWR:      E = 12,5%
→ Divergência detectada
→ Registra ConflitoDeFonte com decisao = 'requer_validacao_humana'
→ USA O CONTRATO (hierarquia), mas registra o conflito
→ observacao_validacao = "Divergência: contrato 30% / CWR 12,5%. Contrato prevalece por hierarquia."
→ Bridge calcula com o contrato
→ Conflito fica visível no relatório de inconsistências
```

### Cenário 3 — CWR sem contrato
```
CWR importado: CA Roberto = 37,5%, E LR = 12,5%
Contrato: não existe
→ USA CWR (hierarquia 3)
→ Bridge lê percentuais normalmente
→ Nenhum bloqueio
```

### Cenário 4 — IA extrai, humano ainda não validou
```
IA leu contrato PDF e sugeriu: Roberto 50%, LR 25%
status_validacao_humana = 'pendente_validacao'
extraido_por_ia = true
→ LINHA BLOQUEADA para a bridge
→ CC Obra retém o valor neste link até aprovação
→ Sistema exibe alerta: "X obras com extração por IA aguardam validação"
→ Operador revisa, corrige se necessário, confirma
→ Após confirmação: status_validacao_humana = 'validado', fonte_controle = 'manual'
→ Bridge pode calcular
```

### Cenário 5 — IA extrai, humano valida e corrige
```
IA sugeriu: LR Edições = 30%
Operador corrige para: LR Edições = 25% (conforme contrato físico)
Operador confirma
→ fonte_controle = 'manual'
→ status_validacao_humana = 'validado'
→ observacao_validacao = "Corrigido de 30% (IA) para 25% (contrato físico pág. 3)"
→ Bridge usa 25%
```

### Cenário 6 — Dois contratos vigentes para o mesmo autor
```
Contrato A: vigente, data_inicio 2020
Contrato B: vigente, data_inicio 2023
→ USA O MAIS RECENTE (contrato B)
→ Registra aviso: "Múltiplos contratos vigentes. Usando o mais recente (2023)."
→ Bridge calcula com contrato B
```

### Cenário 7 — Obra sem nenhuma fonte
```
Obra criada manualmente, sem CWR e sem contrato
→ Links ficam com status_controle = 'pendente'
→ status_validacao_humana = 'pendente_validacao'
→ Bridge ignora estes links (produz 0 linhas para a obra)
→ Analítico fica vazio
→ CC Obra não distribui: retém 100% até resolução
```

---

## Relatório de inconsistências (futura view SQL)

```sql
-- Futuro: vw_inconsistencias_obras
SELECT
  o.titulo,
  olt.nome AS participante,
  olt.fonte_controle,
  olt.status_validacao_humana,
  olt.observacao_validacao,
  CASE
    WHEN olt.status_validacao_humana = 'pendente_validacao' THEN 'Aguarda validação humana'
    WHEN olt.status_validacao_humana = 'rejeitado'          THEN 'Linha rejeitada — corrigir'
    WHEN olt.percentual_fonomecanico = 0
      AND olt.funcao_no_link = 'E'                          THEN 'Editorial zerado'
    ELSE NULL
  END AS alerta
FROM obras_links_titulares olt
JOIN obras_links ol ON ol.id = olt.obra_link_id
JOIN obras o ON o.id = ol.obra_id
WHERE olt.tenant_id = current_tenant_id()
  AND (
    olt.status_validacao_humana != 'nao_requerida'
    OR (olt.funcao_no_link = 'E' AND olt.percentual_fonomecanico = 0)
  );
```

---

## O que NÃO muda com o resolvedor

| Módulo | Status |
|---|---|
| `executarBridge()` | Sem alteração — continua source-agnostic |
| `obras_analitico` | Sem alteração — lê o que a bridge entrega |
| `logica-cc-obra-v2.ts` | Sem alteração — lê obras_analitico |
| `distribuicao` | Sem alteração — lê CC Obra |
| Migrations 001–019 | Sem alteração |

---

## Pré-requisitos para implementação futura

O resolvedor só precisará ser implementado quando existir **pelo menos uma** dessas fases:

1. **Módulo de Contratos Assinados** — geração, assinatura digital, validação por operador
2. **Módulo de IA de Extração Documental** — upload de PDF, leitura, sugestão de campos + fluxo de aprovação humana obrigatório
3. **Cadastro Manual de Obras** com fluxo de revisão e aprovação interno

Até lá, o CWR continua sendo a única fonte e a bridge funciona diretamente sobre `obras_links_titulares` sem passar pelo resolvedor.

---

*Documento criado em: 05/06/2026*  
*Autor: Verdent (gerado durante sessão de arquitetura Sync Mood)*  
*Conceito central: IA extrai — humano valida — sistema grava*  
*Próxima revisão: ao iniciar o módulo de Contratos Assinados*
