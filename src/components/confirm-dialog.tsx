'use client'

import React, { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
    open: boolean
    title: string
    description: string
    confirmLabel: string
    onConfirm: () => void
    onCancel: () => void
}

/**
 * Native <dialog>: focus trapping, Escape and the backdrop come for free, and
 * it never blocks the main thread the way window.confirm does.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    description,
    confirmLabel,
    onConfirm,
    onCancel,
}) => {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    return (
        <dialog
            ref={dialogRef}
            onClose={onCancel}
            aria-labelledby="confirm-title"
            className="m-auto w-[min(21rem,calc(100vw-2rem))] rounded-lg border border-border bg-background p-5 text-foreground shadow-lg backdrop:bg-foreground/20"
        >
            <h2 id="confirm-title" className="text-sm font-medium text-balance">
                {title}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {description}
            </p>
            <div className="mt-5 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-7 rounded-md border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    autoFocus
                    onClick={onConfirm}
                    className="h-7 rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                    {confirmLabel}
                </button>
            </div>
        </dialog>
    )
}
