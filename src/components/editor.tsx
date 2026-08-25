'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ViewVerticalIcon } from '@radix-ui/react-icons'
import MyDocument from '@/components/pdf/my-document'
import { PdfPreview } from '@/components/pdf-preview'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
    SettingsSidebar,
    LocalFontsStatus,
} from '@/components/settings-sidebar'
import { DocumentSettings } from '@/components/pdf/types'
import {
    BUNDLED_FONTS,
    FontOption,
    STANDARD_FONTS,
    loadLocalFonts,
    setupPdfFonts,
    supportsLocalFonts,
} from '@/lib/fonts'
import { balanceHeadings, BalancedHeadings } from '@/lib/balance'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { fileNameFromMarkdown } from '@/lib/filename'
import { clearDraft, loadDraft, saveDraft } from '@/lib/storage'
import { cn } from '@/lib/utils'

setupPdfFonts()

const INSTALLED_FONTS = [...STANDARD_FONTS, ...BUNDLED_FONTS]

const DEFAULT_MARKDOWN = `# Invoice #0001

> Sample document

**Bill to:** Acme Corp

- Item 1 — $100.00
- Item 2 — $250.00
- Item 3 — $50.00

---

**Total: $400.00**

Thank you for your business.`

const DEFAULT_SETTINGS: DocumentSettings = {
    titleFont: 'Helvetica',
    bodyFont: 'Helvetica',
    titleSize: 20,
    bodySize: 10.5,
    logo: null,
    note: '',
    marginTop: 64,
    marginBottom: 64,
    marginHorizontal: 60,
}

type Pane = 'settings' | 'editor' | 'preview'

const PANES: { value: Pane; label: string }[] = [
    { value: 'settings', label: 'Settings' },
    { value: 'editor', label: 'Editor' },
    { value: 'preview', label: 'PDF' },
]

/**
 * A draft can name a font that is no longer registered (a local font after a
 * reload). Fall back so the preview always renders.
 */
const withAvailableFonts = (settings: DocumentSettings): DocumentSettings => {
    const known = new Set(INSTALLED_FONTS.map((font) => font.value))
    return {
        ...settings,
        titleFont: known.has(settings.titleFont)
            ? settings.titleFont
            : DEFAULT_SETTINGS.titleFont,
        bodyFont: known.has(settings.bodyFont)
            ? settings.bodyFont
            : DEFAULT_SETTINGS.bodyFont,
    }
}

export const Editor = () => {
    // Rendered client-side only, so the saved draft can seed the initial state
    // directly without risking a hydration mismatch.
    const [markdown, setMarkdown] = useState(
        () => loadDraft()?.markdown ?? DEFAULT_MARKDOWN
    )
    const [settings, setSettings] = useState<DocumentSettings>(() =>
        withAvailableFonts({ ...DEFAULT_SETTINGS, ...loadDraft()?.settings })
    )
    const [localFonts, setLocalFonts] = useState<FontOption[]>([])
    const [localFontsStatus, setLocalFontsStatus] = useState<LocalFontsStatus>(
        () => (supportsLocalFonts() ? 'idle' : 'unsupported')
    )
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [pane, setPane] = useState<Pane>('editor')
    const [resetOpen, setResetOpen] = useState(false)

    useEffect(() => {
        const timeout = setTimeout(() => saveDraft({ markdown, settings }), 500)
        return () => clearTimeout(timeout)
    }, [markdown, settings])

    // The PDF only re-renders once typing pauses; the textarea stays responsive.
    const renderedMarkdown = useDebouncedValue(markdown, 600)
    const renderedSettings = useDebouncedValue(settings, 400)
    const isRendering =
        renderedMarkdown !== markdown || renderedSettings !== settings

    // Headings are measured with the real font metrics and pre-wrapped before
    // the document renders, so the PDF never shows an unbalanced title first.
    const [prepared, setPrepared] = useState<{
        markdown: string
        settings: DocumentSettings
        balancedHeadings: BalancedHeadings
    } | null>(null)

    useEffect(() => {
        let cancelled = false

        const prepare = (balancedHeadings: BalancedHeadings) => {
            if (cancelled) return
            setPrepared({
                markdown: renderedMarkdown,
                settings: renderedSettings,
                balancedHeadings,
            })
        }

        balanceHeadings(renderedMarkdown, renderedSettings).then(prepare, () =>
            prepare({})
        )

        return () => {
            cancelled = true
        }
    }, [renderedMarkdown, renderedSettings])

    const pdfDocument = useMemo(
        () => (prepared ? <MyDocument args={prepared} /> : null),
        [prepared]
    )

    const fileName = useMemo(
        () => fileNameFromMarkdown(renderedMarkdown),
        [renderedMarkdown]
    )

    const wordCount = useMemo(
        () => markdown.trim().split(/\s+/).filter(Boolean).length,
        [markdown]
    )

    const fonts = useMemo(
        () => [...INSTALLED_FONTS, ...localFonts],
        [localFonts]
    )

    const handleLoadLocalFonts = async () => {
        setLocalFontsStatus('loading')
        try {
            setLocalFonts(await loadLocalFonts())
            setLocalFontsStatus('ready')
        } catch {
            setLocalFontsStatus('error')
        }
    }

    const handleReset = () => {
        clearDraft()
        setMarkdown(DEFAULT_MARKDOWN)
        setSettings(DEFAULT_SETTINGS)
        setResetOpen(false)
    }

    return (
        <>
            <div className="flex w-full min-w-0 shrink-0 gap-1 border-b border-border px-3 py-2 md:hidden">
                {PANES.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={pane === option.value}
                        onClick={() => setPane(option.value)}
                        className={cn(
                            'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            pane === option.value
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="flex min-h-0 w-full min-w-0 flex-1">
                <SettingsSidebar
                    settings={settings}
                    onChange={setSettings}
                    onReset={() => setResetOpen(true)}
                    fonts={fonts}
                    localFontsStatus={localFontsStatus}
                    onLoadLocalFonts={handleLoadLocalFonts}
                    className={cn(
                        'w-full md:w-64 md:shrink-0',
                        pane === 'settings' ? 'flex' : 'hidden',
                        sidebarOpen ? 'md:flex' : 'md:hidden'
                    )}
                />

                <div
                    className={cn(
                        'w-full min-w-0 flex-col border-r border-border md:flex md:w-1/2',
                        pane === 'editor' ? 'flex' : 'hidden'
                    )}
                >
                    <div className="flex items-start justify-between gap-3 px-6 pt-8 pb-4 md:px-10">
                        <div>
                            <h2 className="text-sm font-medium tracking-wide text-balance text-foreground">
                                Markdown
                            </h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Write your document, the PDF updates live.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((open) => !open)}
                            aria-label={
                                sidebarOpen
                                    ? 'Hide settings panel'
                                    : 'Show settings panel'
                            }
                            title={
                                sidebarOpen
                                    ? 'Hide settings panel'
                                    : 'Show settings panel'
                            }
                            className="hidden rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground md:block"
                        >
                            <ViewVerticalIcon />
                        </button>
                    </div>
                    <textarea
                        className="flex-1 resize-none bg-transparent px-6 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground md:px-10"
                        value={markdown}
                        onChange={(e) => setMarkdown(e.target.value)}
                        placeholder="# Title..."
                        spellCheck={false}
                        aria-label="Markdown source"
                    />
                    <div className="flex items-center justify-between px-6 py-3 text-xs text-muted-foreground md:px-10">
                        <span>
                            {wordCount} {wordCount === 1 ? 'word' : 'words'}
                        </span>
                        <span>Saved in this browser</span>
                    </div>
                </div>

                <PdfPreview
                    document={pdfDocument}
                    fileName={fileName}
                    stale={isRendering}
                    className={cn(
                        'w-full min-w-0 flex-1 md:block',
                        pane === 'preview' ? 'block' : 'hidden'
                    )}
                />
            </div>

            <ConfirmDialog
                open={resetOpen}
                title="Reset this document?"
                description="The markdown and settings saved in this browser are discarded and the sample document comes back. This cannot be undone."
                confirmLabel="Reset"
                onConfirm={handleReset}
                onCancel={() => setResetOpen(false)}
            />
        </>
    )
}
