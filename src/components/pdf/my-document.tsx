'use client'

import React from 'react'
import { Page, Text, View, Image, Document } from '@react-pdf/renderer'
import type { StyleProp } from '@react-pdf/types'
import { styles } from '@/components/pdf/styles'
import { MyDocumentArgs } from '@/components/pdf/types'
import { parseMarkdown, InlineSpan } from '@/lib/markdown'
import { headingKey } from '@/lib/balance'

const BOLD = { fontWeight: 700 } as const
const ITALIC = { fontStyle: 'italic' } as const

const renderSpans = (spans: InlineSpan[]) =>
    spans.map((span, index) => {
        const spanStyles: StyleProp = []
        if (span.bold) spanStyles.push(BOLD)
        if (span.italic) spanStyles.push(ITALIC)

        return (
            <Text key={index} style={spanStyles}>
                {span.text}
            </Text>
        )
    })

const MyDocument: React.FC<{ args: MyDocumentArgs }> = ({ args }) => {
    const { markdown, settings, balancedHeadings } = args
    const blocks = parseMarkdown(markdown)
    const firstHeading = blocks.find((block) => block.type === 'heading')
    const title =
        firstHeading && firstHeading.type === 'heading'
            ? firstHeading.spans.map((span) => span.text).join('')
            : 'Document'

    const { titleFont, bodyFont, titleSize, bodySize } = settings

    const headingBase = (level: 1 | 2 | 3): StyleProp => {
        const size =
            level === 1
                ? titleSize
                : level === 2
                  ? titleSize * 0.72
                  : titleSize * 0.58
        return [
            { fontFamily: titleFont, fontWeight: 700, fontSize: size },
            level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3,
        ]
    }

    const bodyBase: StyleProp = [{ fontSize: bodySize }]

    const note = settings.note.trim()
    const noteSize = Math.max(6.5, bodySize * 0.68)

    return (
        <Document title={title}>
            <Page
                style={[
                    styles.body,
                    {
                        fontFamily: bodyFont,
                        paddingTop: settings.marginTop,
                        paddingBottom: settings.marginBottom,
                        paddingHorizontal: settings.marginHorizontal,
                    },
                ]}
            >
                {note !== '' && (
                    <Text
                        fixed
                        style={[
                            styles.footerNote,
                            {
                                fontSize: noteSize,
                                left: settings.marginHorizontal,
                                right: settings.marginHorizontal,
                                bottom: Math.max(
                                    16,
                                    settings.marginBottom / 2 - noteSize
                                ),
                            },
                        ]}
                    >
                        {note}
                    </Text>
                )}
                {settings.logo && (
                    // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
                    <Image src={settings.logo} style={styles.logo} />
                )}
                {blocks.map((block, index) => {
                    switch (block.type) {
                        case 'heading': {
                            // A single-span heading can be replaced by its
                            // balanced version; mixed styles render as-is.
                            const balanced =
                                block.spans.length === 1
                                    ? balancedHeadings?.[
                                          headingKey(
                                              block.level,
                                              block.spans[0].text
                                          )
                                      ]
                                    : undefined

                            return (
                                <Text
                                    key={index}
                                    style={headingBase(block.level)}
                                >
                                    {balanced ?? renderSpans(block.spans)}
                                </Text>
                            )
                        }
                        case 'paragraph':
                            return (
                                <Text
                                    key={index}
                                    style={[...bodyBase, styles.paragraph]}
                                >
                                    {renderSpans(block.spans)}
                                </Text>
                            )
                        case 'list':
                            return (
                                <View key={index} style={styles.list}>
                                    {block.items.map((item, itemIndex) => (
                                        <View
                                            key={itemIndex}
                                            style={styles.listItem}
                                        >
                                            <Text
                                                style={[
                                                    ...bodyBase,
                                                    styles.bullet,
                                                ]}
                                            >
                                                {block.ordered
                                                    ? `${itemIndex + 1}.`
                                                    : '—'}
                                            </Text>
                                            <Text
                                                style={[
                                                    ...bodyBase,
                                                    styles.listItemText,
                                                ]}
                                            >
                                                {renderSpans(item)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )
                        case 'blockquote':
                            return (
                                <View key={index} style={styles.blockquote}>
                                    <Text
                                        style={[
                                            {
                                                fontStyle: 'italic',
                                                fontSize: bodySize,
                                            },
                                            styles.blockquoteText,
                                        ]}
                                    >
                                        {renderSpans(block.spans)}
                                    </Text>
                                </View>
                            )
                        case 'table':
                            return (
                                <View key={index} style={styles.table}>
                                    <View style={styles.tableRow}>
                                        {block.header.map((cell, cellIndex) => (
                                            <Text
                                                key={cellIndex}
                                                style={[
                                                    {
                                                        fontWeight: 700,
                                                        fontSize:
                                                            bodySize * 0.9,
                                                    },
                                                    styles.tableHeaderCell,
                                                ]}
                                            >
                                                {renderSpans(cell)}
                                            </Text>
                                        ))}
                                    </View>
                                    {block.rows.map((row, rowIndex) => (
                                        <View
                                            key={rowIndex}
                                            style={styles.tableRow}
                                        >
                                            {row.map((cell, cellIndex) => (
                                                <Text
                                                    key={cellIndex}
                                                    style={[
                                                        {
                                                            fontSize:
                                                                bodySize * 0.9,
                                                        },
                                                        styles.tableCell,
                                                    ]}
                                                >
                                                    {renderSpans(cell)}
                                                </Text>
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            )
                        case 'hr':
                            return <View key={index} style={styles.hr} />
                        default:
                            return null
                    }
                })}
            </Page>
        </Document>
    )
}

export default MyDocument
