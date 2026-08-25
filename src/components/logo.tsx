import React from 'react'
import { cn } from '@/lib/utils'

/** The ink drop from the favicon, tinted with the current theme. */
export const Logo: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 32 32"
        aria-hidden
        className={cn('h-5 w-5 shrink-0', className)}
    >
        <rect width="32" height="32" rx="7" className="fill-foreground" />
        <path
            d="M16 6c0 0 7.5 8 7.5 13a7.5 7.5 0 1 1-15 0C8.5 14 16 6 16 6Z"
            className="fill-background"
        />
    </svg>
)
