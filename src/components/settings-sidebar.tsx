'use client'

import React, { useRef } from 'react'
import { DocumentSettings, FontFamily } from '@/components/pdf/types'
import { FontOption } from '@/lib/fonts'
import { cn } from '@/lib/utils'

const MARGIN_PRESETS: {
    label: string
    top: number
    bottom: number
    horizontal: number
}[] = [
    { label: 'Compact', top: 40, bottom: 40, horizontal: 40 },
    { label: 'Default', top: 64, bottom: 64, horizontal: 60 },
    { label: 'Wide', top: 80, bottom: 80, horizontal: 90 },
]

const FONT_GROUPS: { kind: FontOption['kind']; label: string }[] = [
    { kind: 'standard', label: 'Standard' },
    { kind: 'bundled', label: 'Bundled' },
    { kind: 'local', label: 'Installed on this computer' },
]

export type LocalFontsStatus =
    'unsupported' | 'idle' | 'loading' | 'ready' | 'error'

interface SettingsSidebarProps {
    settings: DocumentSettings
    onChange: (settings: DocumentSettings) => void
    onReset: () => void
    fonts: FontOption[]
    localFontsStatus: LocalFontsStatus
    onLoadLocalFonts: () => void
    className?: string
}

const label = 'text-[11px] text-muted-foreground'
const control =
    'h-7 rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring'
const selectClass = `${control} w-full`
const numberClass = `${control} w-16 text-right tabular-nums`

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
}) => (
    <section className="flex flex-col gap-2.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
        <h3 className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground/70 uppercase">
            {title}
        </h3>
        {children}
    </section>
)

const Row: React.FC<{
    htmlFor?: string
    label: string
    children: React.ReactNode
}> = ({ htmlFor, label: text, children }) => (
    <div className="flex items-center justify-between gap-2">
        <label className={label} htmlFor={htmlFor}>
            {text}
        </label>
        {children}
    </div>
)

interface NumberFieldProps {
    id: string
    label: string
    value: number
    min: number
    max: number
    step?: number
    onCommit: (value: number) => void
}

/**
 * Clamps on blur rather than on change, so typing "20" over a min of 14 does not
 * snap after the first keystroke.
 */
const NumberField: React.FC<NumberFieldProps> = ({
    id,
    label: text,
    value,
    min,
    max,
    step,
    onCommit,
}) => (
    <Row htmlFor={id} label={text}>
        <input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            className={numberClass}
            value={value}
            onChange={(e) => {
                const next = Number(e.target.value)
                if (e.target.value === '' || Number.isNaN(next)) return
                onCommit(next)
            }}
            onBlur={(e) => {
                const next = Number(e.target.value)
                onCommit(
                    Number.isNaN(next)
                        ? min
                        : Math.min(max, Math.max(min, next))
                )
            }}
        />
    </Row>
)

const FontSelect: React.FC<{
    id: string
    label: string
    value: FontFamily
    fonts: FontOption[]
    onChange: (value: FontFamily) => void
}> = ({ id, label: text, value, fonts, onChange }) => (
    <div className="flex flex-col gap-1.5">
        <label className={label} htmlFor={id}>
            {text}
        </label>
        <select
            id={id}
            className={selectClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {FONT_GROUPS.map((group) => {
                const options = fonts.filter((font) => font.kind === group.kind)
                if (options.length === 0) return null

                return (
                    <optgroup key={group.kind} label={group.label}>
                        {options.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label}
                            </option>
                        ))}
                    </optgroup>
                )
            })}
        </select>
    </div>
)

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
    settings,
    onChange,
    onReset,
    fonts,
    localFontsStatus,
    onLoadLocalFonts,
    className,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const update = (patch: Partial<DocumentSettings>) =>
        onChange({ ...settings, ...patch })

    const rasterizeSvgText = (svgText: string): Promise<string> => {
        const normalized = /xmlns\s*=/.test(svgText)
            ? svgText
            : svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')

        return new Promise((resolve, reject) => {
            const blob = new Blob([normalized], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(blob)
            const scale = 3

            const img = new window.Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = (img.naturalWidth || 300) * scale
                canvas.height = (img.naturalHeight || 150) * scale
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    URL.revokeObjectURL(url)
                    reject(new Error('Canvas not supported'))
                    return
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                URL.revokeObjectURL(url)
                resolve(canvas.toDataURL('image/png'))
            }
            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Could not load SVG'))
            }
            img.src = url
        })
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const isSvg =
            file.type === 'image/svg+xml' ||
            file.name.toLowerCase().endsWith('.svg')

        const reader = new FileReader()
        if (isSvg) {
            reader.onload = async () => {
                try {
                    const logo = await rasterizeSvgText(reader.result as string)
                    update({ logo })
                } catch {
                    // Ignore malformed SVG uploads and keep the previous logo.
                }
            }
            reader.readAsText(file)
        } else {
            reader.onload = () => update({ logo: reader.result as string })
            reader.readAsDataURL(file)
        }
    }

    const activePreset = MARGIN_PRESETS.find(
        (preset) =>
            preset.top === settings.marginTop &&
            preset.bottom === settings.marginBottom &&
            preset.horizontal === settings.marginHorizontal
    )

    const localFontsLabel: Record<LocalFontsStatus, string> = {
        unsupported: 'Installed fonts need Chrome or Edge',
        idle: 'Use fonts installed on this computer',
        loading: 'Reading installed fonts…',
        ready: 'Installed fonts added',
        error: 'Could not read installed fonts — retry',
    }

    return (
        <div
            className={cn(
                'flex flex-col gap-4 overflow-y-auto border-r border-border px-4 py-5',
                className
            )}
        >
            <Section title="Document">
                <div className="flex flex-col gap-1.5">
                    <label className={label}>Logo</label>
                    {settings.logo ? (
                        <div className="flex items-center gap-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={settings.logo}
                                alt="Logo preview"
                                className="h-8 max-w-24 object-contain"
                            />
                            <button
                                type="button"
                                onClick={() => update({ logo: null })}
                                className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-7 rounded-md border border-dashed border-input px-2 text-left text-[11px] text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                        >
                            Upload image
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className={label} htmlFor="note">
                        Page note
                    </label>
                    <textarea
                        id="note"
                        rows={2}
                        value={settings.note}
                        onChange={(e) => update({ note: e.target.value })}
                        placeholder="Shown at the bottom of every page"
                        className="w-full resize-none rounded-md border border-input bg-transparent px-2 py-1.5 text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                    />
                </div>
            </Section>

            <Section title="Typography">
                <FontSelect
                    id="titleFont"
                    label="Title"
                    value={settings.titleFont}
                    fonts={fonts}
                    onChange={(titleFont) => update({ titleFont })}
                />
                <NumberField
                    id="titleSize"
                    label="Title size"
                    value={settings.titleSize}
                    min={14}
                    max={40}
                    onCommit={(titleSize) => update({ titleSize })}
                />
                <FontSelect
                    id="bodyFont"
                    label="Body"
                    value={settings.bodyFont}
                    fonts={fonts}
                    onChange={(bodyFont) => update({ bodyFont })}
                />
                <NumberField
                    id="bodySize"
                    label="Body size"
                    value={settings.bodySize}
                    min={8}
                    max={16}
                    step={0.5}
                    onCommit={(bodySize) => update({ bodySize })}
                />
                <button
                    type="button"
                    onClick={onLoadLocalFonts}
                    disabled={
                        localFontsStatus === 'unsupported' ||
                        localFontsStatus === 'loading' ||
                        localFontsStatus === 'ready'
                    }
                    className="self-start text-left text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:no-underline disabled:hover:text-muted-foreground"
                >
                    {localFontsLabel[localFontsStatus]}
                </button>
            </Section>

            <Section title="Page">
                <div className="flex gap-1">
                    {MARGIN_PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            aria-pressed={activePreset?.label === preset.label}
                            onClick={() =>
                                update({
                                    marginTop: preset.top,
                                    marginBottom: preset.bottom,
                                    marginHorizontal: preset.horizontal,
                                })
                            }
                            className={cn(
                                'h-7 flex-1 rounded-md border border-input text-[11px] transition-colors hover:text-foreground',
                                activePreset?.label === preset.label
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                <NumberField
                    id="marginTop"
                    label="Margin top"
                    value={settings.marginTop}
                    min={0}
                    max={150}
                    onCommit={(marginTop) => update({ marginTop })}
                />
                <NumberField
                    id="marginBottom"
                    label="Margin bottom"
                    value={settings.marginBottom}
                    min={0}
                    max={150}
                    onCommit={(marginBottom) => update({ marginBottom })}
                />
                <NumberField
                    id="marginHorizontal"
                    label="Margin sides"
                    value={settings.marginHorizontal}
                    min={0}
                    max={150}
                    onCommit={(marginHorizontal) =>
                        update({ marginHorizontal })
                    }
                />
            </Section>

            <button
                type="button"
                onClick={onReset}
                className="mt-auto self-start pt-2 text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
                Reset document
            </button>
        </div>
    )
}
