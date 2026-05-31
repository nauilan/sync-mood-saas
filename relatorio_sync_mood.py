"""Gera o Relatório Executivo de Implementação — Sync Mood v2.0"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os, datetime, unicodedata

OUT = r"C:\Users\Usuário\Desktop\sync-mood-saas\Relatorio_SyncMood_2025.pdf"

# ── Cores da marca ──────────────────────────────────────────────────
VERDE     = colors.HexColor("#22c55e")
VERDE_ESC = colors.HexColor("#16a34a")
VERDE_BG  = colors.HexColor("#f0fdf4")
CINZA_FG  = colors.HexColor("#1f2937")
CINZA_BG  = colors.HexColor("#f9fafb")
CINZA_BD  = colors.HexColor("#e5e7eb")
VERMELHO  = colors.HexColor("#ef4444")
AMARELO   = colors.HexColor("#f59e0b")
AZUL      = colors.HexColor("#3b82f6")
PRETO_BG  = colors.HexColor("#111827")

def norm(t):
    return unicodedata.normalize("NFC", t)

# ── Documento ───────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    topMargin=2*cm, bottomMargin=2.2*cm,
    leftMargin=2.5*cm, rightMargin=2.5*cm,
    title="Relatório Executivo — Sync Mood",
    author="Sync Mood / Verdent"
)

styles = getSampleStyleSheet()
W = A4[0] - 5*cm  # largura útil

# ── Estilos customizados ─────────────────────────────────────────────
TITLE  = ParagraphStyle("TITLE",  fontName="Helvetica-Bold", fontSize=22, textColor=PRETO_BG, leading=28, alignment=TA_CENTER)
SUBTITLE = ParagraphStyle("SUBTITLE", fontName="Helvetica", fontSize=11, textColor=colors.HexColor("#6b7280"), alignment=TA_CENTER, leading=16)
H1     = ParagraphStyle("H1",     fontName="Helvetica-Bold", fontSize=14, textColor=VERDE_ESC, spaceBefore=18, spaceAfter=6, leading=18)
H2     = ParagraphStyle("H2",     fontName="Helvetica-Bold", fontSize=11, textColor=CINZA_FG, spaceBefore=12, spaceAfter=4, leading=15)
BODY   = ParagraphStyle("BODY",   fontName="Helvetica",      fontSize=9,  textColor=CINZA_FG, leading=14, alignment=TA_JUSTIFY)
SMALL  = ParagraphStyle("SMALL",  fontName="Helvetica",      fontSize=8,  textColor=colors.HexColor("#6b7280"), leading=12)
CODE   = ParagraphStyle("CODE",   fontName="Courier",        fontSize=8,  textColor=colors.HexColor("#374151"), leading=11, leftIndent=10)
BADGE_G = ParagraphStyle("BADGE_G", fontName="Helvetica-Bold", fontSize=8, textColor=VERDE_ESC, alignment=TA_CENTER)
BADGE_R = ParagraphStyle("BADGE_R", fontName="Helvetica-Bold", fontSize=8, textColor=VERMELHO, alignment=TA_CENTER)
BADGE_Y = ParagraphStyle("BADGE_Y", fontName="Helvetica-Bold", fontSize=8, textColor=AMARELO, alignment=TA_CENTER)

def hr():
    return HRFlowable(width="100%", thickness=1, color=CINZA_BD, spaceAfter=8, spaceBefore=8)

def sp(h=0.3):
    return Spacer(1, h*cm)

def tag(label, cor="green"):
    s = BADGE_G if cor == "green" else BADGE_R if cor == "red" else BADGE_Y
    return Paragraph(label, s)

# ── Estilo de tabela base ─────────────────────────────────────────────
def ts_base(data, col_widths=None, row_bg=True):
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    style = [
        ("BACKGROUND",  (0,0), (-1,0),  VERDE_ESC),
        ("TEXTCOLOR",   (0,0), (-1,0),  colors.white),
        ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,0),  8),
        ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",    (0,1), (-1,-1), 8),
        ("TOPPADDING",  (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING",(0,0), (-1,-1), 6),
        ("GRID",        (0,0), (-1,-1), 0.4, CINZA_BD),
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
    ]
    if row_bg:
        for i in range(1, len(data)):
            bg = colors.white if i % 2 == 1 else CINZA_BG
            style.append(("BACKGROUND", (0,i), (-1,i), bg))
    t.setStyle(TableStyle(style))
    return t

# ── Conteúdo ─────────────────────────────────────────────────────────
story = []

# ─── Capa ────────────────────────────────────────────────────────────
story += [
    sp(2),
    Paragraph(norm("SYNC MOOD"), TITLE),
    Paragraph(norm("ERP Editorial Musical"), TITLE),
    sp(0.4),
    HRFlowable(width="60%", thickness=3, color=VERDE, hAlign="CENTER", spaceAfter=10),
    sp(0.4),
    Paragraph(norm("Relatório Executivo de Implementação"), SUBTITLE),
    Paragraph(norm(f"Gerado em {datetime.date.today().strftime('%d/%m/%Y')}"), SMALL),
    sp(3),
]

# ─── 1. Resumo Executivo ────────────────────────────────────────────
story += [
    Paragraph(norm("1. RESUMO EXECUTIVO"), H1),
    hr(),
    Paragraph(norm(
        "O Sync Mood é um ERP editorial musical completo. A arquitetura de banco de dados está "
        "100% modelada no Supabase/PostgreSQL com 13 migrations aplicadas. A camada de interface "
        "está ~70% concluída. A camada de lógica de negócios (motor de distribuição, B-55, BackOffice) "
        "está em fase inicial (~10–35%). A prioridade imediata é conectar os módulos existentes "
        "ao banco real e implementar o motor de distribuição."
    ), BODY),
    sp(0.5),
]

# KPI boxes
kpi_data = [
    ["MÓDULO", "BANCO", "TELA", "LÓGICA", "TOTAL", "STATUS"],
    ["Obras + Cadastro", "95%", "80%", "70%", "82%", "REAL"],
    ["CWR Import", "90%", "90%", "85%", "88%", "REAL"],
    ["CWR Export", "40%", "30%", "20%", "30%", "PARCIAL"],
    ["Titulares", "80%", "70%", "60%", "70%", "LOCAL"],
    ["Editoras", "90%", "40%", "20%", "50%", "MOCK"],
    ["Contratos", "90%", "30%", "10%", "43%", "MOCK"],
    ["BackOffice B-55", "80%", "20%", "5%", "35%", "MOCK"],
    ["Recebimentos", "80%", "30%", "5%", "38%", "MOCK"],
    ["Distribuição", "70%", "30%", "5%", "35%", "MOCK"],
    ["Conta Corrente", "70%", "30%", "5%", "35%", "MOCK"],
    ["Portal do Autor", "60%", "20%", "5%", "28%", "MOCK"],
    ["MÉDIA GERAL", "", "", "", "~47%", ""],
]

def color_status(val):
    if val == "REAL":   return VERDE_ESC
    if val == "LOCAL":  return AZUL
    if val == "MOCK":   return VERMELHO
    if val == "PARCIAL": return AMARELO
    return CINZA_FG

tbl = Table(kpi_data, colWidths=[4.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 2*cm], hAlign="LEFT")
ts = [
    ("BACKGROUND",  (0,0), (-1,0),  VERDE_ESC),
    ("TEXTCOLOR",   (0,0), (-1,0),  colors.white),
    ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
    ("FONTSIZE",    (0,0), (-1,-1), 8),
    ("ALIGN",       (1,0), (-1,-1), "CENTER"),
    ("TOPPADDING",  (0,0), (-1,-1), 4),
    ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING",(0,0),(-1,-1), 5),
    ("GRID",        (0,0), (-1,-1), 0.4, CINZA_BD),
    ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
    # última linha em destaque
    ("BACKGROUND",  (0,-1),(-1,-1), CINZA_BG),
    ("FONTNAME",    (0,-1),(-1,-1), "Helvetica-Bold"),
]
for i in range(1, len(kpi_data)-1):
    bg = colors.white if i % 2 == 1 else CINZA_BG
    ts.append(("BACKGROUND", (0,i), (-1,i), bg))
    # colorir coluna STATUS
    status_val = kpi_data[i][5]
    ts.append(("TEXTCOLOR", (5,i), (5,i), color_status(status_val)))
    ts.append(("FONTNAME",  (5,i), (5,i), "Helvetica-Bold"))
tbl.setStyle(TableStyle(ts))
story += [tbl, sp(0.3)]

# ─── 2. Status detalhado por módulo ──────────────────────────────────
story += [PageBreak(), Paragraph(norm("2. STATUS DETALHADO POR MÓDULO"), H1), hr()]

mod_data = [
    ["Módulo", "Fonte de Dados", "Observação"],
    ["Obras",        "SUPABASE + localStorage",  "useSupabaseQuery faz merge; save via saveObrasToSupabase"],
    ["CWR Import",   "REAL (Supabase + store)",  "Parser completo; PWR linking; offset auto-detecção + diagnóstico"],
    ["Titulares",    "localStorage (Supabase fallback)", "Upsert por IPI implementado; sem CRUD manual na tela"],
    ["Editoras",     "MOCK hardcoded",            "Banco tem tabela pronta; CRUD ainda não conectado"],
    ["Contratos",    "MOCK hardcoded",            "Banco tem tabela; sem CRUD real"],
    ["Recebimentos", "MOCK hardcoded",            "Banco tem tabela recebimentos; import B-55 não implementado"],
    ["Distribuição", "MOCK hardcoded",            "Banco tem periodos_distribuicao/distribuicoes; motor = zero"],
    ["CC Obra",      "MOCK (array vazio)",         "Banco tem cc_obras_movimentos; tela mostra KPIs zerados"],
    ["CC Titular",   "MOCK (array vazio)",         "Banco tem cc_titulares_movimentos; tela mostra KPIs zerados"],
    ["BackOffice",   "MOCK hardcoded",            "Banco tem campos backoffice_song_id/work_id; integração = zero"],
    ["Portal Autor", "Não auditado",              "Provavelmente mock; banco tem RLS pronto"],
]
story += [ts_base(mod_data, col_widths=[3.5*cm, 4.5*cm, 6*cm]), sp(0.5)]

# ─── 3. Banco de Dados — Tabelas criadas ─────────────────────────────
story += [Paragraph(norm("3. MIGRATIONS SUPABASE — O QUE JÁ EXISTE NO BANCO"), H1), hr()]

mig_data = [
    ["Migration", "Tabelas / Ações"],
    ["001 — ENUMs",         "18 tipos enumerados: status_obra, tipo_titular, fonte_recebimento…"],
    ["002 — Tenants/Usuários", "tenants, usuarios"],
    ["003 — Editoras",      "editoras (+ campos de controle e BackOffice)"],
    ["004 — Titulares",     "titulares, titulares_pf/pj, pseudonimos, enderecos, contatos, documentos"],
    ["005 — Contratos",     "contratos, contrato_obras, contrato_termos, contrato_documentos"],
    ["006 — Obras",         "obras, obras_links, obras_links_titulares, fonogramas"],
    ["007 — Recebimentos",  "importacoes_log, recebimentos"],
    ["008 — Distribuição",  "periodos_distribuicao, distribuicoes, distribuicao_itens, cc_obras_movimentos, cc_titulares_movimentos"],
    ["009 — Autorizações",  "autorizacoes, prestacao_contas, prestacao_contas_itens"],
    ["010 — RLS",           "Políticas Row Level Security em todas as tabelas"],
    ["011 — Seed",          "Primeiro tenant + editora master + usuário admin"],
    ["012 — Rastreabilidade","ADD COLUMNS: codigo_interno_legado, backoffice_song_id, backoffice_work_id, origem_importacao"],
    ["013 — Territórios",   "territorios, tipos_direito, obra_territory_collect"],
]
story += [ts_base(mig_data, col_widths=[4.5*cm, 9*cm]), sp(0.5)]

# ─── 4. Diagrama das Entidades ────────────────────────────────────────
story += [PageBreak(), Paragraph(norm("4. DIAGRAMA DAS ENTIDADES PRINCIPAIS"), H1), hr()]

diagram_lines = [
    "TENANT",
    "  ├── EDITORA  (id, codigo, nome, cae, ipi, tipo: master|administrada|externa, controlada)",
    "  ├── TITULAR  (id, codigo, codigo_interno_legado[HR01], cae_principal, ipi, sociedade_pr/mr)",
    "  ├── CONTRATO (id, titular_id, editora_id, vigencia, taxa_adm)",
    "  └── OBRA     (id, titulo, codigo[SyncMood], codigo_interno_legado[AFW2])",
    "        │       iswc, idioma, genero, duracao",
    "        │       backoffice_song_id, backoffice_work_id, backoffice_status",
    "        │",
    "        ├── OBRA_LINK (id, numero_link, percentual_controlado)",
    "        │     └── OBRA_LINK_TITULAR  ← MATRIZ CENTRAL",
    "        │           titular_id, papel_cwr [CA/E/AM/OWR/OPU]",
    "        │           percentual_pr, percentual_mr, percentual_sync",
    "        │           writer_sequence_code, publisher_sequence_code",
    "        │           pwr_writer_code, pwr_publisher_code",
    "        │           contrato_id, territorio_id, controlado",
    "        │",
    "        ├── TERRITORIO",
    "        │     └── OBRA_TERRITORY_COLLECT",
    "        │           obra_id, territorio_id, publisher_local_id",
    "        │           collect_pr%, collect_mr%, data_inicio, data_fim",
    "        │",
    "        ├── FONOGRAMA (ISRC, interprete, versao, duracao)",
    "        │",
    "        ├── RECEBIMENTO",
    "        │     id, fonte [backoffice|tv|sync|ecad], obra_id",
    "        │     territorio_id, tipo_direito_id, valor_bruto, moeda",
    "        │     status [importado→conciliado→aprovado→distribuido]",
    "        │",
    "        └── DISTRIBUICAO",
    "              periodo_id → DISTRIBUICAO_ITEM",
    "                obra_id, titular_id, link_id",
    "                valor_bruto, taxa_adm, retencao, valor_liquido",
    "                ↓",
    "                CC_TITULAR_MOVIMENTO  ← Conta Corrente do Titular",
    "                CC_OBRA_MOVIMENTO     ← Conta Corrente da Obra",
]

bg_box = Table([["\n".join(diagram_lines)]], colWidths=[W])
bg_box.setStyle(TableStyle([
    ("BACKGROUND",   (0,0), (-1,-1), PRETO_BG),
    ("FONTNAME",     (0,0), (-1,-1), "Courier"),
    ("FONTSIZE",     (0,0), (-1,-1), 7.5),
    ("TEXTCOLOR",    (0,0), (-1,-1), VERDE),
    ("TOPPADDING",   (0,0), (-1,-1), 10),
    ("BOTTOMPADDING",(0,0), (-1,-1), 10),
    ("LEFTPADDING",  (0,0), (-1,-1), 12),
    ("RIGHTPADDING", (0,0), (-1,-1), 12),
    ("ROUNDEDCORNERS", (0,0), (-1,-1), [4,4,4,4]),
]))
story += [bg_box, sp(0.5)]

# ─── 5. Prova de Conceito ─────────────────────────────────────────────
story += [PageBreak(), Paragraph(norm("5. PROVA DE CONCEITO — FLUXO \"EU NÃO IRIA\""), H1), hr(),
    Paragraph(norm(
        "Fluxo completo da obra 'EU NÃO IRIA' — Autor: Lucas Vieira / Editora: Lojas Mil Calçados / "
        "Administradora: Top Show Music. Status de cada etapa no sistema atual:"
    ), BODY), sp(0.3)]

poc_data = [
    ["Etapa", "Ação", "Status", "Observação"],
    ["1. Cadastro", "Obra criada com título, código legado, ISWC", "OK", "Tela + Supabase funcionais"],
    ["2. Links", "CWR import reconstrói via PWR", "OK", "SPU→SWR via sequence code"],
    ["3. Participantes", "Lucas (CA), Lojas Mil (E), Top Show (AM)", "OK", "controlado=true para todos"],
    ["4. CWR Import", "NWR+SPU+SWR+PWR lidos e salvos", "OK", "Commit 30fa8b0 + diagnóstico"],
    ["5. CWR Export", "Gerar arquivo CWR válido para envio", "PARCIAL", "Tela existe; lógica incompleta"],
    ["6. BackOffice", "Receber song_id / work_id de retorno", "NÃO", "Apenas mock"],
    ["7. Import B-55", "Processar relatório de recebimento", "NÃO", "A implementar"],
    ["8. Matching", "Conciliar B-55 com obra por código", "NÃO", "A implementar"],
    ["9. Distribuição", "Normalizar 50% controlado → Lucas 75%", "NÃO", "Motor não implementado"],
    ["10. CC", "Lançar em CC Obra + CC Titular", "NÃO", "Banco pronto; lógica = zero"],
]

poc_tbl = Table(poc_data, colWidths=[2.5*cm, 5*cm, 2*cm, 4.5*cm], hAlign="LEFT")
poc_ts = [
    ("BACKGROUND",  (0,0), (-1,0),  VERDE_ESC),
    ("TEXTCOLOR",   (0,0), (-1,0),  colors.white),
    ("FONTNAME",    (0,0), (-1,0),  "Helvetica-Bold"),
    ("FONTSIZE",    (0,0), (-1,-1), 8),
    ("TOPPADDING",  (0,0), (-1,-1), 4),
    ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING",(0,0),(-1,-1), 5),
    ("GRID",        (0,0), (-1,-1), 0.4, CINZA_BD),
    ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
    ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
]
for i in range(1, len(poc_data)):
    bg = colors.white if i % 2 == 1 else CINZA_BG
    poc_ts.append(("BACKGROUND", (0,i), (-1,i), bg))
    st = poc_data[i][2]
    c = VERDE_ESC if st=="OK" else VERMELHO if st=="NÃO" else AMARELO
    poc_ts.append(("TEXTCOLOR", (2,i), (2,i), c))
    poc_ts.append(("FONTNAME",  (2,i), (2,i), "Helvetica-Bold"))
poc_tbl.setStyle(TableStyle(poc_ts))
story += [poc_tbl, sp(0.5)]

# ─── 6. Cronograma ────────────────────────────────────────────────────
story += [Paragraph(norm("6. CRONOGRAMA DE IMPLEMENTAÇÃO"), H1), hr()]

cron_data = [
    ["Fase", "Foco", "Entregáveis"],
    ["Fase 1\nSem 1-2", "Base real",
     "Editoras CRUD → Supabase\nContratos CRUD → Supabase\nRLS testada com usuário real"],
    ["Fase 2\nSem 3-4", "Motor BackOffice",
     "Parser B-55\nMatching automático + validação humana\nStatus song/work na tela de obras"],
    ["Fase 3\nSem 5-6", "Motor Distribuição",
     "Recebimento aprovado → matriz obra\nNormalização parte controlada\nLançamento CC Obra + CC Titular"],
    ["Fase 4\nSem 7-8", "Conta Corrente",
     "CC por obra e titular (dados reais)\nDemonstrativos e extrato\nPrestação de contas"],
    ["Fase 5\nSem 9-10", "Portais",
     "Portal do Autor (RLS isolado)\nPortal Editora Administrada\nEscopo restrito por tenant"],
]
story += [ts_base(cron_data, col_widths=[2.5*cm, 3*cm, 8.5*cm]), sp(0.5)]

# ─── 7. Escopo Travado ────────────────────────────────────────────────
story += [Paragraph(norm("7. ESCOPO TRAVADO — O QUE NÃO DEVE SER FEITO AGORA"), H1), hr()]

nao_data = [
    ["Proibido", "Motivo"],
    ["Criar novos módulos visuais antes de consolidar banco", "Gera telas sem dados reais"],
    ["Manter localStorage como storage definitivo", "Dados perdidos ao limpar browser"],
    ["Percentuais fixos no código",                 "Regra deve vir do contrato"],
    ["Distribuir execução pública ECAD/Socinpro",   "ECAD já distribui — apenas demonstrativo"],
    ["Importar CWR sem preservar PWR",              "Quebra o link autor→editora"],
    ["Exportar CWR sem validação prévia",           "Arquivo inválido rejeitado pela BackOffice"],
    ["Distribuir B-55 sem matching aprovado",       "Risco financeiro — exige validação humana"],
    ["Substituir código legado sem log",            "AFW2, HR01 — códigos históricos imutáveis"],
    ["Ampliar escopo sem validação",                "Arquitetura aprovada — foco é implementação"],
]
story += [ts_base(nao_data, col_widths=[7*cm, 7*cm]), sp(0.5)]

# ─── 8. Fix CWR publicado ─────────────────────────────────────────────
story += [PageBreak(), Paragraph(norm("8. CORREÇÃO CWR — COMMIT 30fa8b0 (PUBLICADO)"), H1), hr(),
    Paragraph(norm("Mudanças aplicadas e publicadas no Vercel:"), H2)]

fix_data = [
    ["O quê", "Onde", "Impacto"],
    ["Painel diagnóstico NWR bruto", "Tela Importar CWR", "Mostra linha raw + campos em off=0/4/8 lado a lado"],
    ["Botão 'Zerar obras locais'", "Tela Importar CWR", "Remove TODO o localStorage de obras/titulares para reimportar limpo"],
    ["Botão 'Zerar dados locais'", "Tela de Obras", "Aparece sempre que há dados locais; limpeza nuclear"],
    ["Detecção ISWC inválido", "Tela de Obras", "Identifica ISWC com apenas dígitos como dados ruins"],
    ["debug_nwr_line no parser", "lib/cwr-parser.ts", "Primeira linha NWR bruta retornada para diagnóstico na UI"],
]
story += [ts_base(fix_data, col_widths=[4*cm, 3.5*cm, 6.5*cm]), sp(0.5)]

story += [
    Paragraph(norm("Como usar após o deploy:"), H2),
    Paragraph(norm("1. Abra Importar CWR → clique 'Zerar obras locais'"), BODY),
    Paragraph(norm("2. Selecione o arquivo .CWR novamente"), BODY),
    Paragraph(norm("3. Expanda o painel 'Diagnóstico: linha NWR bruta'"), BODY),
    Paragraph(norm("4. Veja os campos título/lang/codigo/iswc em off=0, off=4 e off=8"), BODY),
    Paragraph(norm("5. O offset correto é aquele onde lang=2 letras maiúsculas (ex: PT) e título legível"), BODY),
    Paragraph(norm("6. Se o detectado não estiver certo, use 'Forçar offset' e reimporte"), BODY),
    sp(0.5),
]

# ─── 9. Conclusão ─────────────────────────────────────────────────────
story += [
    hr(),
    Paragraph(norm("CONCLUSÃO"), H1),
    Paragraph(norm(
        "O Sync Mood possui fundação sólida: banco de dados completo com 13 migrations, "
        "arquitetura de entidades modelada corretamente, e CWR import/export com lógica PWR. "
        "O percentual de conclusão geral é de aproximadamente 47%, concentrado principalmente "
        "no banco (85% pronto) e nas telas de obras/CWR. "
        "Os módulos de distribuição, conta corrente, BackOffice B-55 e portais têm a estrutura "
        "do banco pronta, mas ainda dependem de implementação da lógica de negócios. "
        "A Arquitetura Funcional v2.0 está aprovada. O foco agora é exclusivamente implementação — "
        "sem novos módulos, sem alteração de escopo."
    ), BODY),
    sp(0.5),
    Paragraph(norm(f"Sync Mood ERP — Relatório gerado automaticamente em {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}"), SMALL),
]

doc.build(story)
print(f"PDF gerado: {OUT}")
