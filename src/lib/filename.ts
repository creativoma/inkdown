const FALLBACK = 'document'

const DIACRITICS = /[\u0300-\u036f]/g

/**
 * Derives the download name from the document title (its first `#` heading,
 * else its first heading of any level), so the file lands in Downloads as
 * "alcance-y-condiciones.pdf" instead of "document.pdf".
 */
export function fileNameFromMarkdown(
    markdown: string,
    extension: 'pdf' | 'docx' = 'pdf'
): string {
    const heading =
        /^#\s+(.+)$/m.exec(markdown)?.[1] ??
        /^#{2,3}\s+(.+)$/m.exec(markdown)?.[1] ??
        ''

    const slug = heading
        .replace(/[*_`]/g, '')
        .normalize('NFD')
        .replace(DIACRITICS, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .replace(/-+$/g, '')

    return `${slug || FALLBACK}.${extension}`
}
