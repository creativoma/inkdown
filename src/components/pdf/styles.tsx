import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
    body: {
        color: '#1a1a1a',
    },
    logo: {
        maxWidth: 120,
        maxHeight: 60,
        objectFit: 'contain',
        marginBottom: 24,
    },
    footerNote: {
        position: 'absolute',
        textAlign: 'center',
        color: '#9a9a9a',
    },
    h1: {
        marginBottom: 16,
    },
    h2: {
        marginTop: 8,
        marginBottom: 10,
    },
    h3: {
        marginTop: 6,
        marginBottom: 8,
    },
    paragraph: {
        lineHeight: 1.6,
        marginBottom: 14,
        color: '#2a2a2a',
    },
    list: {
        marginBottom: 14,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    bullet: {
        width: 16,
        color: '#2a2a2a',
    },
    listItemText: {
        flex: 1,
        lineHeight: 1.6,
        color: '#2a2a2a',
    },
    hr: {
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        marginVertical: 18,
    },
    blockquote: {
        borderLeftWidth: 2,
        borderLeftColor: '#d4d4d4',
        paddingLeft: 14,
        marginBottom: 14,
    },
    blockquoteText: {
        lineHeight: 1.6,
        color: '#5a5a5a',
    },
    table: {
        marginBottom: 14,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    tableCell: {
        flex: 1,
        lineHeight: 1.5,
        color: '#2a2a2a',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    tableHeaderCell: {
        flex: 1,
        lineHeight: 1.5,
        color: '#1a1a1a',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
})
