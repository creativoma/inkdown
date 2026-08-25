import { DocumentSettings } from '@/components/pdf/types'

const STORAGE_KEY = 'inkdown:draft:v1'

export interface PersistedState {
    markdown: string
    settings: DocumentSettings
}

export function loadDraft(): PersistedState | null {
    if (typeof window === 'undefined') return null

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return null

        const parsed = JSON.parse(raw) as Partial<PersistedState>
        if (typeof parsed.markdown !== 'string' || !parsed.settings) return null

        return { markdown: parsed.markdown, settings: parsed.settings }
    } catch {
        return null
    }
}

export function saveDraft(state: PersistedState): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
        // Quota exceeded (a large logo, usually): keep working without saving.
    }
}

export function clearDraft(): void {
    try {
        window.localStorage.removeItem(STORAGE_KEY)
    } catch {
        // Nothing to do if storage is unavailable.
    }
}
