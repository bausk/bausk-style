# Reading: blog, articles, papers on the web

Mode: the reader is here to understand something. Typography and structure are the design.

## Page anatomy

- `bs-header`: name (not a logo) and affiliation; nav with the current item marked; EN/UK switch.
- Article head: `bs-article__title` → `bs-article__standfirst` (one or two sentences that say what
  the reader gets) → `bs-meta` (author, affiliation, date, DOI, language, licence) → figure.
- Body: `bs-prose` inside `--bs-measure-text`; figures may go to `--bs-measure-wide`.
- End matter: citation (DSTU 8302 on Ukrainian pages, APA 7 on English), DOI, licence, keywords, the
  other-language version.
- Lists of work: `bs-section-head` + `bs-entries` (date column, title, excerpt, meta line).

## Rules that matter most here

`measure`, `bilingual-parity`, `numbers-are-data`, `units-and-sources`, `copy-voice`, `name-spelling`.

## Specifics

- Figures are numbered (Fig. 2 / Рис. 2), captioned with what, unit and source, and referred to in the text.
- Code blocks use `--bs-font-mono` on `--bs-bg-subtle`; keep lines under ~80 characters.
- Scholarly metadata (Highwire `citation_*` tags, `hreflang` pairs) is part of the page, not optional.
- Print styles: hide navigation, show link URLs, keep figures with captions.
- The Ghost theme (publishing-org/ghosttheme) uses the `folio` look today; moving it to the brand
  default is a one-line import change plus a review of the signature components (`bs-meta`).
