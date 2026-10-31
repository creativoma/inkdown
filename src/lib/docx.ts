import {
    AlignmentType,
    BorderStyle,
    Document,
    ExternalHyperlink,
    Footer,
    HeadingLevel,
    ImageRun,
    LevelFormat,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from 'docx'
import type { ParagraphChild } from 'docx'
import { MyDocumentArgs } from '@/components/pdf/types'
import { InlineSpan, MarkdownBlock, parseMarkdown } from '@/lib/markdown'
import { IMAGE_REF_PREFIX } from '@/lib/images'

// A4 in points, the same page the PDF uses.
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89

const TEXT_COLOR = '2A2A2A'
const HEADING_COLOR = '1A1A1A'
const MUTED_COLOR = '5A5A5A'
const NOTE_COLOR = '9A9A9A'
const RULE_COLOR = 'E5E5E5'
const QUOTE_RULE_COLOR = 'D4D4D4'

const ORDERED_LIST = 'ordered-list'

/** PDF base-14 names are not installed fonts; map them to their usual twins. */
const WORD_FONTS: Record<string, string> = {
    Helvetica: 'Arial',
    'Times-Roman': 'Times New Roman',
    Courier: 'Courier New',
}

const wordFont = (family: string) => WORD_FONTS[family] ?? family

/** Word measures text in half-points and spacing in twentieths of a point. */
const halfPoints = (pt: number) => Math.round(pt * 2)
const twips = (pt: number) => Math.round(pt * 20)
/** Image sizes are given in 96 dpi pixels. */
const pixels = (pt: number) => Math.round((pt * 96) / 72)

const hexColor = (color: string) => color.replace('#', '').toUpperCase()

interface Measured {
    data: Uint8Array
    type: 'png' | 'jpg'
    width: number
    height: number
}

/** Decodes a PNG/JPEG data URL and reads its natural size. */
async function measureImage(dataUrl: string): Promise<Measured | null> {
    const match = /^data:image\/(png|jpe?g);base64,(.*)$/i.exec(dataUrl)
    if (!match) return null

    const img = new window.Image()
    img.src = dataUrl
    try {
        await img.decode()
    } catch {
        return null
    }

    const binary = atob(match[2])
    const data = Uint8Array.from(binary, (char) => char.charCodeAt(0))

    return {
        data,
        type: match[1].toLowerCase() === 'png' ? 'png' : 'jpg',
        width: img.naturalWidth,
        height: img.naturalHeight,
    }
}

/** Scales an image down (never up) to fit the box, in points. */
const fitImage = (image: Measured, maxWidth: number, maxHeight: number) => {
    // Pasted pixels map 1:1 to points, as react-pdf does.
    const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height)
    return new ImageRun({
        type: image.type,
        data: image.data,
        transformation: {
            width: pixels(image.width * ratio),
            height: pixels(image.height * ratio),
        },
    })
}

/**
 * Builds an editable Word document from the same markdown and settings the PDF
 * is rendered from, so it can be uploaded to Google Drive and edited there.
 */
export async function createDocx(args: MyDocumentArgs): Promise<Blob> {
    const { markdown, settings, images } = args
    const blocks = parseMarkdown(markdown)

    const titleFont = wordFont(settings.titleFont)
    const bodyFont = wordFont(settings.bodyFont)
    const { titleSize, bodySize } = settings
    const linkColor = hexColor(settings.linkColor)

    const contentWidth = PAGE_WIDTH - settings.marginHorizontal * 2
    const contentHeight =
        PAGE_HEIGHT - settings.marginTop - settings.marginBottom

    const runs = (
        spans: InlineSpan[],
        base: { size: number; bold?: boolean; italic?: boolean; color?: string }
    ): ParagraphChild[] =>
        spans.map((span) => {
            const run = (color: string, underline?: boolean) =>
                new TextRun({
                    text: span.text,
                    bold: base.bold || span.bold,
                    italics: base.italic || span.italic,
                    size: halfPoints(base.size),
                    color,
                    underline: underline ? {} : undefined,
                })

            return span.href
                ? new ExternalHyperlink({
                      link: span.href,
                      children: [run(linkColor, true)],
                  })
                : run(base.color ?? TEXT_COLOR)
        })

    const bodyLine = { line: 384 } // 1.6 line height

    let orderedLists = 0

    const renderBlock = async (
        block: MarkdownBlock
    ): Promise<(Paragraph | Table)[]> => {
        switch (block.type) {
            case 'heading': {
                const scale =
                    block.level === 1 ? 1 : block.level === 2 ? 0.72 : 0.58
                return [
                    new Paragraph({
                        heading:
                            block.level === 1
                                ? HeadingLevel.HEADING_1
                                : block.level === 2
                                  ? HeadingLevel.HEADING_2
                                  : HeadingLevel.HEADING_3,
                        spacing: {
                            before: twips(block.level === 1 ? 0 : 8),
                            after: twips(
                                block.level === 1
                                    ? 16
                                    : block.level === 2
                                      ? 10
                                      : 8
                            ),
                        },
                        keepNext: true,
                        children: runs(block.spans, {
                            size: titleSize * scale,
                            bold: true,
                            color: HEADING_COLOR,
                        }),
                    }),
                ]
            }
            case 'paragraph':
                return [
                    new Paragraph({
                        spacing: { ...bodyLine, after: twips(14) },
                        children: runs(block.spans, { size: bodySize }),
                    }),
                ]
            case 'list': {
                const instance = orderedLists++
                return block.items.map(
                    (item, index) =>
                        new Paragraph({
                            ...(block.ordered
                                ? {
                                      numbering: {
                                          reference: ORDERED_LIST,
                                          level: 0,
                                          instance,
                                      },
                                  }
                                : { bullet: { level: 0 } }),
                            spacing: {
                                ...bodyLine,
                                after: twips(
                                    index === block.items.length - 1 ? 14 : 6
                                ),
                            },
                            children: runs(item, { size: bodySize }),
                        })
                )
            }
            case 'blockquote':
                return [
                    new Paragraph({
                        indent: { left: twips(16) },
                        border: {
                            left: {
                                style: BorderStyle.SINGLE,
                                size: 12,
                                space: 14,
                                color: QUOTE_RULE_COLOR,
                            },
                        },
                        spacing: { ...bodyLine, after: twips(14) },
                        children: runs(block.spans, {
                            size: bodySize,
                            italic: true,
                            color: MUTED_COLOR,
                        }),
                    }),
                ]
            case 'table': {
                const columns = Math.max(
                    block.header.length,
                    ...block.rows.map((row) => row.length)
                )
                const rule = {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: RULE_COLOR,
                }
                const none = { style: BorderStyle.NONE, size: 0, color: 'auto' }
                const row = (cells: InlineSpan[][], header: boolean) =>
                    new TableRow({
                        cantSplit: true,
                        tableHeader: header,
                        children: Array.from(
                            { length: columns },
                            (_, index) =>
                                new TableCell({
                                    width: {
                                        size: 100 / columns,
                                        type: WidthType.PERCENTAGE,
                                    },
                                    margins: {
                                        top: twips(6),
                                        bottom: twips(6),
                                        left: twips(8),
                                        right: twips(8),
                                    },
                                    children: [
                                        new Paragraph({
                                            children: runs(
                                                cells[index] ?? [{ text: '' }],
                                                {
                                                    size: bodySize * 0.9,
                                                    bold: header,
                                                    color: header
                                                        ? HEADING_COLOR
                                                        : TEXT_COLOR,
                                                }
                                            ),
                                        }),
                                    ],
                                })
                        ),
                    })

                return [
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: rule,
                            bottom: rule,
                            insideHorizontal: rule,
                            left: none,
                            right: none,
                            insideVertical: none,
                        },
                        rows: [
                            row(block.header, true),
                            ...block.rows.map((cells) => row(cells, false)),
                        ],
                    }),
                    // Word glues consecutive tables and needs a gap after one.
                    new Paragraph({ spacing: { after: twips(6) } }),
                ]
            }
            case 'image': {
                const src = block.src.startsWith(IMAGE_REF_PREFIX)
                    ? images?.[block.src.slice(IMAGE_REF_PREFIX.length)]
                    : block.src
                const image = src ? await measureImage(src) : null
                if (!image) return []

                return [
                    new Paragraph({
                        spacing: { after: twips(14) },
                        children: [
                            fitImage(image, contentWidth, contentHeight - 14),
                        ],
                    }),
                ]
            }
            case 'hr':
                return [
                    new Paragraph({
                        spacing: { before: twips(18), after: twips(18) },
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 6,
                                space: 1,
                                color: RULE_COLOR,
                            },
                        },
                    }),
                ]
            default:
                return []
        }
    }

    const children: (Paragraph | Table)[] = []

    const logo = settings.logo ? await measureImage(settings.logo) : null
    if (logo) {
        children.push(
            new Paragraph({
                spacing: { after: twips(24) },
                children: [
                    fitImage(logo, settings.logoSize, settings.logoSize / 2),
                ],
            })
        )
    }

    for (const block of blocks) {
        children.push(...(await renderBlock(block)))
    }

    const note = settings.note.trim()
    const noteSize = Math.max(6.5, bodySize * 0.68)

    const firstHeading = blocks.find((block) => block.type === 'heading')
    const title =
        firstHeading && firstHeading.type === 'heading'
            ? firstHeading.spans.map((span) => span.text).join('')
            : 'Document'

    const doc = new Document({
        title,
        styles: {
            default: {
                document: {
                    run: {
                        font: bodyFont,
                        size: halfPoints(bodySize),
                        color: TEXT_COLOR,
                    },
                },
                // Drop Word's blue heading theme; keep the outline levels.
                heading1: { run: { font: titleFont, color: HEADING_COLOR } },
                heading2: { run: { font: titleFont, color: HEADING_COLOR } },
                heading3: { run: { font: titleFont, color: HEADING_COLOR } },
            },
        },
        numbering: {
            config: [
                {
                    reference: ORDERED_LIST,
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.DECIMAL,
                            text: '%1.',
                            alignment: AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: {
                                        left: twips(16),
                                        hanging: twips(16),
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            width: twips(PAGE_WIDTH),
                            height: twips(PAGE_HEIGHT),
                        },
                        margin: {
                            top: twips(settings.marginTop),
                            bottom: twips(settings.marginBottom),
                            left: twips(settings.marginHorizontal),
                            right: twips(settings.marginHorizontal),
                            footer: twips(
                                Math.max(
                                    16,
                                    settings.marginBottom / 2 - noteSize
                                )
                            ),
                        },
                    },
                },
                footers:
                    note !== ''
                        ? {
                              default: new Footer({
                                  children: [
                                      new Paragraph({
                                          alignment: AlignmentType.CENTER,
                                          children: [
                                              new TextRun({
                                                  text: note,
                                                  size: halfPoints(noteSize),
                                                  color: NOTE_COLOR,
                                              }),
                                          ],
                                      }),
                                  ],
                              }),
                          }
                        : undefined,
                children,
            },
        ],
    })

    return Packer.toBlob(doc)
}
