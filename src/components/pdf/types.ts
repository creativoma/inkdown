/** A registered @react-pdf font family: base-14, bundled, or a local one. */
export type FontFamily = string

export interface DocumentSettings {
    titleFont: FontFamily
    bodyFont: FontFamily
    titleSize: number
    bodySize: number
    logo: string | null
    note: string
    marginTop: number
    marginBottom: number
    marginHorizontal: number
}

export interface MyDocumentArgs {
    markdown: string
    settings: DocumentSettings
    /** Headings pre-wrapped into balanced lines, keyed by `level:text`. */
    balancedHeadings?: Record<string, string>
}
