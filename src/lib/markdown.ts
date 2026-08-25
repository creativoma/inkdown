export interface InlineSpan {
    text: string
    bold?: boolean
    italic?: boolean
}

export type MarkdownBlock =
    | { type: 'heading'; level: 1 | 2 | 3; spans: InlineSpan[] }
    | { type: 'paragraph'; spans: InlineSpan[] }
    | { type: 'list'; ordered: boolean; items: InlineSpan[][] }
    | { type: 'blockquote'; spans: InlineSpan[] }
    | { type: 'table'; header: InlineSpan[][]; rows: InlineSpan[][][] }
    | { type: 'hr' }

function parseInline(text: string): InlineSpan[] {
    const spans: InlineSpan[] = []
    const pattern = /(\*\*.+?\*\*|\*.+?\*)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            spans.push({ text: text.slice(lastIndex, match.index) })
        }

        const token = match[0]
        if (token.startsWith('**')) {
            spans.push({ text: token.slice(2, -2), bold: true })
        } else {
            spans.push({ text: token.slice(1, -1), italic: true })
        }

        lastIndex = pattern.lastIndex
    }

    if (lastIndex < text.length) {
        spans.push({ text: text.slice(lastIndex) })
    }

    return spans.length > 0 ? spans : [{ text: '' }]
}

function parseTableRow(line: string): string[] {
    const trimmed = line.trim().replace(/^\||\|$/g, '')
    return trimmed.split('|').map((cell) => cell.trim())
}

const isTableSeparator = (line: string) =>
    /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim())

export function parseMarkdown(markdown: string): MarkdownBlock[] {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n')
    const blocks: MarkdownBlock[] = []

    let i = 0
    while (i < lines.length) {
        const line = lines[i]

        if (line.trim() === '') {
            i++
            continue
        }

        if (/^---+$/.test(line.trim())) {
            blocks.push({ type: 'hr' })
            i++
            continue
        }

        const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line)
        if (headingMatch) {
            blocks.push({
                type: 'heading',
                level: headingMatch[1].length as 1 | 2 | 3,
                spans: parseInline(headingMatch[2]),
            })
            i++
            continue
        }

        if (/^>\s?/.test(line)) {
            const quoteLines: string[] = []
            while (i < lines.length && /^>\s?/.test(lines[i])) {
                quoteLines.push(lines[i].replace(/^>\s?/, ''))
                i++
            }
            blocks.push({
                type: 'blockquote',
                spans: parseInline(quoteLines.join(' ')),
            })
            continue
        }

        if (
            /^\|.*\|$/.test(line.trim()) &&
            i + 1 < lines.length &&
            isTableSeparator(lines[i + 1])
        ) {
            const header = parseTableRow(line).map(parseInline)
            i += 2
            const rows: InlineSpan[][][] = []
            while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
                rows.push(parseTableRow(lines[i]).map(parseInline))
                i++
            }
            blocks.push({ type: 'table', header, rows })
            continue
        }

        if (/^[-*]\s+/.test(line)) {
            const items: InlineSpan[][] = []
            while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
                items.push(parseInline(lines[i].replace(/^[-*]\s+/, '')))
                i++
            }
            blocks.push({ type: 'list', ordered: false, items })
            continue
        }

        if (/^\d+\.\s+/.test(line)) {
            const items: InlineSpan[][] = []
            while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
                items.push(parseInline(lines[i].replace(/^\d+\.\s+/, '')))
                i++
            }
            blocks.push({ type: 'list', ordered: true, items })
            continue
        }

        const paragraphLines: string[] = []
        while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !/^(#{1,3})\s+/.test(lines[i]) &&
            !/^[-*]\s+/.test(lines[i]) &&
            !/^\d+\.\s+/.test(lines[i]) &&
            !/^>\s?/.test(lines[i]) &&
            !/^\|.*\|$/.test(lines[i].trim()) &&
            !/^---+$/.test(lines[i].trim())
        ) {
            paragraphLines.push(lines[i])
            i++
        }
        blocks.push({
            type: 'paragraph',
            spans: parseInline(paragraphLines.join(' ')),
        })
    }

    return blocks
}
