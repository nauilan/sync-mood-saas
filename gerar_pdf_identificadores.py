from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

OUT = r"C:\Users\Usuário\Desktop\sync-mood-saas\Identificadores_Contrato_SyncMood.pdf"

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    topMargin=2*cm, bottomMargin=2*cm,
    leftMargin=2.5*cm, rightMargin=2.5*cm
)

styles = getSampleStyleSheet()

titulo = ParagraphStyle('titulo', parent=styles['Title'],
    fontSize=18, textColor=colors.HexColor('#7c3aed'), spaceAfter=6)
subtitulo = ParagraphStyle('subtitulo', parent=styles['Normal'],
    fontSize=10, textColor=colors.HexColor('#888888'), spaceAfter=16)
secao = ParagraphStyle('secao', parent=styles['Heading2'],
    fontSize=11, textColor=colors.HexColor('#5b21b6'),
    spaceBefore=14, spaceAfter=6,
    backColor=colors.HexColor('#f3f0ff'),
    borderPad=4, leftIndent=-4)
normal = ParagraphStyle('normal', parent=styles['Normal'],
    fontSize=9, textColor=colors.HexColor('#333333'), spaceAfter=3)
rodape = ParagraphStyle('rodape', parent=styles['Normal'],
    fontSize=8, textColor=colors.HexColor('#aaaaaa'), spaceAfter=0)

SECOES = [
    ("DADOS DO CONTRATO", [
        ("{{numero_contrato}}",        "Número sequencial do contrato"),
        ("{{codigo_contrato}}",        "Código do modelo (ex: CDP001)"),
        ("{{tipo_contrato}}",          "Tipo: Cessão Parcial, Coedição, etc."),
        ("{{data_assinatura}}",        "Data de assinatura (dd/mm/aaaa)"),
        ("{{data_assinatura_extenso}}","Data por extenso (ex: 22 de maio de 2026)"),
        ("{{data_inicio_vigencia}}",   "Data de início da vigência"),
        ("{{data_fim_vigencia}}",      "Data de término da vigência"),
        ("{{vigencia_meses}}",         "Duração em meses (ex: 60)"),
        ("{{cidade_assinatura}}",      "Cidade onde o contrato é assinado"),
        ("{{estado_assinatura}}",      "Estado (UF) onde o contrato é assinado"),
    ]),
    ("DADOS DO TITULAR — PESSOA FÍSICA (AUTOR)", [
        ("{{nome_titular}}",           "Nome completo do titular"),
        ("{{pseudonimo_titular}}",     "Pseudônimo artístico"),
        ("{{cpf_titular}}",            "CPF com formatação (000.000.000-00)"),
        ("{{rg_titular}}",             "RG do titular"),
        ("{{nacionalidade_titular}}",  "Nacionalidade (ex: BRASILEIRO)"),
        ("{{profissao_titular}}",      "Profissão declarada"),
        ("{{estado_civil_titular}}",   "Estado civil"),
        ("{{endereco_titular}}",       "Endereço completo"),
        ("{{cidade_titular}}",         "Cidade do titular"),
        ("{{estado_titular}}",         "Estado (UF) do titular"),
        ("{{cep_titular}}",            "CEP do titular"),
        ("{{email_titular}}",          "E-mail do titular"),
        ("{{telefone_titular}}",       "Telefone com DDD"),
        ("{{codigo_ecad_titular}}",    "Código ECAD do titular"),
        ("{{associacao_titular}}",     "Associação (ABRAMUS, UBC, etc.)"),
        ("{{funcao_titular}}",         "Função: CO, ME, AR, PF, etc."),
    ]),
    ("DADOS DO TITULAR — PESSOA JURÍDICA", [
        ("{{razao_social_titular}}",   "Razão social da empresa"),
        ("{{nome_fantasia_titular}}",  "Nome fantasia"),
        ("{{cnpj_titular}}",           "CNPJ (00.000.000/0001-00)"),
        ("{{inscricao_estadual_titular}}", "Inscrição estadual"),
        ("{{representante_legal_pj}}", "Nome do representante legal"),
        ("{{cpf_representante_pj}}",   "CPF do representante legal"),
        ("{{cargo_representante_pj}}", "Cargo do representante (ex: SÓCIO-ADMINISTRADOR)"),
    ]),
    ("DADOS DA EDITORA", [
        ("{{nome_editora}}",           "Razão social da editora"),
        ("{{cnpj_editora}}",           "CNPJ da editora"),
        ("{{endereco_editora}}",       "Endereço completo da editora"),
        ("{{cidade_editora}}",         "Cidade da editora"),
        ("{{estado_editora}}",         "Estado (UF) da editora"),
        ("{{cep_editora}}",            "CEP da editora"),
        ("{{representante_legal_editora}}", "Nome do representante legal da editora"),
        ("{{cpf_representante_editora}}",   "CPF do representante da editora"),
        ("{{cargo_representante_editora}}", "Cargo (ex: DIRETOR)"),
        ("{{codigo_ecad_editora}}",    "Código ECAD da editora"),
    ]),
    ("DADOS DO CESSIONÁRIO (CPJ / CPF)", [
        ("{{nome_cessionario}}",       "Nome completo ou razão social do cessionário"),
        ("{{cpf_cnpj_cessionario}}",   "CPF ou CNPJ do cessionário"),
        ("{{tipo_cessionario}}",       "PF ou PJ"),
        ("{{endereco_cessionario}}",   "Endereço do cessionário"),
        ("{{cidade_cessionario}}",     "Cidade do cessionário"),
        ("{{estado_cessionario}}",     "Estado do cessionário"),
    ]),
    ("COEDIÇÃO / SUBEDIÇÃO / ADMINISTRAÇÃO", [
        ("{{nome_coeditora}}",         "Nome da coeditora"),
        ("{{cnpj_coeditora}}",         "CNPJ da coeditora"),
        ("{{percentual_coeditora}}",   "Participação percentual da coeditora"),
        ("{{nome_subeditor}}",         "Nome do subeditor / representante no exterior"),
        ("{{cnpj_subeditor}}",         "CNPJ do subeditor"),
        ("{{comissao_subeditor}}",     "Comissão do subeditor (%)"),
        ("{{territorio_subedicao}}",   "Território de atuação (ex: ESTADOS UNIDOS)"),
        ("{{nome_editora_original}}",  "Editora proprietária original (Administração)"),
        ("{{cnpj_editora_original}}",  "CNPJ da editora original"),
    ]),
    ("DADOS DA OBRA", [
        ("{{titulo_obra}}",            "Título da obra musical"),
        ("{{titulo_original_obra}}",   "Título original (se diferente)"),
        ("{{iswc_obra}}",              "Código ISWC (T-000.000.000-0)"),
        ("{{genero_obra}}",            "Gênero musical"),
        ("{{duracao_obra}}",           "Duração (mm:ss)"),
        ("{{ano_criacao_obra}}",       "Ano de criação"),
        ("{{idioma_obra}}",            "Idioma da letra"),
    ]),
    ("PERCENTUAIS E DIREITOS", [
        ("{{percentual_autor}}",       "% geral do autor (Brasil)"),
        ("{{percentual_editora}}",     "% geral da editora (Brasil)"),
        ("{{percentual_autor_brasil}}", "% autor — direitos no Brasil"),
        ("{{percentual_editora_brasil}}", "% editora — direitos no Brasil"),
        ("{{percentual_autor_exterior}}", "% autor — direitos no exterior"),
        ("{{percentual_editora_exterior}}", "% editora — direitos no exterior"),
        ("{{percentual_autor_extenso}}", "% autor por extenso (ex: SETENTA E CINCO)"),
        ("{{percentual_editora_extenso}}", "% editora por extenso"),
        ("{{direito_reproducao_grafica}}", "% Reprodução Gráfica (Edição)"),
        ("{{direito_fonomec}}",        "% Reprodução Fonomecânica"),
        ("{{direito_audiovisual}}",    "% Inclusão em Produções Audiovisuais"),
        ("{{direito_publicitario}}",   "% Inclusão em Publicidade"),
        ("{{direito_digital}}",        "% Distribuição Digital / Streaming"),
        ("{{direito_base_dados}}",     "% Inclusão em Base de Dados"),
        ("{{direito_comunicacao_publico}}", "% Comunicação ao Público"),
        ("{{direito_autorizacoes}}",   "% Autorizações com Ônus"),
    ]),
    ("DADOS BANCÁRIOS — PAGAMENTO", [
        ("{{banco_titular}}",          "Nome e código do banco do titular"),
        ("{{agencia_titular}}",        "Agência do titular"),
        ("{{conta_titular}}",          "Número da conta do titular"),
        ("{{tipo_conta_titular}}",     "Corrente ou Poupança"),
        ("{{operacao_titular}}",       "Operação (CEF)"),
        ("{{pix_titular}}",            "Chave PIX do titular"),
        ("{{banco_cessionario}}",      "Banco do cessionário"),
        ("{{agencia_cessionario}}",    "Agência do cessionário"),
        ("{{conta_cessionario}}",      "Conta do cessionário"),
        ("{{pix_cessionario}}",        "Chave PIX do cessionário"),
    ]),
    ("EXCLUSIVIDADE", [
        ("{{tem_exclusividade}}",      "SIM ou NÃO"),
        ("{{periodo_exclusividade}}",  "Período de exclusividade em meses"),
        ("{{data_fim_exclusividade}}", "Data de término da exclusividade"),
        ("{{prazo_aviso_renovacao}}",  "Dias de antecedência para aviso de renovação"),
    ]),
    ("TESTEMUNHAS E ASSINATURA", [
        ("{{nome_testemunha_1}}",      "Nome completo da 1ª testemunha"),
        ("{{cpf_testemunha_1}}",       "CPF da 1ª testemunha"),
        ("{{nome_testemunha_2}}",      "Nome completo da 2ª testemunha"),
        ("{{cpf_testemunha_2}}",       "CPF da 2ª testemunha"),
        ("{{local_assinatura}}",       "Cidade e estado (ex: MARINGÁ/PR)"),
    ]),
]

story = []

story.append(Paragraph("SYNC MOOD — CONTRATOS-TIPO", titulo))
story.append(Paragraph("Identificadores de campos para geração automática de contratos editoriais", subtitulo))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#7c3aed'), spaceAfter=12))

nota = (
    "<b>Como usar:</b> Insira os identificadores abaixo nos modelos de contrato (.docx ou .pdf). "
    "O sistema substituirá automaticamente cada campo pelo dado real do titular, obra ou editora "
    "no momento da geração do contrato."
)
story.append(Paragraph(nota, ParagraphStyle('nota', parent=styles['Normal'],
    fontSize=9, textColor=colors.HexColor('#444444'),
    backColor=colors.HexColor('#f3f0ff'),
    borderPad=8, spaceAfter=18, leftIndent=0)))
story.append(Spacer(1, 0.3*cm))

for titulo_sec, campos in SECOES:
    story.append(Paragraph(titulo_sec, secao))
    data = [["IDENTIFICADOR", "DESCRIÇÃO"]]
    for campo, desc in campos:
        data.append([campo, desc])
    t = Table(data, colWidths=[7.5*cm, 9.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  colors.HexColor('#5b21b6')),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0),  8),
        ("FONTNAME",     (0, 1), (0, -1),  "Courier"),
        ("FONTSIZE",     (0, 1), (-1, -1), 8),
        ("TEXTCOLOR",    (0, 1), (0, -1),  colors.HexColor('#5b21b6')),
        ("TEXTCOLOR",    (1, 1), (1, -1),  colors.HexColor('#333333')),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f7ff')]),
        ("GRID",         (0, 0), (-1, -1), 0.3, colors.HexColor('#dddddd')),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3*cm))

story.append(Spacer(1, 0.5*cm))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc'), spaceAfter=6))
story.append(Paragraph(
    "Sync Mood — Sistema de Gestão de Direitos Autorais  |  Documento gerado automaticamente",
    rodape))

doc.build(story)
print("PDF gerado:", OUT)
