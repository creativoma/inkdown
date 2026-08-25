import packageJson from '../../package.json'

export const siteConfig = {
    name: 'Inkdown',
    tagline: 'Markdown to PDF, live',
    version: packageJson.version,
    description:
        'Write Markdown and get a clean, typeset PDF instantly. Live preview, custom fonts, margins and logo. Free, open source, and fully local — your documents never leave the browser.',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inkdown-nine.vercel.app',
    repo: 'https://github.com/creativoma/inkdown',
    sponsor: 'https://github.com/sponsors/creativoma',
    license: {
        name: 'MIT',
        url: 'https://github.com/creativoma/inkdown/blob/main/LICENSE',
    },
    author: {
        name: 'Mariano Alvarez',
        handle: 'creativoma',
        site: 'https://marianoalvarez.dev/',
        github: 'https://github.com/creativoma',
    },
    keywords: [
        'markdown to pdf',
        'markdown pdf converter',
        'markdown editor',
        'pdf generator',
        'invoice generator',
        'quote generator',
        'document generator',
        'open source',
        'free',
    ],
} as const
