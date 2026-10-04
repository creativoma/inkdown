/** Prefix used in the markdown to reference an image stored with the draft. */
export const IMAGE_REF_PREFIX = 'image:'

/** react-pdf only decodes PNG and JPEG. */
export const isPdfReadyImage = (dataUrl: string) =>
    /^data:image\/(png|jpe?g);/i.test(dataUrl)

const readAsDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
    })

const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Could not load image'))
        img.src = src
    })

interface ConvertOptions {
    /** Longest side in pixels; larger images are scaled down. */
    maxSize?: number
    /** Upscale factor for vector sources so they stay sharp in the PDF. */
    vectorScale?: number
}

/**
 * Re-encodes any image the browser can decode (WebP, GIF, AVIF, SVG…) into a
 * PNG data URL react-pdf can embed. PNG and JPEG within the size limit are
 * returned untouched.
 */
export async function toPdfImage(
    source: Blob | string,
    { maxSize = Infinity, vectorScale = 3 }: ConvertOptions = {}
): Promise<string> {
    const dataUrl =
        typeof source === 'string' ? source : await readAsDataUrl(source)

    const isSvg = /^data:image\/svg\+xml/i.test(dataUrl)
    const img = await loadImage(dataUrl)

    const scale = isSvg ? vectorScale : 1
    let width = (img.naturalWidth || 300) * scale
    let height = (img.naturalHeight || 150) * scale

    const fits = Math.max(width, height) <= maxSize
    if (isPdfReadyImage(dataUrl) && fits) return dataUrl

    if (!fits) {
        const ratio = maxSize / Math.max(width, height)
        width *= ratio
        height *= ratio
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width)
    canvas.height = Math.round(height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
}

export const createImageId = () => Math.random().toString(36).slice(2, 10)
