'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BlobProvider } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { ChevronDownIcon, DownloadIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'

interface PdfPreviewProps {
    document: React.ReactElement<DocumentProps> | null
    fileName: string
    stale: boolean
    onExportWord?: () => Promise<void>
    className?: string
}

interface PdfFramesProps {
    blob: Blob | null
    busy: boolean
    error?: Error | null
    fileName: string
    onExportWord?: () => Promise<void>
    className?: string
}

const FRAME_SLOTS = [0, 1]

/**
 * Two stacked iframes render alternately: a new document is loaded into the
 * hidden one and only revealed once the browser finished painting it, so the
 * preview never flashes white while typing.
 */
const PdfFrames: React.FC<PdfFramesProps> = ({
    blob,
    busy,
    error,
    fileName,
    onExportWord,
    className,
}) => {
    const frames = useRef<(HTMLIFrameElement | null)[]>([null, null])
    const renderedBlob = useRef<Blob | null>(null)
    const currentUrl = useRef<string | null>(null)
    const downloadRef = useRef<HTMLAnchorElement>(null)

    const [visible, setVisible] = useState(0)
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!blob || blob === renderedBlob.current) return

        const target = frames.current[1 - visible]
        if (!target) return

        renderedBlob.current = blob
        const objectUrl = URL.createObjectURL(blob)

        const handleLoad = () => {
            if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
            currentUrl.current = objectUrl
            setDownloadUrl(objectUrl)
            setVisible((current) => 1 - current)
        }

        target.addEventListener('load', handleLoad, { once: true })
        // Hide the browser's own PDF chrome; the app provides the actions.
        target.src = `${objectUrl}#toolbar=0&navpanes=0&view=FitH`

        return () => target.removeEventListener('load', handleLoad)
    }, [blob, visible])

    useEffect(
        () => () => {
            if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
        },
        []
    )

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault()
                downloadRef.current?.click()
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    useEffect(() => {
        if (!menuOpen) return

        const close = () => setMenuOpen(false)
        const onPointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) close()
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close()
        }

        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        // Clicks inside the PDF iframe never reach the document; they blur it.
        window.addEventListener('blur', close)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('blur', close)
        }
    }, [menuOpen])

    const ready = downloadUrl !== null

    const handleExportWord = async () => {
        setMenuOpen(false)
        if (!onExportWord || exporting) return
        setExporting(true)
        try {
            await onExportWord()
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className={cn('relative bg-muted/40', className)}>
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                {busy && (
                    <span className="hidden rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur sm:block">
                        Updating…
                    </span>
                )}
                <div ref={menuRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        disabled={!ready || exporting}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        title="Download (⌘S for PDF)"
                        className="flex items-center gap-1.5 rounded-md border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
                    >
                        <DownloadIcon />
                        {exporting
                            ? 'Exporting…'
                            : ready
                              ? 'Download'
                              : 'Preparing…'}
                        <ChevronDownIcon className="text-muted-foreground" />
                    </button>

                    {menuOpen && (
                        <div
                            role="menu"
                            className="absolute right-0 mt-1 flex min-w-full flex-col rounded-md border border-border bg-background p-1 shadow-md"
                        >
                            <a
                                role="menuitem"
                                href={downloadUrl ?? undefined}
                                download={fileName}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-between gap-4 rounded px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                            >
                                .pdf
                                <span className="text-muted-foreground">
                                    ⌘S
                                </span>
                            </a>
                            {onExportWord && (
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleExportWord}
                                    title="Editable in Word and Google Docs"
                                    className="rounded px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
                                >
                                    .docx
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Target of the ⌘S shortcut, which always saves the PDF. */}
                <a
                    ref={downloadRef}
                    href={downloadUrl ?? undefined}
                    download={fileName}
                    hidden
                    aria-hidden
                    tabIndex={-1}
                />
            </div>

            {FRAME_SLOTS.map((slot) => (
                <iframe
                    key={slot}
                    ref={(element) => {
                        frames.current[slot] = element
                    }}
                    title={`PDF preview ${slot + 1}`}
                    className={cn(
                        'absolute inset-0 h-full w-full border-0',
                        visible === slot && ready
                            ? 'opacity-100'
                            : 'pointer-events-none opacity-0'
                    )}
                />
            ))}

            {error && (
                <div className="absolute inset-x-6 bottom-6 rounded-md border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
                    Could not render the PDF — try another font.
                </div>
            )}

            {!ready && !error && (
                <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                    Rendering PDF…
                </div>
            )}
        </div>
    )
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
    document,
    fileName,
    stale,
    onExportWord,
    className,
}) =>
    document ? (
        <BlobProvider document={document}>
            {({ blob, loading, error }) => (
                <PdfFrames
                    blob={blob}
                    busy={loading || stale}
                    error={error}
                    fileName={fileName}
                    onExportWord={onExportWord}
                    className={className}
                />
            )}
        </BlobProvider>
    ) : (
        <PdfFrames
            blob={null}
            busy
            fileName={fileName}
            onExportWord={onExportWord}
            className={className}
        />
    )
