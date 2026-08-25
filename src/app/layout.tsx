import type { Metadata, Viewport } from 'next'
import { siteConfig } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: `${siteConfig.name} — ${siteConfig.tagline}`,
        template: `%s — ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    keywords: [...siteConfig.keywords],
    category: 'productivity',
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.site }],
    creator: siteConfig.author.name,
    publisher: siteConfig.author.name,
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        url: siteConfig.url,
        siteName: siteConfig.name,
        title: `${siteConfig.name} — ${siteConfig.tagline}`,
        description: siteConfig.description,
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: `${siteConfig.name} — ${siteConfig.tagline}`,
        description: siteConfig.description,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    ],
    colorScheme: 'light',
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    license: siteConfig.license.url,
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
    },
    author: {
        '@type': 'Person',
        name: siteConfig.author.name,
        url: siteConfig.author.site,
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                {children}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </body>
        </html>
    )
}
