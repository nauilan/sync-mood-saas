from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
import unicodedata

OUTPUT = r"C:\Users\Usuário\Desktop\sync-mood-saas\Arquitetura_Funcional_SyncMood_v2.pdf"

# ── Cores ─────────────────────────────────────────────────────────────────────
DARK_BG    = colors.HexColor("#0d1526")
VIOLET     = colors.HexColor("#7c3aed")
VIOLET_LT  = colors.HexColor("#ede9fe")
EMERALD    = colors.HexColor("#059669")
EMERALD_LT = colors.HexColor("#d1fae5")
SKY        = colors.HexColor("#0284c7")
SKY_LT     = colors.HexColor("#e0f2fe")
AMBER      = colors.HexColor("#d97706")
AMBER_LT   = colors.HexColor("#fef3c7")
ROSE       = colors.HexColor("#e11d48")
ROSE_LT    = colors.HexColor("#ffe4e6")
GRAY_LT    = colors.HexColor("#f8fafc")
GRAY_BD    = colors.HexColor("#e2e8f0")
GRAY_TXT   = colors.HexColor("#64748b")
TEXT_MAIN  = colors.HexColor("#1e293b")
CODE_BG    = colors.HexColor("#1e293b")
CODE_TXT   = colors.HexColor("#e2e8f0")
GREEN_DK   = colors.HexColor("#065f46")

def s(t): return unicodedata.normalize("NFC", str(t))

styles = getSampleStyleSheet()
def mk(name, parent="Normal", **kw):
    return ParagraphStyle(name, parent=styles[parent], **kw)

# ── Estilos base ──────────────────────────────────────────────────────────────
cover_title = mk("CoverTitle", fontSize=32, leading=40, textColor=colors.white, fontName="Helvetica-Bold", spaceAfter=8)
cover_sub   = mk("CoverSub",   fontSize=13, leading=18, textColor=colors.HexColor("#a5b4fc"), fontName="Helvetica", spaceAfter=4)
cover_meta  = mk("CoverMeta",  fontSize=10, leading=14, textColor=colors.HexColor("#94a3b8"), fontName="Helvetica")
h1  = mk("H1",  fontSize=20, leading=26, textColor=DARK_BG,  fontName="Helvetica-Bold", spaceBefore=20, spaceAfter=8)
h2  = mk("H2",  fontSize=14, leading=20, textColor=VIOLET,   fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6)
h3  = mk("H3",  fontSize=11, leading=16, textColor=SKY,      fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4)
body       = mk("Body",      fontSize=10, leading=15, textColor=TEXT_MAIN, fontName="Helvetica", spaceAfter=6)
body_small = mk("BodySmall", fontSize=9,  leading=13, textColor=GRAY_TXT,  fontName="Helvetica", spaceAfter=4)
bullet_s   = mk("Bullet",    fontSize=10, leading=15, textColor=TEXT_MAIN, fontName="Helvetica", leftIndent=16, spaceAfter=3)
code_s     = mk("Code",      fontSize=8.5,leading=13, textColor=CODE_TXT,  fontName="Courier",   leftIndent=12, rightIndent=12, backColor=CODE_BG, borderPad=8, spaceAfter=6)
note_s     = mk("Note",      fontSize=9.5,leading=14, textColor=colors.HexColor("#92400e"), fontName="Helvetica-Oblique", leftIndent=12, backColor=AMBER_LT, borderPad=6, spaceAfter=6)
rule_s     = mk("Rule",      fontSize=9.5,leading=14, textColor=GREEN_DK,  fontName="Helvetica-Bold",    leftIndent=12, backColor=EMERALD_LT, borderPad=6, spaceAfter=6)
doubt_s    = mk("Doubt",     fontSize=9.5,leading=14, textColor=VIOLET,    fontName="Helvetica-Oblique", leftIndent=12, backColor=VIOLET_LT,  borderPad=6, spaceAfter=4)
answer_s   = mk("Answer",    fontSize=9.5,leading=14, textColor=GREEN_DK,  fontName="Helvetica-Bold",    leftIndent=12, backColor=EMERALD_LT, borderPad=6, spaceAfter=4)
info_s     = mk("Info",      fontSize=9.5,leading=14, textColor=colors.HexColor("#1e40af"), fontName="Helvetica-Oblique", leftIndent=12, backColor=SKY_LT, borderPad=6, spaceAfter=4)

def P(t, st=None): return Paragraph(s(t), st or body)
def SP(n=0.3):     return Spacer(1, n*cm)
def HR(c=GRAY_BD, th=0.5): return HRFlowable(width="100%", thickness=th, color=c, spaceAfter=6)

def sec(title, part=None):
    e = [SP(0.5)]
    if part: e.append(P(s(part), mk("Pt", fontSize=9, textColor=VIOLET, fontName="Helvetica-Bold", spaceAfter=2)))
    e += [P(s(title), h1), HR(VIOLET, 1.5)]
    return e

def sub(t):    return [SP(0.2), P(s(t), h2)]
def subsub(t): return [SP(0.1), P(s(t), h3)]

def tbl(headers, rows, widths=None, hc=VIOLET):
    def th(t): return Paragraph(s(t), mk("TH"+t[:4], fontSize=9, fontName="Helvetica-Bold", textColor=colors.white))
    def td(t): return Paragraph(s(t), mk("TD"+t[:4], fontSize=9, fontName="Helvetica",      textColor=TEXT_MAIN))
    data = [[th(h) for h in headers]] + [[td(c) for c in r] for r in rows]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), hc),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GRAY_LT]),
        ("GRID", (0,0), (-1,-1), 0.4, GRAY_BD),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
    ]))
    return t

def code(t): return Paragraph(s(t).replace("\n","<br/>").replace(" ","&nbsp;"), code_s)

# ── Page templates ─────────────────────────────────────────────────────────────
def cover_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(DARK_BG); canvas.rect(0,0,w,h,fill=1,stroke=0)
    canvas.setFillColor(VIOLET);  canvas.rect(0,h-8,w,8,fill=1,stroke=0)
    canvas.setFillColor(VIOLET);  canvas.rect(0,0,w,4,fill=1,stroke=0)
    canvas.setFillColor(colors.HexColor("#1e1b4b")); canvas.circle(w-80,h-120,160,fill=1,stroke=0)
    canvas.setFillColor(colors.HexColor("#312e81")); canvas.circle(w-60,h-100,80,fill=1,stroke=0)
    canvas.restoreState()

def later_pages(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(DARK_BG); canvas.rect(0,h-28,w,28,fill=1,stroke=0)
    canvas.setFont("Helvetica-Bold",9); canvas.setFillColor(colors.white)
    canvas.drawString(1.5*cm, h-18, s("Arquitetura Funcional — Sync Mood SaaS  v2.0"))
    canvas.setFont("Helvetica",9); canvas.setFillColor(colors.HexColor("#94a3b8"))
    canvas.drawRightString(w-1.5*cm, h-18, s(f"Pagina {doc.page}"))
    canvas.setStrokeColor(GRAY_BD); canvas.setLineWidth(0.3)
    canvas.line(1.5*cm,1.5*cm,w-1.5*cm,1.5*cm)
    canvas.setFont("Helvetica",7.5); canvas.setFillColor(GRAY_TXT)
    canvas.drawString(1.5*cm,1*cm, s("Sync Mood Gestao Inteligente  •  Documento Confidencial"))
    canvas.drawRightString(w-1.5*cm,1*cm, s("v2.0 — 2026"))
    canvas.restoreState()

# ══════════════════════════════════════════════════════════════════════════════
story = []

# ── CAPA ──────────────────────────────────────────────────────────────────────
story += [SP(5.5), P("Arquitetura Funcional", cover_title),
          P("Sync Mood Gestao Inteligente", cover_sub),
          P("v2.0 — Incluindo respostas validadas  •  2026", cover_meta),
          SP(1), HR(VIOLET,1), SP(0.5),
          P("Este documento consolida o modelo de negocio completo do Sync Mood com as "
            "respostas oficiais do usuario para as 10 duvidas criticas de arquitetura. "
            "Serve como referencia definitiva para implementacao.",
            mk("CD", fontSize=11, leading=17, textColor=colors.HexColor("#cbd5e1"), fontName="Helvetica")),
          PageBreak()]

# ── INDICE ────────────────────────────────────────────────────────────────────
story += sec("Indice")
story.append(tbl(
    ["Secao", "Conteudo"],
    [
        ("Parte 1 — Entidades Principais",    "Obra, Titular, Editora, Contrato, Recebimento, Distribuicao"),
        ("Parte 2 — Relacionamentos",          "ObraLink, ObraLinkTitular, Publisher Original/Local, Territorios"),
        ("Parte 3 — CWR",                      "Importacao e Exportacao"),
        ("Parte 4 — BackOffice",               "Song ID, Work ID, Collect, Matching"),
        ("Parte 5 — Distribuicao",             "Direitos, Territorios, Participantes, Motor de Calculo"),
        ("Apendice A — Respostas Validadas",   "10 duvidas respondidas — decisoes de arquitetura"),
        ("Apendice B — Matriz da Obra",        "Grade central: participacoes, direitos, territorios"),
    ],
    widths=[6*cm, 11*cm], hc=DARK_BG
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# PARTE 1 — ENTIDADES
# ══════════════════════════════════════════════════════════════════════════════
story += sec("Entidades Principais", "PARTE 1")

# OBRA
story += sub("1.1  Obra")
story.append(P("A obra e a <b>MATRIZ CENTRAL</b> do Sync Mood. Toda a logica do sistema — "
    "CWR, BackOffice, recebimentos, distribuicao, conta corrente, prestacao de contas, BI e portal — "
    "nasce desta matriz. Ela nao e uma ficha simples com autor + percentual: "
    "e uma grade de participacoes, direitos, territorios e controle editorial."))
story += subsub("Tabelas utilizadas")
story.append(P("obras  —  obras_links  —  obras_links_titulares  —  fonogramas", body_small))
story += subsub("Campos criticos")
story.append(tbl(
    ["Campo", "Descricao", "Exemplo"],
    [
        ("codigo",                  "ID interno Sync Mood",                       "SM000001"),
        ("codigo_interno_legado",   "Codigo sistema antigo — NUNCA apagar",        "AFW2"),
        ("codigo_obra_cwr_original","Como veio no arquivo CWR",                    "AFW2"),
        ("iswc",                    "Padrao internacional CISAC",                  "T-123.456.789-0"),
        ("backoffice_song_id",      "ID BackOffice — registro passivo (SONG)",     "SONG-99812"),
        ("backoffice_work_id",      "ID BackOffice — obra validada (WORK)",        "WORK-12345"),
        ("backoffice_status",       "Status na BackOffice",                        "nao_enviada | song | work | divergente"),
    ],
    widths=[4.5*cm,8*cm,5*cm]
))
story.append(P("AFW2 nao e ISWC. Sao campos separados. Os dois devem coexistir permanentemente.", rule_s))

story += sub("1.2  Titular")
story.append(P("Qualquer pessoa (PF ou PJ) com direito sobre uma obra. "
    "Identificadores distintos que nao podem ser confundidos:"))
story.append(tbl(
    ["Campo","Descricao","Exemplo"],
    [
        ("codigo_interno_legado",   "Codigo sistema antigo",                       "HR01"),
        ("cae",                     "Codigo sociedade autoral (principal ativo)",   "123456789"),
        ("cae_historico",           "CAEs anteriores — armazenados, nao removidos", "JSON array"),
        ("ipi",                     "Identificador IPI — campo separado do CAE",    "00123456789"),
        ("codigo_sequence_cwr",     "Sequencial dentro de um arquivo CWR",          "0001"),
    ],
    widths=[4.5*cm,8*cm,5*cm]
))
story.append(P("Um titular pode ter multiplos CAEs historicos. O sistema mantem um CAE principal ativo "
    "e armazena os demais como registros adicionais sem substituir.", info_s))

story += sub("1.3  Editora")
story.append(tbl(
    ["Tipo","Exemplo","Controlada?","Regra CWR"],
    [
        ("master",      "Top Show Music",           "Sim",  "AM = sempre controlada"),
        ("administrada","Edi Music, LR, P3, Lamu",  "Sim",  "E = controlada (dentro do grupo)"),
        ("externa",     "Editora nao cadastrada",   "Nao",  "E = apenas referencia"),
    ],
    widths=[3*cm,4.5*cm,2.5*cm,7*cm]
))
story.append(P("Campos criticos: tipo_editora  •  controlada (boolean)  •  "
    "codigo_publisher_cwr  •  backoffice_publisher_id", body_small))

story += sub("1.4  Contrato")
story.append(P("Define percentuais, territorios e vigencia. "
    "O sistema suporta dois cenarios configurados no momento do cadastro:"))
story.append(tbl(
    ["Cenario","Descricao"],
    [
        ("Vinculado a obras especificas", "Contrato cobre apenas as obras listadas"),
        ("Cobertura de obras futuras",    "Contrato e aplicado automaticamente a obras futuras do titular"),
    ],
    widths=[6*cm,11*cm]
))
story.append(P("Uma mesma obra pode ter participacoes vinculadas a contratos distintos. "
    "Exemplo: Autor A sob Contrato 2024, Autor B sob Contrato 2026 — "
    "cada participacao da obra e vinculada ao contrato correspondente.", info_s))
story.append(P("Todos os percentuais sao parametrizaveis. "
    "O sistema nao assume 75/25, 50/50 ou qualquer valor fixo.", rule_s))

story += sub("1.5  Recebimento")
story.append(P("Todo recebimento e rastreavel ate: obra + territorio + direito + participante + valor."))
story.append(P("<b>IMPORTANTE — Execucao Publica (ECAD/Socinpro):</b> "
    "Os valores de execucao publica NAO entram no motor de distribuicao do Sync Mood. "
    "O ECAD ja distribui individualmente para cada titular via sociedades. "
    "O Sync Mood usa esses dados apenas para consulta, BI, auditoria e historico.", note_s))
story.append(tbl(
    ["Fonte","Motor de distribuicao?","Uso no sistema"],
    [
        ("BackOffice / B-55 (digital)","Sim — entra na distribuicao","Matching + distribuicao + CC"),
        ("ECAD / Socinpro",            "NAO — apenas demonstrativo", "Consulta, BI, auditoria, historico"),
        ("TV / Sync",                  "Sim — entra na distribuicao","Matching + distribuicao + CC"),
        ("Internacional",              "Sim — entra na distribuicao","Matching + distribuicao + CC"),
    ],
    widths=[4.5*cm,4*cm,8.5*cm]
))

story += sub("1.6  Distribuicao")
story.append(P("Motor de calculo totalmente dinamico — sem percentuais fixos no codigo. "
    "Todos os valores vem dos contratos, configuracoes e regras de negocio cadastradas."))
story.append(code(
    "Recebimento (fonte + direito + territorio)\n"
    "  → Identificar obra\n"
    "  → Buscar matriz contratual (obra + direito + territorio)\n"
    "  → Calcular parte controlada\n"
    "  → Normalizar parte controlada para 100%\n"
    "  → Para cada participante controlado:\n"
    "       valor_bruto  = recebimento * percentual_normalizado\n"
    "       taxa_admin   = conforme regra contratual (parametrizavel)\n"
    "       retencao_irpf = conforme regra fiscal (parametrizavel)\n"
    "       valor_liquido = valor_bruto - taxa_admin - retencao_irpf\n"
    "  → Lancar em CC_Titulares\n"
    "  → Lancar total em CC_Obras"
))
story.append(P("Taxa administrativa: totalmente parametrizavel. Pode ser aplicada sobre valor bruto, "
    "sobre parcela editorial, sobre determinados direitos, ou nao existir. "
    "Definida contratualmente — o motor e flexivel para qualquer cenario.", rule_s))
story.append(P("IRPF: o sistema calcula, provisiona e demonstra retencoes. "
    "A regra de recolhimento e parametrizavel por editora: informar apenas, "
    "reter automaticamente, gerar demonstrativos ou relatorios para contabilidade.", info_s))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# PARTE 2 — RELACIONAMENTOS
# ══════════════════════════════════════════════════════════════════════════════
story += sec("Relacionamentos", "PARTE 2")

story += sub("2.1  ObraLink")
story.append(P("Cada obra tem um ou mais links editoriais. "
    "Um link = uma cadeia completa: autor → editora original → administradora → subeditora."))
story.append(code(
    "Obra: '100% COUNTRY'\n\n"
    "  Link 1:  Nauilan (CA)        → Edi Music (E)     → Top Show Music (AM)\n"
    "  Link 2:  Giovani Avelar (CA) → Top Show Music (E)"
))
story.append(tbl(
    ["Campo","Descricao"],
    [
        ("obra_id",                    "FK para obras"),
        ("numero_link",                "1, 2, 3..."),
        ("percentual_total",           "Soma de todos os participantes"),
        ("percentual_controlado",      "Parte controlada"),
        ("percentual_nao_controlado",  "Parte referencia / externa"),
    ],
    widths=[5*cm,12*cm]
))

story += sub("2.2  ObraLinkTitular")
story.append(P("Cada participante dentro de um link, com papel CWR, percentual, "
    "controle e codigos de rastreabilidade CWR."))
story.append(tbl(
    ["Campo","Descricao"],
    [
        ("obra_link_id",            "FK obras_links"),
        ("titular_id",              "FK titulares"),
        ("papel_cwr",               "CA | A | C | E | AM | SE | OWR | OPU"),
        ("percentual_mr",           "Mechanical rights %"),
        ("percentual_pr",           "Performing rights %"),
        ("controlado",              "boolean"),
        ("writer_sequence_code",    "Sequencial SWR no CWR"),
        ("publisher_sequence_code", "Sequencial SPU no CWR"),
        ("pwr_writer_code",         "Campo do registro PWR"),
        ("pwr_publisher_code",      "Campo do registro PWR"),
        ("contrato_id",             "FK contrato que rege esta participacao"),
        ("codigo_interno_legado",   "HR01 preservado"),
    ],
    widths=[5.5*cm,11.5*cm]
))

story += sub("2.3  Publisher Original")
story.append(P("Editora direta do autor no link — papel <b>E</b> no SPU vinculado via PWR."))
story.append(code(
    "Autor:              Nauilan\n"
    "Publisher Original: Edi Music (E)\n"
    "Administradora:     Top Show Music (AM)"
))

story += sub("2.4  Publisher Local por Territorio")
story.append(P("Definido por contrato, subedicao ou administracao territorial. "
    "O SPT pode ser referencia na importacao CWR, mas a definicao oficial e contratual."))
story.append(code(
    "Obra X — Publisher Local por territorio:\n\n"
    "  Brasil:   Top Show Music\n"
    "  EUA:      Subpublisher USA\n"
    "  Espanha:  Subpublisher Espanha"
))
story.append(P("Collect (PR e MR) e modelado por: obra → territorio → publisher local → "
    "collect_pr% + collect_mr% + periodo de vigencia. "
    "Uma mesma editora pode ter condicoes diferentes dependendo da obra, "
    "contrato ou subedicao.", info_s))

story += sub("2.5  Territorios")
story.append(P("Totalmente parametrizaveis. Cada territorio pode ter: percentuais proprios, "
    "publisher local proprio, contrato proprio, collect proprio."))
story.append(tbl(
    ["Codigo","Territorio"],
    [("BR","Brasil"),("WORLD","Mundo"),("001","America Latina"),
     ("US","Estados Unidos"),("ES","Espanha"),("PT","Portugal"),("JP","Japao")],
    widths=[3*cm,14*cm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# PARTE 3 — CWR
# ══════════════════════════════════════════════════════════════════════════════
story += sec("CWR — Importacao e Exportacao", "PARTE 3")

story += sub("3.1  Importacao")
story.append(tbl(
    ["Registro","Descricao"],
    [
        ("HDR", "Cabecalho — sender, data"),
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
    widths=[2.5*cm,14.5*cm]
))
story.append(P("Registros ignorados: AGR  TER  IPA  NPA  EWT  INS  IND  ORN  COM", body_small))

story += subsub("Algoritmo PWR")
story.append(code(
    "1. Para cada NWR: buffer de SPUs e SWRs\n"
    "2. SPU: publisher_sequence_code (pos 27-28)\n"
    "3. SWR: writer_sequence_code (pos 27-28)\n"
    "4. PWR: publisher_seq + writer_seq\n"
    "5. Ligar SWR[writer_seq] ao SPU[publisher_seq]\n"
    "6. Fallback: se nao achar por seq → tentar por IPI\n"
    "7. Resultado: cada autor vinculado a sua editora original"
))
story.append(tbl(
    ["Condicao","Resultado"],
    [
        ("SPU papel AM + Top Show Music",              "CONTROLADO"),
        ("SPU papel E + editora administrada cadastrada","CONTROLADO"),
        ("SPU papel E + editora nao cadastrada",        "NAO CONTROLADO"),
        ("SWR vinculado via PWR a SPU controlada",      "CONTROLADO"),
        ("OWR — sempre",                                "NAO CONTROLADO — apenas referencia"),
    ],
    widths=[9*cm,8*cm]
))

story += sub("3.2  Exportacao")
story.append(P("Gera CWR 2.1-5. Exporta somente obras com controle editorial no Brasil. "
    "Preserva codigos legados quando existirem; gera novos quando obra for criada no Sync Mood."))
story.append(tbl(
    ["#","Validacao pre-exportacao"],
    [
        ("1","Obra tem titulo"),
        ("2","Obra tem codigo interno"),
        ("3","Obra tem ao menos um titular controlado"),
        ("4","Obra tem ao menos uma editora controlada"),
        ("5","Cada SPU controlado tem SPT Brasil"),
        ("6","Cada SWR controlado tem SWT Brasil"),
        ("7","Cada SWR controlado tem PWR para uma SPU controlada"),
        ("8","Percentuais consistentes — soma = 100%"),
        ("9","Nao exportar obra sem controle no Brasil"),
    ],
    widths=[1.5*cm,15.5*cm]
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# PARTE 4 — BACKOFFICE
# ══════════════════════════════════════════════════════════════════════════════
story += sec("BackOffice", "PARTE 4")

story += sub("4.1  Ciclo Song → Work")
story.append(tbl(
    ["Status","Descricao"],
    [
        ("nao_enviada", "Obra existe no Sync Mood — nunca enviada"),
        ("enviada",     "Arquivo CWR gerado e enviado"),
        ("song",        "BackOffice criou registro passivo — backoffice_song_id retornado"),
        ("work",        "BackOffice validou — obra ativa — backoffice_work_id retornado"),
        ("divergente",  "Conflito detectado — requer intervencao"),
        ("rejeitada",   "Dados invalidos — requer correcao"),
    ],
    widths=[3*cm,14*cm]
))

story += sub("4.2  Collect PR e MR")
story.append(P("Modelagem: OBRA → TERRITORIO → PUBLISHER LOCAL → COLLECT PR + COLLECT MR + VIGENCIA"))
story.append(P("Uma mesma editora pode ter Collect diferente por obra, territorio, contrato ou subedicao. "
    "Nao existe Collect fixo por editora.", rule_s))
story.append(code(
    "Top Show Music — Obra X — Brasil:\n"
    "  Collect PR: 100%   Collect MR: 100%   Vigencia: 2020-01-01 ate indeterminado\n\n"
    "Top Show Music — Obra X — Portugal:\n"
    "  Collect PR:  50%   Collect MR:   0%   Vigencia: 2022-06-01 ate 2025-12-31"
))

story += sub("4.3  Matching — Fluxo de Conciliacao")
story.append(P("O matching e automatico com etapa obrigatoria de validacao humana antes da distribuicao."))
story.append(code(
    "1. Importar extrato B-55\n"
    "2. Matching automatico por prioridade:\n"
    "     1o: backoffice_song_id / backoffice_work_id\n"
    "     2o: publisher_song_code vs codigo_publisher_song da obra\n"
    "     3o: ISWC (quando disponivel)\n"
    "     4o: titulo (busca fonetica — fallback manual)\n"
    "3. Status resultante:\n"
    "     conciliado  → match confiavel\n"
    "     divergente  → match com conflito — requer revisao\n"
    "     pendente    → nao identificado automaticamente\n"
    "4. Aprovacao manual (quando status divergente ou pendente)\n"
    "5. Apos aprovacao → liberar para distribuicao"
))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# PARTE 5 — DISTRIBUICAO
# ══════════════════════════════════════════════════════════════════════════════
story += sec("Distribuicao", "PARTE 5")

story += sub("5.1  Direitos — Lista Parametrizavel")
story.append(P("Tipos de direito sao configurados por tenant. "
    "Novos direitos podem ser criados sem alterar o codigo. "
    "Nao existe lista fixa no sistema."))
story.append(tbl(
    ["Tipo","Descricao","Entra na distribuicao?"],
    [
        ("execucao_publica",    "Performing — ECAD/Socinpro",    "NAO — apenas demonstrativo"),
        ("fonomecânico",        "Mechanical — BackOffice, streaming","Sim"),
        ("sincronizacao",       "Sync — audiovisual",            "Sim"),
        ("audiovisual",         "Producao audiovisual",           "Sim"),
        ("publicidade",         "Uso publicitario",              "Sim"),
        ("distribuicao_digital","Digital distribution",           "Sim"),
        ("reproducao_grafica",  "Edicao grafica, partitura",     "Sim"),
        ("autorizacoes_esp",    "Outros usos especificos",        "Sim"),
    ],
    widths=[4.5*cm,7*cm,5.5*cm]
))

story += sub("5.2  Motor de Calculo")
story.append(P("Totalmente dinamico. O motor sempre consulta o contrato vigente, o territorio, "
    "o direito e os participantes. Nenhum percentual e fixo no codigo."))
story.append(code(
    "Exemplo — Obra 50% controlada:\n\n"
    "  Nauilan (CA)      37,5%  controlado\n"
    "  Edi Music (E)     10,0%  controlado\n"
    "  Top Show (AM)      2,5%  controlado\n"
    "  Autor externo     50,0%  NAO controlado\n"
    "  ─────────────────────────────────────\n"
    "  Total controlado: 50%\n\n"
    "  Normalizacao para distribuicao interna:\n"
    "    Nauilan:   37,5 / 50 = 75%\n"
    "    Edi Music: 10,0 / 50 = 20%\n"
    "    Top Show:   2,5 / 50 =  5%"
))

story += sub("5.3  Portal do Autor")
story.append(P("O portal exibe exclusivamente os dados do autor autenticado:"))
story.append(tbl(
    ["Secao","Conteudo"],
    [
        ("Obras",            "Apenas obras com participacao do autor"),
        ("Recebimentos",     "Apenas valores correspondentes a sua participacao"),
        ("Conta Corrente",   "Apenas seu saldo — sem visualizar outros titulares"),
        ("Contratos",        "Apenas seus contratos"),
        ("Demonstrativos",   "Apenas seus demonstrativos"),
        ("Relatorios",       "Apenas seus relatorios"),
    ],
    widths=[4*cm,13*cm]
))
story.append(P("O autor NAO visualiza informacoes de outros titulares ou obras sem participacao. "
    "Isolamento garantido por RLS no banco de dados.", rule_s))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# APENDICE A — RESPOSTAS VALIDADAS
# ══════════════════════════════════════════════════════════════════════════════
story += sec("Respostas Validadas — Decisoes de Arquitetura", "APENDICE A")
story.append(P("As 10 decisoes abaixo foram confirmadas pelo usuario e servem como "
    "referencia definitiva para implementacao. Nenhuma pode ser alterada sem nova validacao."))
story.append(SP(0.3))

respostas = [
    ("1", "Taxa Administrativa",
     "Parametrizavel por contrato, obra, territorio ou regra especifica. "
     "Pode ser aplicada sobre valor bruto, sobre parcela editorial, sobre determinados direitos, ou nao existir. "
     "O motor deve ser flexivel para qualquer cenario. Nenhuma logica fixa no codigo.",
     EMERALD),
    ("2", "Collect (PR e MR)",
     "Modelado por: obra → territorio → publisher local → collect_pr% + collect_mr% + vigencia. "
     "Uma mesma editora pode ter condicoes diferentes por obra, contrato ou subedicao. "
     "Nao existe Collect fixo por editora.",
     EMERALD),
    ("3", "Matching B-55",
     "Automatico com etapa obrigatoria de validacao humana. "
     "Status: conciliado, divergente, pendente. "
     "Somente apos aprovacao manual o recebimento segue para distribuicao.",
     EMERALD),
    ("4", "ECAD / Socinpro",
     "Execucao publica NAO entra no motor de distribuicao. "
     "O ECAD ja distribui individualmente. "
     "O Sync Mood usa apenas para consulta, BI, auditoria e historico.",
     EMERALD),
    ("5", "Publisher Local",
     "Definido por contrato de subedicao ou administracao territorial. "
     "O SPT serve como referencia na importacao CWR mas a definicao oficial e contratual.",
     EMERALD),
    ("6", "CAE Multiplos",
     "Sistema mantem um CAE principal ativo. "
     "CAEs historicos armazenados como registros adicionais sem substituir o principal.",
     EMERALD),
    ("7", "Contratos",
     "Sistema suporta dois cenarios: contrato vinculado a obras especificas "
     "e contrato com cobertura de obras futuras. "
     "Configurado no momento do cadastro do contrato.",
     EMERALD),
    ("8", "Obra com Contratos Diferentes",
     "Uma mesma obra pode ter participacoes vinculadas a contratos distintos. "
     "Cada participacao (obras_links_titulares) tem FK para seu respectivo contrato.",
     EMERALD),
    ("9", "IRPF",
     "Sistema calcula, provisiona e demonstra retencoes. "
     "Regra de recolhimento parametrizavel por editora: "
     "apenas informar, reter automaticamente, gerar demonstrativos ou relatorios para contabilidade.",
     EMERALD),
    ("10","Portal do Autor",
     "Exibe exclusivamente: obras proprias, recebimentos proprios, conta corrente propria, "
     "contratos proprios, demonstrativos e relatorios. "
     "Sem acesso a dados de outros titulares ou obras sem participacao.",
     EMERALD),
]

for num, titulo, resp, cor in respostas:
    row_items = [
        Paragraph(s(num), mk(f"RN{num}", fontSize=11, fontName="Helvetica-Bold",
                              textColor=colors.white)),
        Paragraph(s(titulo), mk(f"RT{num}", fontSize=10, fontName="Helvetica-Bold",
                                 textColor=colors.white)),
        Paragraph(s(resp), mk(f"RR{num}", fontSize=9.5, fontName="Helvetica",
                               textColor=TEXT_MAIN, leading=14)),
    ]
    t = Table([[row_items[0], row_items[1], row_items[2]]], colWidths=[1*cm, 4*cm, 12*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (1,0), cor),
        ("BACKGROUND",    (2,0), (2,0), GRAY_LT),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("GRID",          (0,0), (-1,-1), 0.4, GRAY_BD),
    ]))
    story.append(t)
    story.append(SP(0.15))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
# APENDICE B — MATRIZ DA OBRA
# ══════════════════════════════════════════════════════════════════════════════
story += sec("Matriz da Obra — Grade Central", "APENDICE B")
story.append(P(
    "A MATRIZ DA OBRA e a principal fonte de verdade do Sync Mood. "
    "Baseada na grade historica utilizada pela Top Show Music. "
    "Toda a logica do sistema nasce desta grade."))
story.append(SP(0.3))
story.append(P("Estrutura da grade:", h3))
story.append(tbl(
    ["Link","Titular / Editora","Papel","CAE","Controlado","PR%","MR%","Territorio","Contrato"],
    [
        ("1","Nauilan",            "CA","123456","Sim","37,5%","37,5%","BR","2024"),
        ("1","Edi Music",          "E", "234567","Sim","10,0%","10,0%","BR","2024"),
        ("1","Top Show Music",     "AM","345678","Sim","2,5%", "2,5%", "BR","—"),
        ("1","Autor Externo",      "OWR","456789","Nao","50,0%","50,0%","BR","—"),
        ("2","Giovani Avelar",     "CA","567890","Sim","—",    "—",    "BR","2026"),
        ("2","Top Show Music",     "E", "345678","Sim","—",    "—",    "BR","2026"),
    ],
    widths=[1.2*cm,4*cm,1.5*cm,2.5*cm,2.2*cm,1.5*cm,1.5*cm,2*cm,2.1*cm]
))

story.append(SP(0.5))
story.append(P("Todos os modulos dependem desta matriz:", h3))
story.append(tbl(
    ["Modulo","Como usa a matriz"],
    [
        ("CWR Importacao",     "Popula a matriz a partir dos registros NWR/SPU/SWR/PWR/OWR"),
        ("CWR Exportacao",     "Gera SPU/SWR/PWR a partir de cada linha da matriz"),
        ("BackOffice",         "Envia percentuais e editoras da matriz — recebe Song/Work ID"),
        ("Recebimentos",       "Associa cada recebimento aos participantes da matriz"),
        ("Distribuicao",       "Calcula valores usando percentuais e contratos da matriz"),
        ("Conta Corrente",     "Lanca movimentos para cada participante da matriz"),
        ("Prestacao de Contas","Gera demonstrativo por titular baseado na matriz"),
        ("Portal do Autor",    "Exibe apenas as linhas da matriz onde o autor e participante"),
        ("BI / Relatorios",    "Agrega dados por participante, direito e territorio da matriz"),
        ("TV / Sync",          "Calcula licenciamento usando percentuais da matriz"),
    ],
    widths=[4.5*cm,12.5*cm]
))

story.append(SP(0.8))
story.append(HR(VIOLET, 1.5))
story.append(SP(0.3))
story.append(P(
    "Este documento representa a visao consolidada e validada da arquitetura do Sync Mood. "
    "Qualquer alteracao estrutural deve ser registrada e re-validada com o usuario "
    "antes de implementacao.",
    mk("Final", fontSize=10, leading=15, textColor=GRAY_TXT, fontName="Helvetica-Oblique")))

# ── Compilar ──────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    topMargin=2*cm, bottomMargin=2*cm, leftMargin=1.8*cm, rightMargin=1.8*cm,
    title="Arquitetura Funcional — Sync Mood v2",
    author="Sync Mood Gestao Inteligente",
)
doc.build(story, onFirstPage=cover_page, onLaterPages=later_pages)
print(f"PDF gerado: {OUTPUT}")
