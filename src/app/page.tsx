'use client'

import dynamic from 'next/dynamic'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'

// The editor owns browser-only state (localStorage draft, PDF renderer), so it
// never renders on the server.
const Editor = dynamic(
    () => import('@/components/editor').then((mod) => mod.Editor),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                Loading editor…
            </div>
        ),
    }
)

export default function Page() {
    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <Header />
            <Editor />
            <Footer />
        </div>
    )
}
