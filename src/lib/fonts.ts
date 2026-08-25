'use client'

import { Font } from '@react-pdf/renderer'

type FontKind = 'standard' | 'bundled' | 'local'

export interface FontOption {
    value: string
    label: string
    kind: FontKind
}

/** PDF base-14 faces: no embedding, no download, smallest files. */
export const STANDARD_FONTS: FontOption[] = [
    { value: 'Helvetica', label: 'Helvetica', kind: 'standard' },
    { value: 'Times-Roman', label: 'Times', kind: 'standard' },
    { value: 'Courier', label: 'Courier', kind: 'standard' },
]

/** Open-source families shipped with the app, fetched only when used. */
export const BUNDLED_FONTS: FontOption[] = [
    { value: 'Inter', label: 'Inter', kind: 'bundled' },
    { value: 'Lora', label: 'Lora', kind: 'bundled' },
    { value: 'EB Garamond', label: 'EB Garamond', kind: 'bundled' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono', kind: 'bundled' },
]

const BUNDLED_FILES: Record<string, string> = {
    Inter: 'inter',
    Lora: 'lora',
    'EB Garamond': 'garamond',
    'JetBrains Mono': 'jetbrains',
}

let configured = false

/** Registers the bundled families and turns off mid-word hyphenation. */
export function setupPdfFonts() {
    if (configured) return
    configured = true

    // react-pdf hyphenates by default, which breaks titles as "Analyz-er".
    Font.registerHyphenationCallback((word) => [word])

    for (const [family, slug] of Object.entries(BUNDLED_FILES)) {
        Font.register({
            family,
            fonts: [
                {
                    src: `/fonts/${slug}-regular.ttf`,
                    fontWeight: 400,
                    fontStyle: 'normal',
                },
                {
                    src: `/fonts/${slug}-bold.ttf`,
                    fontWeight: 700,
                    fontStyle: 'normal',
                },
                {
                    src: `/fonts/${slug}-italic.ttf`,
                    fontWeight: 400,
                    fontStyle: 'italic',
                },
                // Needed for an italic span inside a heading: the renderer
                // resolves style and weight together and throws when the
                // combination is missing.
                {
                    src: `/fonts/${slug}-bolditalic.ttf`,
                    fontWeight: 700,
                    fontStyle: 'italic',
                },
            ],
        })
    }
}

// ---------------------------------------------------------------------------
// Local fonts (Chromium's Local Font Access API)
// ---------------------------------------------------------------------------

interface LocalFontData {
    family: string
    style: string
    blob: () => Promise<Blob>
}

interface LocalFontWindow {
    queryLocalFonts?: () => Promise<LocalFontData[]>
}

export const supportsLocalFonts = () =>
    typeof window !== 'undefined' &&
    typeof (window as LocalFontWindow).queryLocalFonts === 'function'

const registeredLocal = new Set<string>()

// Style names vary by vendor: "Regular", "Bold Italic", "Oblique", "Book"…
const isItalic = (face: LocalFontData) => /italic|oblique/i.test(face.style)
const isBold = (face: LocalFontData) => /bold|black|heavy/i.test(face.style)

const pickFace = (
    faces: LocalFontData[],
    bold: boolean,
    italic: boolean
): LocalFontData | undefined =>
    faces.find((face) => isBold(face) === bold && isItalic(face) === italic)

/**
 * Asks the browser for the installed fonts, registers each family's
 * regular/bold/italic faces with the PDF renderer, and returns the families
 * that could actually be embedded.
 */
export async function loadLocalFonts(): Promise<FontOption[]> {
    const query = (window as LocalFontWindow).queryLocalFonts
    if (!query) throw new Error('This browser cannot list local fonts')

    const faces = await query()
    const byFamily = new Map<string, LocalFontData[]>()

    for (const face of faces) {
        const group = byFamily.get(face.family)
        if (group) group.push(face)
        else byFamily.set(face.family, [face])
    }

    const options: FontOption[] = []

    for (const [family, group] of byFamily) {
        const regular = pickFace(group, false, false) ?? group[0]
        if (!regular) continue

        options.push({ value: family, label: family, kind: 'local' })

        if (registeredLocal.has(family)) continue
        registeredLocal.add(family)

        const bold = pickFace(group, true, false) ?? regular
        const italic = pickFace(group, false, true) ?? regular
        const boldItalic =
            pickFace(group, true, true) ?? (italic !== regular ? italic : bold)

        try {
            // Every style/weight combination must exist: the renderer resolves
            // them together and throws when one is missing, so families without
            // an italic reuse their regular face.
            const urls = new Map<LocalFontData, Promise<string>>()
            const urlFor = (face: LocalFontData) => {
                const cached = urls.get(face)
                if (cached) return cached

                // Cache the promise: a face reused across variants is read once.
                const pending = face
                    .blob()
                    .then((blob) => URL.createObjectURL(blob))
                urls.set(face, pending)
                return pending
            }

            const fonts = [
                { face: regular, fontWeight: 400, fontStyle: 'normal' },
                { face: bold, fontWeight: 700, fontStyle: 'normal' },
                { face: italic, fontWeight: 400, fontStyle: 'italic' },
                { face: boldItalic, fontWeight: 700, fontStyle: 'italic' },
            ] as const

            Font.register({
                family,
                fonts: await Promise.all(
                    fonts.map(async ({ face, fontWeight, fontStyle }) => ({
                        src: await urlFor(face),
                        fontWeight,
                        fontStyle,
                    }))
                ),
            })
        } catch {
            // Some system faces (collections, protected fonts) cannot be read;
            // drop them instead of breaking the whole list.
            registeredLocal.delete(family)
            options.pop()
        }
    }

    return options.sort((a, b) => a.label.localeCompare(b.label))
}
