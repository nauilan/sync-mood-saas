/**
 * lib/pdf-generator.ts
 * Gera um PDF do contrato usando pdf-lib (puro JS, serverless-safe).
 *
 * O conteúdo vem de renderTemplate() — texto simples com quebras de linha.
 * O PDF resultante é um documento A4 profissional pronto para assinatura digital.
 */

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'
import type { ContratoV2 } from './types-contratos-v2'
import { MODELOS_JURIDICOS_V2, renderTemplate } from './modelos-juridicos-v2'

// ── Layout ────────────────────────────────────────────────────────────────────

const PAGE_WIDTH   = 595.28  // A4 em pontos
const PAGE_HEIGHT  = 841.89  // A4 em pontos
const MARGIN_LEFT  = 70
const MARGIN_RIGHT = 70
const MARGIN_TOP   = 70
const MARGIN_BOT   = 70

const TEXT_WIDTH   = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const FONT_SIZE    = 10
const LINE_HEIGHT  = FONT_SIZE * 1.55

// ── Utilidade: quebra de linha ────────────────────────────────────────────────

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  if (!text.trim()) return ['']
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
      lines.push(cur)
      cur = word
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines
}

// ── Classe auxiliar de página ─────────────────────────────────────────────────

class PageWriter {
  private doc: PDFDocument
  private font: PDFFont
  private boldFont: PDFFont
  private page!: PDFPage
  private y: number = 0

  constructor(doc: PDFDocument, font: PDFFont, boldFont: PDFFont) {
    this.doc      = doc
    this.font     = font
    this.boldFont = boldFont
    this.addPage()
  }

  addPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.y    = PAGE_HEIGHT - MARGIN_TOP
  }

  private ensureSpace(needed: number) {
    if (this.y - needed < MARGIN_BOT) this.addPage()
  }

  writeLine(text: string, opts?: { bold?: boolean; size?: number; indent?: number; gap?: number }) {
    const size   = opts?.size   ?? FONT_SIZE
    const indent = opts?.indent ?? 0
    const gap    = opts?.gap    ?? 0
    const font   = opts?.bold ? this.boldFont : this.font
    const maxW   = TEXT_WIDTH - indent

    const wrapped = wrapText(text, font, size, maxW)
    this.ensureSpace(wrapped.length * LINE_HEIGHT + gap)

    for (const line of wrapped) {
      this.ensureSpace(LINE_HEIGHT)
      this.page.drawText(line, {
        x:    MARGIN_LEFT + indent,
        y:    this.y,
        size,
        font,
        color: rgb(0, 0, 0),
      })
      this.y -= LINE_HEIGHT
    }
    this.y -= gap
  }

  skip(pts = LINE_HEIGHT) {
    this.y -= pts
    if (this.y < MARGIN_BOT) this.addPage()
  }

  drawHRule() {
    this.ensureSpace(12)
    this.page.drawLine({
      start: { x: MARGIN_LEFT, y: this.y },
      end:   { x: PAGE_WIDTH - MARGIN_RIGHT, y: this.y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    })
    this.y -= 10
  }
}

// ── Gerador principal ────────────────────────────────────────────────────────

export async function generateContractPDF(contrato: ContratoV2): Promise<Buffer> {
  // 1. Obter conteúdo do template
  const modelo = contrato.modelo_juridico_id
    ? MODELOS_JURIDICOS_V2.find(m => m.id === contrato.modelo_juridico_id)
    : null

  // Variáveis para interpolação do template
  const obras     = contrato.obras_json ?? []
  const obraLista = obras.map(o => o.titulo).join(', ') || '(obras não especificadas)'
  const assinantes = contrato.assinantes_d4sign ?? []
  const cedente    = assinantes.find(a => a.papel === 'cedente')

  const vars: Record<string, string> = {
    titular_nome:       cedente?.nome       ?? contrato.titular_principal ?? '—',
    cpf:                cedente?.cpf        ?? '—',
    cnpj:               '—',
    rg:                 '—',
    endereco_completo:  '—',
    editora_nome:       contrato.editora_nome ?? '—',
    editora_cnpj:       '—',
    obra_titulo:        obras[0]?.titulo    ?? obraLista,
    obra_codigo:        '—',
    obras_lista:        obraLista,
    vigencia_inicio:    contrato.vigencia_inicio
      ? new Date(contrato.vigencia_inicio).toLocaleDateString('pt-BR')
      : '—',
    vigencia_fim:       contrato.vigencia_fim
      ? new Date(contrato.vigencia_fim).toLocaleDateString('pt-BR')
      : 'prazo indeterminado',
    percentual_titular: '—',
    percentual_editora: '—',
    territorio:         contrato.territorio_principal ?? 'Brasil',
    moeda:              'BRL',
    comissao:           '—',
    administradora_nome:'—',
    cessionario_nome:   contrato.editora_nome ?? '—',
    data_assinatura:    new Date().toLocaleDateString('pt-BR'),
  }

  const rawContent = modelo
    ? renderTemplate(modelo.template_texto ?? '', vars)
    : `CONTRATO ${contrato.numero}\n\nTipo: ${contrato.tipo}\nEditora: ${contrato.editora_nome}\n`

  // Substituir variáveis residuais {{...}} que renderTemplate não preencheu
  const content = rawContent.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k] ?? `[${k}]`)

  // 2. Criar PDF
  const pdfDoc   = await PDFDocument.create()
  pdfDoc.setTitle(`Contrato ${contrato.numero}`)
  pdfDoc.setAuthor('Sync Mood — Gestão Editorial')
  pdfDoc.setCreator('Sync Mood')

  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const writer   = new PageWriter(pdfDoc, font, boldFont)

  // 3. Cabeçalho
  writer.writeLine('SYNC MOOD — GESTÃO EDITORIAL', { bold: true, size: 9, gap: 2 })
  writer.drawHRule()
  writer.skip(4)
  writer.writeLine(contrato.numero, { bold: true, size: 14, gap: 4 })
  writer.writeLine(`Editora: ${contrato.editora_nome}`, { size: 10, gap: 2 })
  writer.writeLine(
    `Emitido em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    { size: 9 }
  )
  writer.skip(10)
  writer.drawHRule()
  writer.skip(8)

  // 4. Corpo do contrato (linha a linha)
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      writer.skip(LINE_HEIGHT * 0.4)
      continue
    }
    // Detectar cabeçalhos de cláusula (CLAUSULA, CAPITULO, ARTIGO)
    const isClause = /^(CL[ÁA]USULA|CAP[ÍI]TULO|ART\.?\s*\d|CONTRATO|PARTES|ANEXO)/i.test(trimmed)
    writer.writeLine(trimmed, {
      bold:   isClause,
      size:   isClause ? 10 : FONT_SIZE,
      indent: isClause ? 0 : 10,
      gap:    isClause ? 3 : 0,
    })
  }

  // 5. Área de assinaturas
  writer.skip(30)
  writer.drawHRule()
  writer.skip(6)
  writer.writeLine('ASSINATURAS', { bold: true, size: 11, gap: 12 })

  const papelLabel: Record<string, string> = {
    cedente:             'Cedente (Autor)',
    responsavel_editora: 'Representante da Editora',
    testemunha_1:        'Testemunha 1',
    testemunha_2:        'Testemunha 2',
  }

  for (const ass of assinantes) {
    writer.skip(8)
    writer.writeLine('_______________________________________________', { size: 9 })
    writer.writeLine(`${ass.nome ?? '—'}`, { bold: true, size: 10 })
    writer.writeLine(`${papelLabel[ass.papel] ?? ass.papel}   CPF: ${ass.cpf ?? '—'}`, { size: 9 })
    if (ass.email) writer.writeLine(`E-mail: ${ass.email}`, { size: 9 })
    writer.skip(10)
  }

  // 6. Rodapé na última página
  writer.skip(20)
  writer.drawHRule()
  writer.writeLine(
    `Documento gerado por Sync Mood em ${new Date().toLocaleString('pt-BR')} · Contrato ${contrato.numero}`,
    { size: 8 }
  )

  // 7. Serializar
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
