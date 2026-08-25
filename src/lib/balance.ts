'use client'

import { Font } from '@react-pdf/renderer'
import { DocumentSettings } from '@/components/pdf/types'
import { parseMarkdown } from '@/lib/markdown'

/** react-pdf renders A4 by default and the app does not expose page size. */
const A4_WIDTH_PT = 595.28
const SEARCH_STEPS = 14

interface Measurable {
    layout: (text: string) => { advanceWidth: number }
    unitsPerEm: number
}

export type BalancedHeadings = Record<string, string>

export const headingKey = (level: number, text: string) => `${level}:${text}`

const widthOf = (data: Measurable, text: string, fontSize: number) =>
    (data.layout(text).advanceWidth / data.unitsPerEm) * fontSize

const wrap = (
    words: string[],
    data: Measurable,
    fontSize: number,
    maxWidth: number
): string[] => {
    const lines: string[] = []
    let current = ''

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word
        if (current && widthOf(data, candidate, fontSize) > maxWidth) {
            lines.push(current)
            current = word
        } else {
            current = candidate
        }
    }

    if (current) lines.push(current)
    return lines
}

/**
 * CSS `text-wrap: balance` for the PDF: keeps the line count the renderer would
 * pick anyway, then narrows the measuring width until the lines even out, and
 * returns the text with explicit breaks.
 */
const balanceLines = (
    text: string,
    data: Measurable,
    fontSize: number,
    maxWidth: number
): string => {
    const words = text.split(/\s+/).filter(Boolean)
    if (words.length < 3) return text

    let best = wrap(words, data, fontSize, maxWidth)
    const target = best.length
    if (target < 2) return text

    let low = maxWidth / target
    let high = maxWidth

    for (let step = 0; step < SEARCH_STEPS; step++) {
        const mid = (low + high) / 2
        const lines = wrap(words, data, fontSize, mid)

        if (lines.length <= target) {
            best = lines
            high = mid
        } else {
            low = mid
        }
    }

    return best.join('\n')
}

const loadFontData = async (
    fontFamily: string,
    fontWeight: number
): Promise<Measurable | null> => {
    try {
        const descriptor = {
            fontFamily,
            fontWeight,
            fontStyle: 'normal' as const,
        }
        await Font.load(descriptor)
        const data = Font.getFont(descriptor)
            .data as unknown as Measurable | null

        return data &&
            typeof data.layout === 'function' &&
            typeof data.unitsPerEm === 'number'
            ? data
            : null
    } catch {
        return null
    }
}

const headingSize = (level: 1 | 2 | 3, titleSize: number) =>
    level === 1 ? titleSize : level === 2 ? titleSize * 0.72 : titleSize * 0.58

/**
 * Returns the balanced version of every heading in the document, keyed by level
 * and text. Headings mixing bold/italic spans are left alone: their metrics do
 * not come from a single face.
 */
export async function balanceHeadings(
    markdown: string,
    settings: DocumentSettings
): Promise<BalancedHeadings> {
    const data = await loadFontData(settings.titleFont, 700)
    if (!data) return {}

    const maxWidth = A4_WIDTH_PT - settings.marginHorizontal * 2
    if (maxWidth <= 0) return {}

    const balanced: BalancedHeadings = {}

    for (const block of parseMarkdown(markdown)) {
        if (block.type !== 'heading' || block.spans.length !== 1) continue

        const text = block.spans[0].text
        const key = headingKey(block.level, text)
        if (text.trim() === '' || key in balanced) continue

        try {
            balanced[key] = balanceLines(
                text,
                data,
                headingSize(block.level, settings.titleSize),
                maxWidth
            )
        } catch {
            // Leave this heading unbalanced rather than failing the render.
        }
    }

    return balanced
}
