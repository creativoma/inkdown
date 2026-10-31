# Changelog

All notable changes to Inkdown are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-10-31

### Added

- Word export: the document can be downloaded as an editable `.docx`, ready to
  upload to Google Drive and edit in Google Docs. It keeps headings, bold,
  italic, links, lists, blockquotes, tables, horizontal rules, pasted images,
  the logo, the page note, font sizes and margins. PDF base-14 faces map to
  Arial, Times New Roman and Courier New.

### Changed

- The Download button is now a menu with `.pdf` and `.docx`. `⌘/Ctrl + S` still
  downloads the PDF.
- Downloaded files are named after the document title, the first `#` heading,
  instead of the first heading of any level. Documents without a `#` heading
  fall back to their first `##` or `###`.
- The file name is no longer shown next to the Download button; only
  "Updating…" appears while the preview re-renders.
- Updated dependencies (Next.js 16.4, React 19.3.1, ESLint 10).

## [0.2.0] - 2026-10-04

### Added

- Paste images from the clipboard into the editor; they are stored with the
  draft and referenced as `image:<id>`.
- Links, both `[text](url)` and bare URLs, are clickable in the PDF, with a
  configurable link color.
- Logo size setting.

### Changed

- Logos in WebP, GIF, SVG and other formats are converted to PNG so the PDF
  can embed them.
- A list item or table row is never split across two pages.

## [0.1.0] - 2026-08-25

### Added

- Live Markdown to PDF preview that does not flash while typing.
- Headings balanced with the renderer's own font metrics.
- Bundled open-source fonts and local system fonts.
- Settings sidebar for fonts, sizes, page margins, a logo and a page note.
- Draft, settings and images saved in the browser.

[0.3.0]: https://github.com/creativoma/inkdown/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/creativoma/inkdown/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/creativoma/inkdown/releases/tag/v0.1.0
