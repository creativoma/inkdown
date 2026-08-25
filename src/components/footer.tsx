import React from 'react'
import { siteConfig } from '@/lib/site'

const linkClass =
    'text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline'

const Separator = () => (
    <span aria-hidden className="text-border">
        ·
    </span>
)

export const Footer = () => (
    <footer className="flex h-9 w-full min-w-0 shrink-0 items-center justify-center gap-2 overflow-x-auto border-t border-border px-4 text-xs whitespace-nowrap text-muted-foreground">
        <span className="font-medium text-foreground">{siteConfig.name}</span>
        <Separator />
        <a
            className={linkClass}
            href={siteConfig.license.url}
            target="_blank"
            rel="noreferrer"
        >
            MIT
        </a>
        <Separator />
        <a
            className={linkClass}
            href={siteConfig.repo}
            target="_blank"
            rel="noreferrer"
        >
            Source
        </a>
        <Separator />
        <a
            className={linkClass}
            href={siteConfig.sponsor}
            target="_blank"
            rel="noreferrer"
        >
            Sponsor
        </a>
        <Separator />
        Build by
        <a
            className={linkClass}
            href={siteConfig.author.github}
            target="_blank"
            rel="noreferrer"
        >
            @{siteConfig.author.handle}
        </a>
    </footer>
)
