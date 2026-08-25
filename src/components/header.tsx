import React from 'react'
import { Logo } from '@/components/logo'
import { siteConfig } from '@/lib/site'

export const Header = () => (
    <header className="flex h-11 w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
            <Logo />
            <h1 className="truncate text-sm font-medium tracking-tight text-foreground">
                {siteConfig.name}
            </h1>
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                — {siteConfig.tagline}
            </span>
        </div>
        <a
            href={`${siteConfig.repo}/releases`}
            target="_blank"
            rel="noreferrer"
            title="Release notes"
            className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground transition-colors hover:text-foreground"
        >
            v{siteConfig.version}
        </a>
    </header>
)
