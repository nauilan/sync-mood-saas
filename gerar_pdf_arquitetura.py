from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os, unicodedata

OUTPUT = r"C:\Users\Usuário\Desktop\sync-mood-saas\Arquitetura_Funcional_SyncMood.pdf"

# ── Cores ─────────────────────────────────────────────────────────────────────
DARK_BG   = colors.HexColor("#0d1526")
VIOLET    = colors.HexColor("#7c3aed")
VIOLET_LT = colors.HexColor("#ede9fe")
EMERALD   = colors.HexColor("#059669")
EMERALD_LT= colors.HexColor("#d1fae5")
SKY       = colors.HexColor("#0284c7")
SKY_LT    = colors.HexColor("#e0f2fe")
AMBER     = colors.HexColor("#d97706")
AMBER_LT  = colors.HexColor("#fef3c7")
ROSE      = colors.HexColor("#e11d48")
ROSE_LT   = colors.HexColor("#ffe4e6")
GRAY_LT   = colors.HexColor("#f8fafc")
GRAY_BD   = colors.HexColor("#e2e8f0")
GRAY_TXT  = colors.HexColor("#64748b")
TEXT_MAIN = colors.HexColor("#1e293b")
CODE_BG   = colors.HexColor("#1e293b")
CODE_TXT  = colors.HexColor("#e2e8f0")

def s(text):
    return unicodedata.normalize("NFC", str(text))

# ── Estilos ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def make_style(name, parent="Normal", **kw):
    return ParagraphStyle(name, parent=styles[parent], **kw)

cover_title = make_style("CoverTitle",
    fontSize=32, leading=40, textColor=colors.white,
    fontName="Helvetica-Bold", spaceAfter=8)
cover_sub = make_style("CoverSub",
    fontSize=13, leading=18, textColor=colors.HexColor("#a5b4fc"),
    fontName="Helvetica", spaceAfter=4)
cover_meta = make_style("CoverMeta",
    fontSize=10, leading=14, textColor=colors.HexColor("#94a3b8"),
    fontName="Helvetica")

h1 = make_style("H1",
    fontSize=20, leading=26, textColor=DARK_BG,
    fontName="Helvetica-Bold", spaceBefore=20, spaceAfter=8,
    borderPad=(0,0,4,0))
h2 = make_style("H2",
    fontSize=14, leading=20, textColor=VIOLET,
    fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6)
h3 = make_style("H3",
    fontSize=11, leading=16, textColor=SKY,
    fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4)
body = make_style("Body",
    fontSize=10, leading=15, textColor=TEXT_MAIN,
    fontName="Helvetica", spaceAfter=6)
body_small = make_style("BodySmall",
    fontSize=9, leading=13, textColor=GRAY_TXT,
    fontName="Helvetica", spaceAfter=4)
bullet_style = make_style("Bullet",
    fontSize=10, leading=15, textColor=TEXT_MAIN,
    fontName="Helvetica", leftIndent=16, spaceAfter=3,
    bulletIndent=4)
code_style = make_style("Code",
    fontSize=8.5, leading=13, textColor=CODE_TXT,
    fontName="Courier", leftIndent=12, rightIndent=12,
    backColor=CODE_BG, borderPad=8, spaceAfter=6)
note_style = make_style("Note",
    fontSize=9, leading=13, textColor=colors.HexColor("#92400e"),
    fontName="Helvetica-Oblique", leftIndent=12,
    backColor=AMBER_LT, borderPad=6, spaceAfter=6)
rule_style = make_style("Rule",
    fontSize=9.5, leading=14, textColor=colors.HexColor("#065f46"),
    fontName="Helvetica-Bold", leftIndent=12,
    backColor=EMERALD_LT, borderPad=6, spaceAfter=6)
doubt_style = make_style("Doubt",
    fontSize=9.5, leading=14, textColor=colors.HexColor("#7c3aed"),
    fontName="Helvetica-Oblique", leftIndent=12,
    backColor=VIOLET_LT, borderPad=6, spaceAfter=4)
tag_style = make_style("Tag",
    fontSize=8, leading=12, textColor=colors.white,
    fontName="Helvetica-Bold")

def P(text, style=None):
    return Paragraph(s(text), style or body)

def B(text):
    return Paragraph(s(text), bullet_style)

def SP(n=0.3):
    return Spacer(1, n*cm)

def HR(color=GRAY_BD, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=6)

def section_header(title, part=None):
    elems = []
    elems.append(SP(0.5))
    if part:
        elems.append(P(s(part), make_style("Part",
            fontSize=9, textColor=VIOLET, fontName="Helvetica-Bold",
            spaceAfter=2)))
    elems.append(P(s(title), h1))
    elems.append(HR(VIOLET, 1.5))
    return elems

def sub_header(title):
    return [SP(0.2), P(s(title), h2)]

def subsub_header(title):
    return [SP(0.1), P(s(title), h3)]

def table_data(headers, rows, col_widths=None, header_color=VIOLET):
    data = [[P(s(h), make_style("TH", fontSize=9, fontName="Helvetica-Bold",
               textColor=colors.white)) for h in headers]]
    for row in rows:
        data.append([P(s(c), make_style("TD", fontSize=9, fontName="Helvetica",
                       textColor=TEXT_MAIN)) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), header_color),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GRAY_LT]),
        ("GRID", (0,0), (-1,-1), 0.4, GRAY_BD),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ]))
    return t

def code_block(text):
    return Paragraph(s(text).replace("\n","<br/>").replace(" ","&nbsp;"), code_style)

# ── Cover page ────────────────────────────────────────────────────────────────
def cover_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    # dark background
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    # violet accent bar top
    canvas.setFillColor(VIOLET)
    canvas.rect(0, h-8, w, 8, fill=1, stroke=0)
    # accent bar bottom
    canvas.rect(0, 0, w, 4, fill=1, stroke=0)
    # large decorative circle
    canvas.setFillColor(colors.HexColor("#1e1b4b"))
    canvas.circle(w-80, h-120, 160, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#312e81"))
    canvas.circle(w-60, h-100, 80, fill=1, stroke=0)
    canvas.restoreState()

def later_pages(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, h-28, w, 28, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(colors.white)
    canvas.drawString(1.5*cm, h-18, s("Arquitetura Funcional — Sync Mood SaaS"))
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#94a3b8"))
    canvas.drawRightString(w-1.5*cm, h-18, s(f"Pagina {doc.page}"))
    # footer line
    canvas.setStrokeColor(GRAY_BD)
    canvas.setLineWidth(0.3)
    canvas.line(1.5*cm, 1.5*cm, w-1.5*cm, 1.5*cm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GRAY_TXT)
    canvas.drawString(1.5*cm, 1*cm, s("Sync Mood Gestao Inteligente  •  Documento Confidencial"))
    canvas.drawRightString(w-1.5*cm, 1*cm, s("v1.0 — 2026"))
    canvas.restoreState()

# ── Build story ───────────────────────────────────────────────────────────────
story = []

# ── COVER ─────────────────────────────────────────────────────────────────────
story.append(SP(6))
story.append(P("Arquitetura Funcional", cover_title))
story.append(P("Sync Mood Gestao Inteligente", cover_sub))
story.append(P("Documento de Validacao de Entendimento — v1.0  •  2026", cover_meta))
story.append(SP(1))
story.append(HR(VIOLET, 1))
story.append(SP(0.5))
story.append(P(
    "Este documento consolida o modelo de negocio completo do Sync Mood: "
    "entidades, relacionamentos, regras editoriais, CWR, BackOffice e motor de distribuicao. "
    "Para cada modulo: o que foi entendido, quais tabelas serao utilizadas, "
    "quais regras de negocio se aplicam e quais duvidas permanecem abertas.",
    make_style("CoverDesc", fontSize=11, leading=17,
               textColor=colors.HexColor("#cbd5e1"), fontName="Helvetica")))
story.append(PageBreak())

# ── INDICE ────────────────────────────────────────────────────────────────────
story += section_header("Indice")
idx_items = [
    ("Parte 1", "Entidades Principais", "Obra, Titular, Editora, Contrato, Recebimento, Distribuicao"),
    ("Parte 2", "Relacionamentos", "ObraLink, ObraLinkTitular, Publisher Original, Publisher Local, Territorios"),
    ("Parte 3", "CWR", "Importacao e Exportacao"),
    ("Parte 4", "BackOffice", "Song ID, Work ID, Collect, Matching"),
    ("Parte 5", "Distribuicao", "Direitos, Territorios, Participantes"),
    ("Apendice", "Duvidas Abertas", "10 questoes criticas para validacao com o usuario"),
]
tbl_idx = table_data(
    ["Parte", "Titulo", "Conteudo"],
    idx_items,
    col_widths=[2.5*cm, 5*cm, 9.5*cm],
    header_color=DARK_BG
)
story.append(tbl_idx)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 1 — ENTIDADES
# ═══════════════════════════════════════════════════════════════════════════════
story += section_header("Entidades Principais", "PARTE 1")

# ── OBRA ──────────────────────────────────────────────────────────────────────
story += sub_header("1.1  Obra")
story.append(P(
    "A obra nao e uma ficha simples com <b>autor + percentual</b>. "
    "E uma <b>matriz de participacoes</b> que define quem tem direito sobre o que, "
    "em qual territorio, em qual tipo de direito. "
    "Tudo no sistema nasce da obra: CWR, BackOffice, recebimentos, distribuicao, "
    "conta corrente e prestacao de contas."))
story += subsub_header("Tabelas utilizadas")
story.append(P("obras  —  obras_links  —  obras_links_titulares"))
story += subsub_header("Campos criticos")
story.append(table_data(
    ["Campo", "Descricao", "Exemplo"],
    [
        ("codigo", "ID interno Sync Mood", "SM000001"),
        ("codigo_interno_legado", "Codigo do sistema antigo — NUNCA apagar", "AFW2"),
        ("codigo_obra_cwr_original", "Como veio no arquivo CWR", "AFW2"),
        ("iswc", "Padrao internacional CISAC", "T-123.456.789-0"),
        ("backoffice_song_id", "ID quando BackOffice registra como SONG (passiva)", "SONG-99812"),
        ("backoffice_work_id", "ID quando BackOffice valida como WORK (ativa)", "WORK-12345"),
        ("backoffice_status", "Status na BackOffice", "nao_enviada | song | work | divergente"),
    ],
    col_widths=[4.5*cm, 8*cm, 5*cm]
))
story.append(P("Regra:", rule_style))
story.append(P(
    "AFW2 nao e ISWC. Sao campos separados. AFW2 e o codigo do sistema legado. "
    "ISWC e o padrao CISAC internacional. Os dois devem coexistir e nunca ser confundidos.", body_small))
story += subsub_header("Duvidas abertas")
story.append(P("1. Quando uma obra nao tem ISWC, o fluxo de solicitacao a ABRAMUS/ECAD e manual ou o Sync Mood automatiza?", doubt_style))
story.append(P("2. Uma obra pode ter dois codigo_interno_legado diferentes se foi importada de sistemas diferentes?", doubt_style))

story.append(SP())

# ── TITULAR ───────────────────────────────────────────────────────────────────
story += sub_header("1.2  Titular")
story.append(P(
    "Um titular e qualquer pessoa (fisica ou juridica) que tenha algum direito sobre uma obra: "
    "autor, compositor, interprete, produtor, editora ou gravadora. "
    "Cada titular tem identificadores que nao se confundem:"))
story.append(table_data(
    ["Campo", "Descricao", "Exemplo"],
    [
        ("codigo_interno_legado", "Codigo do sistema antigo", "HR01"),
        ("cae", "Codigo da sociedade autoral (ECAD/ABRAMUS)", "123456789"),
        ("ipi", "Identificador IPI — campo separado do CAE", "00123456789"),
        ("codigo_sequence_cwr", "Codigo sequencial dentro de um arquivo CWR especifico", "0001"),
    ],
    col_widths=[4.5*cm, 8*cm, 5*cm]
))
story.append(P("Tabelas: titulares  —  titulares_pf  —  titulares_pj  —  titular_dados_bancarios", body_small))
story.append(P("Regra:", rule_style))
story.append(P("HR01 nao e CAE. HR01 e o codigo interno do sistema legado Top Show. "
    "CAE e o numero da sociedade (ECAD/ABRAMUS). Ambos precisam existir como campos distintos.", body_small))
story.append(P("Duvida: Um titular pode ter multiplos CAEs (ex: registro no ECAD e na ABRAMUS)?", doubt_style))

story.append(SP())

# ── EDITORA ───────────────────────────────────────────────────────────────────
story += sub_header("1.3  Editora")
story.append(P("A distincao mais importante do sistema:"))
story.append(table_data(
    ["Tipo", "Exemplo", "Controlada?", "Regra CWR"],
    [
        ("master", "Top Show Music", "Sim", "AM no CWR = sempre controlada"),
        ("administrada", "Edi Music, LR, P3, Lamu", "Sim", "E no CWR = controlada (dentro do grupo)"),
        ("externa", "Editora nao cadastrada no tenant", "Nao", "E no CWR = apenas referencia"),
    ],
    col_widths=[3*cm, 4*cm, 3*cm, 7*cm]
))
story.append(P("Campos criticos: tipo_editora, controlada (boolean), "
    "codigo_publisher_cwr, backoffice_publisher_id", body_small))
story.append(P("Duvida: Uma editora administrada pode ter percentuais diferentes por obra, "
    "ou o percentual vem sempre do contrato com a Top Show?", doubt_style))

story.append(SP())

# ── CONTRATO ──────────────────────────────────────────────────────────────────
story += sub_header("1.4  Contrato")
story.append(P(
    "O contrato define os <b>percentuais</b> da obra por tipo de direito e por territorio. "
    "Nao existe percentual fixo no sistema — tudo vem do contrato. "
    "O sistema aceita 75/25, 80/20, 90/10, 50/50 ou qualquer combinacao."))
story.append(table_data(
    ["Tipo", "Descricao"],
    [
        ("cessao", "Autor cede direitos para a editora"),
        ("administracao", "Editora administra sem cessao total"),
        ("coedicao", "Duas editoras co-editam"),
        ("subedicao", "Editora sub-licencia para outra"),
        ("licenciamento", "Uso especifico: sync, TV"),
        ("autorizacao", "Uso pontual"),
    ],
    col_widths=[4*cm, 13*cm]
))
story.append(P("Duvida: Um contrato de cessao cobre obras futuras automaticamente "
    "ou precisa ser vinculado obra por obra?", doubt_style))

story.append(SP())

# ── RECEBIMENTO ───────────────────────────────────────────────────────────────
story += sub_header("1.5  Recebimento")
story.append(P("Todo recebimento deve ser rastreavel ate a obra, o territorio, "
    "o tipo de direito e o participante que o gerou."))
story.append(table_data(
    ["Campo", "Descricao"],
    [
        ("obra_id", "Qual obra gerou o recebimento"),
        ("statement_id", "ID do extrato — anti-duplicacao (ex: ST492347)"),
        ("song_code", "Publisher_SongCode do extrato B-55"),
        ("fonte", "backoffice | ecad | socinpro | sync | tv | internacional"),
        ("direito", "execucao_publica | fonomecânico | sincronizacao | digital"),
        ("territorio", "BR | WORLD | US | ES | PT"),
        ("valor_bruto + moeda", "Valor original — USD, BRL, EUR"),
        ("valor_brl", "Convertido para BRL"),
        ("status", "importado | em_conciliacao | conciliado | distribuido"),
    ],
    col_widths=[4.5*cm, 12.5*cm]
))
story.append(P("Duvida: O ECAD e o Socinpro mandam recebimentos com breakdown por obra "
    "ou chegam como valor global por periodo?", doubt_style))

story.append(SP())

# ── DISTRIBUICAO ──────────────────────────────────────────────────────────────
story += sub_header("1.6  Distribuicao")
story.append(P("Distribuicao e o processo de pegar os recebimentos de um periodo e calcular "
    "quanto cada participante de cada obra deve receber."))
story.append(P("Fluxo:", h3))
story.append(code_block(
    "1. PERIODO DE DISTRIBUICAO aberto\n"
    "2. Recebimentos do periodo agrupados\n"
    "3. Para cada recebimento:\n"
    "   a. Identificar: obra + direito + territorio\n"
    "   b. Buscar percentual controlado da obra\n"
    "   c. Normalizar parte controlada para 100%\n"
    "4. Para cada participante controlado:\n"
    "   a. Calcular valor bruto\n"
    "   b. Aplicar taxa administrativa (parametrizavel)\n"
    "   c. Calcular retencoes (IRPF para PF)\n"
    "   d. Lancar em CC_Titulares\n"
    "5. Lancar total em CC_Obras\n"
    "6. Gerar Prestacao de Contas por titular"
))
story.append(P("Duvida critica: A taxa administrativa e calculada sobre o valor bruto total "
    "antes de dividir entre autor e editora, ou sobre a parte da editora depois da divisao?", doubt_style))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 2 — RELACIONAMENTOS
# ═══════════════════════════════════════════════════════════════════════════════
story += section_header("Relacionamentos", "PARTE 2")

# ── OBRA LINK ─────────────────────────────────────────────────────────────────
story += sub_header("2.1  ObraLink")
story.append(P(
    "Cada obra tem um ou mais <b>links editoriais</b>. "
    "Um link representa uma cadeia completa: autor → editora original → administradora → subeditora. "
    "Se uma obra tem dois autores com editoras diferentes, ela tem dois links."))
story.append(P("Exemplo — obra '100% COUNTRY':", body_small))
story.append(code_block(
    "Link 1:  Nauilan (CA)        → Edi Music (E)     → Top Show Music (AM)\n"
    "Link 2:  Giovani Avelar (CA) → Top Show Music (E)"
))
story.append(P("Tabela: obras_links", body_small))
story.append(table_data(
    ["Campo", "Descricao"],
    [
        ("obra_id", "FK para obras"),
        ("numero_link", "1, 2, 3..."),
        ("percentual_total", "Soma de todos os participantes do link"),
        ("percentual_controlado", "Apenas a parte controlada"),
        ("percentual_nao_controlado", "Parte referencia / externa"),
    ],
    col_widths=[5*cm, 12*cm]
))

story += sub_header("2.2  ObraLinkTitular")
story.append(P("Cada linha da grade da obra. Um participante dentro de um link, "
    "com seu papel CWR, percentual e indicacao de controle."))
story.append(P("Tabela: obras_links_titulares", body_small))
story.append(table_data(
    ["Campo", "Descricao"],
    [
        ("obra_link_id", "FK para obras_links"),
        ("titular_id", "FK para titulares"),
        ("papel_cwr", "CA | A | C | E | AM | SE | OWR | OPU"),
        ("percentual_mr", "Mechanical rights %"),
        ("percentual_pr", "Performing rights %"),
        ("controlado", "boolean"),
        ("writer_sequence_code", "Codigo SWR dentro do arquivo CWR"),
        ("publisher_sequence_code", "Codigo SPU dentro do arquivo CWR"),
        ("pwr_writer_code", "Campo do registro PWR"),
        ("pwr_publisher_code", "Campo do registro PWR"),
        ("codigo_interno_legado", "HR01 preservado do sistema antigo"),
    ],
    col_widths=[5.5*cm, 11.5*cm]
))

story += sub_header("2.3  Publisher Original (Original Publisher)")
story.append(P(
    "E a <b>editora direta do autor</b> dentro de um link — a que tem contrato de cessao ou administracao. "
    "Identificada pelo papel <b>E</b> no registro SPU vinculado ao autor via PWR."))
story.append(code_block(
    "Autor:              Nauilan\n"
    "Original Publisher: Edi Music (E)\n"
    "Administradora:     Top Show Music (AM)"
))
story.append(P(
    "O vinculo autor-editora original vem do PWR, que liga o writer_sequence_code (SWR) "
    "ao publisher_sequence_code (SPU). Essa ligacao e preservada em obras_links_titulares."))

story += sub_header("2.4  Publisher Local (Local Publisher)")
story.append(P(
    "E a editora responsavel por <b>arrecadar e representar</b> a obra em um determinado territorio. "
    "Pode ser diferente por pais."))
story.append(code_block(
    "Brasil:   Top Show Music (administradora)\n"
    "EUA:      Subpublisher USA\n"
    "Espanha:  Subpublisher Espanha"
))
story.append(P(
    "Esta estrutura ainda nao esta modelada no banco. "
    "Precisara de tabela obra_territorios_publishers ou campo em obras_links por territorio."))
story.append(P("Duvida: O Publisher Local e configurado no contrato de subedicao ou vem do SPT?", doubt_style))

story += sub_header("2.5  Territorios")
story.append(P(
    "Territorio nao e so 'Brasil' e 'Exterior'. O sistema suporta qualquer territorio. "
    "Cada territorio pode ter percentuais, publisher local, contrato e Collect diferentes."))
story.append(table_data(
    ["Codigo", "Territorio"],
    [
        ("BR", "Brasil"),
        ("WORLD", "Mundo"),
        ("001", "America Latina"),
        ("US", "Estados Unidos"),
        ("ES", "Espanha"),
        ("PT", "Portugal"),
        ("JP", "Japao"),
    ],
    col_widths=[3*cm, 14*cm]
))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 3 — CWR
# ═══════════════════════════════════════════════════════════════════════════════
story += section_header("CWR — Importacao e Exportacao", "PARTE 3")

story += sub_header("3.1  Importacao")
story.append(P("Registros lidos:"))
story.append(table_data(
    ["Registro", "Descricao"],
    [
        ("HDR", "Cabecalho do arquivo — sender, data"),
        ("GRH", "Inicio do grupo"),
        ("NWR", "Obra — titulo, codigo, ISWC, idioma, duracao"),
        ("SPU", "Publisher — nome, CAE, IPI, papel (E/AM/SE), sequence_code"),
        ("SPT", "Territorio da editora — collect_pr%, collect_mr%"),
        ("SWR", "Author/Writer — nome, CAE, IPI, sequence_code"),
        ("SWT", "Territorio do autor"),
        ("PWR", "Ligacao SWR-SPU pelos sequence_codes"),
        ("OWR", "Autor nao controlado — apenas referencia"),
        ("ALT", "Titulo alternativo"),
        ("PER", "Interprete"),
        ("REC", "Gravacao / fonograma"),
        ("GRT", "Fim do grupo"),
        ("TRL", "Trailer"),
    ],
    col_widths=[2.5*cm, 14.5*cm]
))
story.append(P("Registros ignorados: AGR, TER, IPA, NPA, EWT, INS, IND, ORN, COM", body_small))

story += subsub_header("Algoritmo PWR (ponto critico)")
story.append(code_block(
    "1. Para cada NWR, criar buffer de SPUs e SWRs\n"
    "2. Cada SPU tem publisher_sequence_code (campo pos 27-28)\n"
    "3. Cada SWR tem writer_sequence_code (campo pos 27-28)\n"
    "4. Cada PWR contem: publisher_seq + writer_seq\n"
    "5. Ao encontrar PWR: ligar SWR[writer_seq] ao SPU[publisher_seq]\n"
    "6. Fallback: se nao achar por seq, tentar por IPI\n"
    "7. Resultado: cada autor fica vinculado a sua editora original"
))

story += subsub_header("Regra de controle na importacao")
story.append(table_data(
    ["Condicao", "Resultado"],
    [
        ("SPU papel AM + IPI da Top Show", "CONTROLADO"),
        ("SPU papel E + editora cadastrada como administrada", "CONTROLADO"),
        ("SPU papel E + editora nao cadastrada", "NAO CONTROLADO"),
        ("SWR vinculado via PWR a SPU controlada", "CONTROLADO"),
        ("OWR — sempre", "NAO CONTROLADO (apenas referencia)"),
    ],
    col_widths=[9*cm, 8*cm]
))

story += sub_header("3.2  Exportacao")
story.append(P("Gera arquivo CWR 2.1-5. Exporta somente obras com controle editorial no Brasil."))
story += subsub_header("Validacoes antes de exportar")
story.append(table_data(
    ["#", "Validacao"],
    [
        ("1", "Obra tem titulo"),
        ("2", "Obra tem codigo interno"),
        ("3", "Obra tem ao menos um titular controlado"),
        ("4", "Obra tem ao menos uma editora controlada"),
        ("5", "Cada SPU controlado tem SPT Brasil"),
        ("6", "Cada SWR controlado tem SWT Brasil"),
        ("7", "Cada SWR controlado tem PWR para uma SPU controlada"),
        ("8", "Percentuais consistentes — soma = 100%"),
        ("9", "Nao exportar obra sem controle no Brasil"),
    ],
    col_widths=[1.5*cm, 15.5*cm]
))
story.append(P("Preservacao de legado na exportacao:", rule_style))
story.append(P(
    "Se a obra veio de importacao CWR, manter os sequence_codes originais. "
    "Se foi criada no Sync Mood, gerar novos codigos. "
    "Nunca substituir codigo antigo sem registrar no log.", body_small))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 4 — BACKOFFICE
# ═══════════════════════════════════════════════════════════════════════════════
story += section_header("BackOffice", "PARTE 4")

story += sub_header("4.1  Song ID vs Work ID")
story.append(table_data(
    ["Status", "Descricao"],
    [
        ("nao_enviada", "Obra existe no Sync Mood mas nunca foi enviada"),
        ("enviada", "Arquivo CWR foi gerado e enviado"),
        ("song", "BackOffice criou registro passivo — retorna backoffice_song_id"),
        ("work", "BackOffice validou, obra ativa — retorna backoffice_work_id"),
        ("divergente", "BackOffice encontrou conflito (percentuais, ISWC duplicado, etc.)"),
        ("rejeitada", "BackOffice rejeitou por dados invalidos"),
    ],
    col_widths=[3*cm, 14*cm]
))
story.append(P(
    "A distincao Song/Work e importante porque: "
    "um Song ja tem ID mas pode nao estar vinculado a recebimentos. "
    "Um Work esta ativo e ja pode gerar distribuicao. "
    "O backoffice_song_id e o que aparece no extrato B-55 antes da validacao."))

story += sub_header("4.2  Collect")
story.append(P(
    "O Collect define qual percentual uma editora tem autorizacao para arrecadar "
    "em um determinado territorio para um determinado tipo de direito. "
    "Esses percentuais vem dos registros SPT na importacao CWR."))
story.append(code_block(
    "Top Show Music — Brasil:\n"
    "  Collect Performing:  100%  (arrecada 100% da execucao publica no Brasil)\n"
    "  Collect Mechanical:  100%  (arrecada 100% do fonomecânico no Brasil)\n\n"
    "Top Show Music — Portugal:\n"
    "  Collect Performing:   50%  (acordo com subpublisher portugues)\n"
    "  Collect Mechanical:    0%  (subeditora portuguesa recolhe tudo)"
))
story.append(P("Duvida: O Collect e por editora+territorio (fixo) ou por obra+editora+territorio (varia por obra)?", doubt_style))

story += sub_header("4.3  Matching")
story.append(P("Processo de cruzar recebimentos do extrato B-55 com as obras do catalogo."))
story.append(table_data(
    ["Prioridade", "Chave", "Descricao"],
    [
        ("1", "backoffice_song_id / backoffice_work_id", "Match exato"),
        ("2", "publisher_song_code", "Cruzar com codigo_publisher_song da obra"),
        ("3", "ISWC", "Se existir"),
        ("4", "titulo (busca fonetica)", "Fallback manual"),
    ],
    col_widths=[2.5*cm, 6.5*cm, 8*cm]
))
story.append(table_data(
    ["Status", "Descricao"],
    [
        ("conciliado", "Obra encontrada com seguranca"),
        ("divergente", "Obra encontrada mas com conflito de dados"),
        ("pendente", "Nao foi possivel identificar automaticamente"),
    ],
    col_widths=[3*cm, 14*cm]
))
story.append(P("Duvida: O matching e totalmente automatico ou sempre tem etapa de revisao humana "
    "antes de liberar para distribuicao?", doubt_style))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# PARTE 5 — DISTRIBUICAO
# ═══════════════════════════════════════════════════════════════════════════════
story += section_header("Distribuicao", "PARTE 5")

story += sub_header("5.1  Direitos")
story.append(P(
    "Os tipos de direito sao <b>parametrizaveis</b> — nao existe lista fixa. "
    "O sistema tem uma tabela de tipos de direito configuravel por tenant. "
    "Novos direitos podem ser criados sem alterar o codigo."))
story.append(table_data(
    ["Tipo", "Descricao"],
    [
        ("execucao_publica", "Performing rights — ECAD/Socinpro"),
        ("fonomecânico", "Mechanical rights — BackOffice, streaming"),
        ("sincronizacao", "Sync — uso em audiovisual"),
        ("audiovisual", "Producao audiovisual"),
        ("publicidade", "Uso publicitario"),
        ("distribuicao_digital", "Digital distribution"),
        ("reproducao_grafica", "Edicao grafica, partitura"),
        ("karaoke", "Karaoke"),
        ("banco_de_dados", "Licenciamento de dados"),
        ("autorizacoes_especiais", "Outros usos especificos"),
    ],
    col_widths=[5*cm, 12*cm]
))

story += sub_header("5.2  Territorios na Distribuicao")
story.append(P(
    "O motor de distribuicao consulta o territorio do recebimento "
    "para aplicar os percentuais corretos do contrato."))
story.append(code_block(
    "Recebimento B-55 (Spotify Brasil) → territorio: BR → fonomecânico\n"
    "  → Buscar obra + links + percentuais para direito:fono + territorio:BR\n"
    "  → Aplicar percentuais contratuais para BR\n\n"
    "Recebimento internacional (Spotify EUA) → territorio: US → fonomecânico\n"
    "  → Percentuais podem ser diferentes do Brasil\n"
    "  → Verificar se existe subpublisher para US"
))

story += sub_header("5.3  Participantes e Calculo")
story.append(P("Exemplo de normalizacao da parte controlada:"))
story.append(table_data(
    ["Participante", "Papel", "% Total", "% Controlado", "Normalizado"],
    [
        ("Nauilan", "CA", "37,5%", "37,5% (controlado)", "37,5 / 50 = 75%"),
        ("Edi Music", "E", "10,0%", "10,0% (controlado)", "10,0 / 50 = 20%"),
        ("Top Show Music", "AM", "2,5%", "2,5% (controlado)", "2,5 / 50 = 5%"),
        ("Autor externo", "OWR", "50,0%", "nao controlado", "—"),
        ("TOTAL CONTROLADO", "", "50,0%", "50,0%", "100%"),
    ],
    col_widths=[4.5*cm, 2*cm, 2.5*cm, 4*cm, 4*cm]
))
story.append(P("Regra:", rule_style))
story.append(P(
    "Na distribuicao interna, normalizar os 50% controlados para 100%. "
    "O autor externo (OWR) nao recebe nenhum valor — e apenas referencia no sistema.", body_small))

story.append(SP())
story.append(P("Retencoes (parametrizaveis):", h3))
story.append(table_data(
    ["Tipo", "Regra"],
    [
        ("IRPF PF", "Tabela progressiva — conforme faixa de rendimento mensal"),
        ("ISS PJ", "Conforme municipio do titular"),
        ("Taxa administrativa", "Configuravel por contrato: 5%, 10%, 15%, 20% ou outro"),
    ],
    col_widths=[4*cm, 13*cm]
))

story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════════════════
# DUVIDAS ABERTAS
# ═══════════════════════════════════════════════════════════════════════════════
story += section_header("Duvidas Abertas — Validacao Critica", "APENDICE")
story.append(P(
    "As duvidas abaixo precisam ser respondidas antes de continuar a implementacao. "
    "Cada uma delas pode impactar diretamente a modelagem do banco ou o motor de calculo."))
story.append(SP(0.3))

duvidas = [
    ("ALTO", "Distribuicao",
     "A taxa administrativa e calculada sobre o valor bruto total antes de dividir entre autor e editora, "
     "ou sobre a parte da editora depois da divisao?"),
    ("ALTO", "BackOffice",
     "O Collect e por editora+territorio (configurado uma vez por editora) "
     "ou por obra+editora+territorio (varia por obra)?"),
    ("ALTO", "Recebimentos",
     "O processo de matching B-55 e totalmente automatico ou sempre tem etapa de revisao humana "
     "antes de liberar para distribuicao?"),
    ("MEDIO", "Recebimentos",
     "O ECAD e o Socinpro mandam os recebimentos com breakdown por obra ou chegam como valor global por periodo?"),
    ("MEDIO", "Territorios",
     "O Publisher Local e configurado no contrato de subedicao ou vem do registro SPT do CWR?"),
    ("MEDIO", "Titulares",
     "Um titular (autor) pode ter multiplos CAEs? Por exemplo, registro no ECAD e na ABRAMUS?"),
    ("MEDIO", "Contratos",
     "Um contrato de cessao cobre obras futuras automaticamente ou precisa ser vinculado obra por obra?"),
    ("MEDIO", "Obras",
     "Como tratar obras com partes sob contratos diferentes de anos diferentes?"),
    ("MEDIO", "Distribuicao",
     "O IRPF e retido pelo sistema na hora da distribuicao ou e responsabilidade do titular via DARF?"),
    ("BAIXO", "Portal do Autor",
     "O portal exibe apenas as obras proprias do autor ou todas as obras da editora onde ele participa?"),
]

dvd_rows = []
for i, (imp, mod, dv) in enumerate(duvidas, 1):
    imp_color = ROSE_LT if imp == "ALTO" else (AMBER_LT if imp == "MEDIO" else VIOLET_LT)
    imp_text_color = ROSE if imp == "ALTO" else (AMBER if imp == "MEDIO" else VIOLET)
    dvd_rows.append([
        P(str(i), make_style(f"DN{i}", fontSize=10, fontName="Helvetica-Bold",
            textColor=TEXT_MAIN)),
        P(imp, make_style(f"DI{i}", fontSize=9, fontName="Helvetica-Bold",
            textColor=imp_text_color, backColor=imp_color, borderPad=3)),
        P(mod, make_style(f"DM{i}", fontSize=9, fontName="Helvetica", textColor=GRAY_TXT)),
        P(dv, make_style(f"DT{i}", fontSize=9, fontName="Helvetica", textColor=TEXT_MAIN)),
    ])

tbl_dvd = Table(dvd_rows, colWidths=[0.7*cm, 1.8*cm, 3*cm, 11.5*cm], repeatRows=0)
tbl_dvd.setStyle(TableStyle([
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.white, GRAY_LT]),
    ("GRID", (0,0), (-1,-1), 0.3, GRAY_BD),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
]))
story.append(tbl_dvd)

story.append(SP(1))
story.append(HR(VIOLET, 1))
story.append(SP(0.3))
story.append(P(
    "Responda as duvidas acima para que o Sync Mood seja construido corretamente "
    "desde a modelagem do banco ate o motor de distribuicao. "
    "Cada resposta elimina um risco de retrabalho futuro.",
    make_style("Final", fontSize=10, leading=15, textColor=GRAY_TXT,
               fontName="Helvetica-Oblique")))

# ── Build PDF ─────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    topMargin=2*cm, bottomMargin=2*cm,
    leftMargin=1.8*cm, rightMargin=1.8*cm,
    title="Arquitetura Funcional — Sync Mood",
    author="Sync Mood Gestao Inteligente",
)

doc.build(
    story,
    onFirstPage=cover_page,
    onLaterPages=later_pages,
)
print(f"PDF gerado: {OUTPUT}")
