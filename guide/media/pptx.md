# PowerPoint (.pptx / .potx)

For decks that colleagues edit in Office. Planned for 0.2, after the look is chosen.

What the template will contain:

- Theme colours: Dark 1/Light 1 = `fg`/`bg`, Dark 2/Light 2 = `fg-muted`/`bg-subtle`,
  Accent 1 = `accent`, Accents 2–6 = `viz-2`…`viz-6`, hyperlink = `accent`.
- Theme fonts: headings = the look's display face, body = text face (installed TTF/OTF; PowerPoint
  cannot use web fonts, so the template ships the TTFs and a note to install them, or embeds them).
- Layouts: title, section, title + content, two content, figure + caption, quote, closing; each with
  the look's footer (course · lecture · n / N) as placeholders.
- No shapes with shadows, gradients or rounded corners in any layout.

Rules for editing in PowerPoint: use the layouts, not free text boxes; paste figures exported with
`bausk_style` (`medium="slide"`); keep the theme fonts.
