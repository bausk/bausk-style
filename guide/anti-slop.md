# Anti-slop

What machine-made design and copy look like in 2026, and what to do instead. Most items are
caught by `bausk-style check` or by `npx impeccable detect`; the rest need your eyes.

## The trap of the "tasteful default"

Avoiding the obvious tells (purple gradients, Inter, emoji) pushes models into a second set of
defaults that are now just as recognisable: (1) warm cream paper (near `#F4F1EA`) with a high-contrast
serif and a terracotta accent; (2) near-black with one acid-green or vermilion accent; (3) a
broadsheet layout with hairlines, zero radius and dense columns. Anthropic's own frontend-design
skill names these three. bausk.dev's 2026 theme (the `folio` look) sits in the first one, which
is why it is legacy.

So "not slop" is not a list of bans. It is a specific reference followed consistently. The looks
provide that reference; keep to it.

## Visual tells

| Tell | Instead |
|---|---|
| Purple, blue-violet or rainbow gradients; gradient text | Ink and the look's single accent |
| Inter, Poppins, Montserrat, DM Sans, Geist, Lora by default | The look's fonts |
| Cards everywhere: icon + heading + two lines, three across | Lists with lines, tables, or plain sections |
| Cards inside cards; a 1px border plus a soft shadow ("ghost card") | One surface; separate by space and lines |
| `rounded-2xl`, pills, circles behind icons | The look's radius (square in all current looks) |
| Soft shadows, glows, glass (`backdrop-blur`) | Nothing; or `bg-subtle` / `line-strong` |
| Hero with a giant number, a small label and "trusted by" logos | The most characteristic real thing: the article, the chart, the demo |
| Kicker/eyebrow above every heading; "01 / 02 / 03" section numbers | Let the heading speak; number only real sequences |
| A thick coloured stripe on the left of callouts and list items | Background `bg-subtle` or a label |
| Emoji as icons or bullets | One SVG icon set, or words |
| Every section fades or slides in on scroll | No entrance motion; respond to the user only |
| Monospace headings to look "technical" | Mono for code and measurements only |
| Dark mode because it is "a dashboard" | Choose the scheme from where it is used; offer both |
| Decorative blobs, grain, grid-paper or contour backgrounds | Plain surfaces; texture only if it is the content (a real map) |
| Placeholder stats, fake testimonials, lorem ipsum | Real content or "sample data" |

## Copy tells

| Tell | Instead |
|---|---|
| "Seamless", "elevate", "unlock", "empower", "cutting-edge", "game-changer", "robust and scalable" | The concrete effect with a number |
| «безшовний», «інноваційне рішення», «передові технології», «революційний» | Конкретика: що саме і наскільки |
| "In today's fast-paced world…", «У сучасному світі…» | Start with the point |
| "It's not just X, it's Y", «не просто X, а Y» | Say Y |
| "plays a crucial role", «відіграє ключову роль» | Say what it does |
| «Варто зазначити», «важливо підкреслити» | Just say it |
| Triads of adjectives; every paragraph the same length; a closing summary that repeats the text | Vary rhythm; stop when done |
| Headings phrased as questions in every section ("Why does it matter?") | Headings that state the content |
| Exclamation marks and hype in UI; "Oops!" errors | What happened and what to do |
| Em dash in every sentence | A full stop, a colon or a comma; in Ukrainian the spaced dash where grammar asks for it |

## A quick self-test

Show the screen to yourself as a stranger would see it. If the first thought is "a template" or
"an AI made this", find the element that triggers it and replace it with something from the look's
reference object or from the content itself. Then remove one more ornament.

<!-- bausk-style-ignore-file: this page quotes the banned phrases on purpose -->
