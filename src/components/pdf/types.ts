/** A registered @react-pdf font family: base-14, bundled, or a local one. */
export type FontFamily = string

export interface DocumentSettings {
    titleFont: FontFamily
    bodyFont: FontFamily
    titleSize: number
    bodySize: number
    linkColor: string
    logo: string | null
    /** Largest logo width in points; height is capped at half of it. */
    logoSize: number
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
    /** Pasted images (PNG/JPEG data URLs), referenced as `image:<id>`. */
    images?: Record<string, string>
}
