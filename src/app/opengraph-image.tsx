import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`

export default function OpenGraphImage() {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#ffffff',
                color: '#0a0a0a',
                padding: 80,
                fontFamily: 'Helvetica, sans-serif',
            }}
        >
            <div style={{ display: 'flex', fontSize: 28, letterSpacing: 2 }}>
                {siteConfig.name.toUpperCase()}
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                }}
            >
                <div style={{ display: 'flex', fontSize: 96, lineHeight: 1 }}>
                    Markdown to PDF
                </div>
                <div
                    style={{
                        display: 'flex',
                        fontSize: 34,
                        color: '#737373',
                    }}
                >
                    Write Markdown, get a clean PDF. Live preview, free and open
                    source.
                </div>
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 26,
                    color: '#737373',
                }}
            >
                <span>{siteConfig.url.replace('https://', '')}</span>
                <span>MIT · @{siteConfig.author.handle}</span>
            </div>
        </div>,
        size
    )
}
