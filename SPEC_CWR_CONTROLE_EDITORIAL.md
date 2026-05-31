# ESPECIFICAÇÃO CWR + CONTROLE EDITORIAL — SYNC MOOD
**Versão:** 1.0 | **Data:** 31/05/2026 | **Status:** Aguardando implementação

---

## PRINCÍPIO CENTRAL

A MATRIZ DA OBRA é a fonte de verdade de todo o sistema.
Todos os módulos (CWR, BackOffice, Contratos, Distribuição, CC, Portal) devem derivar dela.

```
OBRA
 └── TERRITÓRIO (BR / EXT / personalizado)
      └── LINK editorial
           └── PARTICIPANTE (autor / editora / AM / SE)
                └── DIREITO (Exec. Pública / Fonomecanico / Sync / ...)
                     └── PERCENTUAL (parametrizável — NUNCA fixo no código)
```

---

## 1. REGRA DE CONTROLE EDITORIAL

| Registro | Condição | Controlado? |
|----------|----------|-------------|
| SPU AM | Corresponde à Top Show Music | ✅ SIM |
| SPU E | Editora administrada cadastrada no sistema | ✅ SIM |
| SPU E | Editora externa (não cadastrada) | ❌ NÃO |
| SWR | Ligado via PWR a editora controlada | ✅ SIM |
| SWR | Ligado via PWR a editora externa | ❌ referência |
| OWR | Sempre | ❌ NÃO |
| OPU | Sempre | ❌ NÃO |

**Editoras administradas controladas:** Top Show Music, Edi Music, LR Edições, P3, Lamu e demais administradas cadastradas.

---

## 2. CÁLCULO DO PERCENTUAL CONTROLADO

Somar toda a cadeia controlada. Normalizar para 100% na distribuição.

```
Exemplo A (100% controlado):
  Autor controlado:  75%  → distribuir 75%
  Editora E:         20%  → distribuir 20%
  AM Top Show:        5%  → distribuir  5%
  TOTAL CONTROLADO: 100%

Exemplo B (50% controlado):
  Autor controlado:  37,5% → normalizado: 75%
  Editora E:         10%   → normalizado: 20%
  AM Top Show:        2,5% → normalizado:  5%
  Autor OWR externo: 50%   → referência, não distribui
  TOTAL CONTROLADO:  50%   → normalizado para 100%
```

---

## 3. REGISTROS CWR

### Importar:
`HDR, GRH, NWR, SPU, SPT, SWR, SWT, PWR, OWR, ALT, PER, REC, GRT, TRL`

### NÃO importar / NÃO exportar:
`AGR, TER, IPA, NPA, EWT, INS, IND, ORN, COM`

---

## 4. REGRA DO PWR

O PWR liga autor e editora pelos **códigos sequenciais internos**, não apenas por IPI.

```
SPU  → publisher_sequence_code  (ex: ED01, 2646326)
SWR  → writer_sequence_code     (ex: HR01, 128, 434)
PWR  → publisher_seq + writer_seq  (define o vínculo)
```

O parser DEVE preservar e usar esses códigos para montar o ObraLink.

---

## 5. CAMPOS NOVOS — OBRAS (adicionar, não substituir)

```typescript
// Adicionar em Obra (tipos + migration SQL + tela)
codigo_interno_legado:     string | null  // Ex: AFW2 (≠ ISWC)
codigo_obra_cwr_original:  string | null  // Código conforme veio no CWR
codigo_publisher_song:     string | null  // Bater com relatórios B-55
backoffice_song_id:        string | null  // ID BackOffice fase SONG
backoffice_work_id:        string | null  // ID BackOffice fase WORK
backoffice_status:         'nao_enviada' | 'enviada' | 'song_passiva' |
                           'work_ativa' | 'rejeitada' | 'divergente'
backoffice_last_sync_at:   Date | null
origem_importacao:         'manual' | 'cwr' | 'swi' | 'backoffice' | 'migracao_legado'
```

**Manter intacto:** `codigo, titulo, iswc, editora_id, contrato_origem_id, _links, _fonogramas`

---

## 6. CAMPOS NOVOS — TITULARES (adicionar)

```typescript
codigo_interno_legado:        string | null  // Ex: HR01 (≠ CAE ≠ IPI)
codigo_autor_cwr_original:    string | null
codigo_titular_sistema_antigo: string | null
codigo_sequence_cwr:          string | null  // Sequencial dentro da obra
origem_importacao:            'manual' | 'cwr' | 'contrato' | 'migracao_legado'
```

---

## 7. CAMPOS NOVOS — EDITORAS (adicionar)

```typescript
codigo_interno_legado:       string | null
codigo_publisher_cwr:        string | null
codigo_sequence_cwr:         string | null
backoffice_publisher_id:     string | null
controlada:                  boolean        // true = no grupo
tipo_editora:                'master' | 'administrada' | 'externa'
```

---

## 8. CAMPOS NOVOS — OBRA_LINK_TITULAR (adicionar)

```typescript
writer_sequence_code:          string | null
publisher_sequence_code:       string | null
pwr_writer_code:               string | null
pwr_publisher_code:            string | null
codigo_vinculo_cwr_original:   string | null
codigo_interno_legado_titular: string | null
codigo_interno_legado_editora: string | null
fonte_controle: 'contrato' | 'cwr' | 'editora_administrada' | 'manual' | 'sistema_antigo'
```

---

## 9. NOVA ENTIDADE — BACKOFFICE_MAPPING

```typescript
interface BackofficeMapping {
  id:                    string
  obra_id:               string
  codigo_interno_legado: string | null   // AFW2
  codigo_obra_sync_mood: string
  codigo_obra_cwr_original: string | null
  backoffice_song_id:    string | null
  backoffice_work_id:    string | null
  backoffice_status:     BackofficeStatus
  statement_song_code:   string | null   // Publishers_SongCode do B-55
  data_envio:            Date | null
  data_retorno:          Date | null
  mensagem_retorno:      string | null
  erros:                 string[]
  avisos:                string[]
  arquivo_exportacao_id: string | null
  arquivo_retorno_id:    string | null
}
```

---

## 10. MATRIZ DE PARTICIPAÇÕES (tela de obra)

Formato de grade para o cadastro de obra:

| Link | Titular/Editora | Categoria | CAE | % EP BR | % Fono BR | % Sync BR | Controlado |
|------|----------------|-----------|-----|---------|-----------|-----------|-----------|
| 1 | Nauilan | CA | ... | 37,5% | 37,5% | 37,5% | ✅ |
| 1 | Edi Music | E | ... | 7,5% | 7,5% | 7,5% | ✅ |
| 1 | Top Show Music | AM | ... | 5% | 5% | 5% | ✅ |
| 2 | Giovani Avelar | CA | ... | 37,5% | 37,5% | 37,5% | ✅ |
| 2 | Top Show Music | E | ... | 12,5% | 12,5% | 12,5% | ✅ |

---

## 11. TIPOS DE DIREITOS (parametrizáveis — não fixar no código)

### Brasil
`EP_BR, FONO_BR, SYNC_BR, PUBLI_BR, GRAFICO_BR, PARTITURA_BR, KARAOKE_BR, AUDIOVISUAL_BR, BANCO_DADOS_BR, DIST_DIGITAL_BR, COMUNICACAO_PUBLICA_BR`

### Exterior
`EP_EXT, FONO_EXT, SYNC_EXT, PUBLI_EXT, GRAFICO_EXT, PARTITURA_EXT, KARAOKE_EXT, AUDIOVISUAL_EXT`

**REGRA:** A lista de direitos deve ser configurável via cadastro. Novos tipos não exigem mudança no código.

---

## 12. TERRITÓRIOS (parametrizáveis)

Não restringir a Brasil/Exterior. Suportar:
- Brasil, Mundo, América Latina, EUA, Canadá, Europa, Portugal, Espanha, Japão, personalizado.
- Cada território pode ter participantes, editoras, percentuais e contratos diferentes.

---

## 13. PERCENTUAIS — REGRA ABSOLUTA

**NENHUM percentual deve ser fixo no código.**

Configuráveis por: contrato, obra, participante, direito, território, subeditora, período.

```
❌ ERRADO:  const AUTOR_SHARE = 0.75
❌ ERRADO:  const EDITORA_SHARE = 0.25
✅ CERTO:   const share = contrato.percentuais[participante][direito][territorio]
```

---

## 14. CATEGORIAS CWR

| Código | Descrição |
|--------|-----------|
| CA | Composer Author |
| A | Author |
| C | Composer |
| V | Versionista |
| AD | Adaptador |
| E | Editora Original |
| AM | Administradora |
| SE | Subeditora |

---

## 15. VALIDAÇÕES ANTES DE EXPORTAR CWR

- [ ] Obra tem título
- [ ] Obra tem código interno
- [ ] Ao menos um titular controlado
- [ ] Ao menos uma editora controlada
- [ ] Percentuais fecham corretamente
- [ ] Cada SWR controlado tem PWR ligando a SPU controlada
- [ ] Cada SPU tem SPT Brasil
- [ ] Cada SWR tem SWT Brasil
- [ ] Códigos internos legados preservados

---

## 16. BUSCA DE OBRAS (múltiplas chaves)

Toda obra deve ser localizável por:
- Código Sync Mood (SM000001)
- Código legado (AFW2)
- ISWC (T-xxx)
- Título
- BackOffice Song ID
- BackOffice Work ID
- Publishers_SongCode (B-55)

---

## 17. TELAS A ATUALIZAR

| Tela | Campos novos a exibir |
|------|-----------------------|
| Obras | codigo_interno_legado, backoffice_song_id, backoffice_work_id, backoffice_status |
| Titulares | codigo_interno_legado (HR01), CAE, IPI, origem_importacao |
| Editoras | tipo_editora, controlada, codigo_publisher_cwr, backoffice_publisher_id |
| CWR Importação | códigos internos capturados, controlados/não controlados, vínculos PWR |
| CWR Exportação | status pronto/pendente por obra, alertas de inconsistência |
| BackOffice | retorno SONG/WORK, vínculo obra↔BackOffice, erros/avisos |

---

## 18. PRIORIDADE DE IMPLEMENTAÇÃO

1. **Campos novos nas migrations SQL** (obras, titulares, editoras, obra_link_titular)
2. **Tipos TypeScript** atualizados (types-obras.ts, types-cadastros.ts)
3. **Parser CWR** — capturar sequence codes, montar links por PWR, marcar controlados
4. **Regra de controle editorial** via tabela de editoras administradas
5. **Tela de obra** — exibir matriz de participações com campos legado
6. **Exportação CWR** — usando matriz + validações
7. **BackofficeMapping** — tabela + tela de rastreamento
8. **Motor de distribuição** — consultar percentuais da matriz, nunca usar fixos

---

*Especificação elaborada em 31/05/2026 — base para implementação Fase B do Sync Mood*
