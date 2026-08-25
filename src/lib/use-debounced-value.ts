'use client'

import { useEffect, useState } from 'react'

/**
 * Keeps the PDF render off the typing path: the value only propagates once the
 * user pauses for `delay` ms.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const timeout = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timeout)
    }, [value, delay])

    return debounced
}
