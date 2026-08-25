const FALLBACK = 'document'

const DIACRITICS = /[\u0300-\u036f]/g

/**
 * Derives the download name from the first heading of the document, so the file
 * lands in Downloads as "alcance-y-condiciones.pdf" instead of "document.pdf".
 */
export function fileNameFromMarkdown(markdown: string): string {
    const heading = /^#{1,3}\s+(.+)$/m.exec(markdown)?.[1] ?? ''

    const slug = heading
        .replace(/[*_`]/g, '')
        .normalize('NFD')
        .replace(DIACRITICS, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .replace(/-+$/g, '')

    return `${slug || FALLBACK}.pdf`
}
