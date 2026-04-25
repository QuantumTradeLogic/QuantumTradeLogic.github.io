# Perma Holdings LLC — Website

Static site for [permaholdings.com](https://permaholdings.com), hosted on GitHub Pages.

Pure HTML/CSS/JS — no build step, no framework, no dependencies.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Run tests

```bash
node test.js
```

Covers: file existence, per-page HTML structure, internal link integrity, CSS `@import` chain, nav consistency across all pages, and Formspree placeholder detection. Run after any content change.

## Structure

```
/
├── index.html          Homepage
├── about.html          About the Firm
├── approach.html       Investment Approach
├── portfolio.html      Portfolio & Holdings
├── contact.html        Contact (Formspree form: mpqkbdzb)
├── 404.html            Error page
├── test.js             Integrity test suite
├── assets/
│   ├── css/
│   │   ├── main.css            @import entry point
│   │   ├── _variables.css      Design tokens (colors, type, spacing)
│   │   ├── _reset.css
│   │   ├── _typography.css
│   │   ├── _layout.css
│   │   ├── _components.css     Header, footer, nav, buttons, cards
│   │   └── _pages.css          Page-specific styles
│   ├── js/main.js              Scroll-aware header, mobile nav, scroll reveal
│   └── images/
│       ├── favicon.svg
│       ├── og-image.png        Social card (2400×1260)
│       └── og-image.html       Source template to regenerate og-image.png
```

## Making changes

**Content** — edit the relevant `.html` file directly, then run `node test.js`.

**Design tokens** (colors, fonts, spacing) — edit `assets/css/_variables.css`. Changes cascade site-wide.

**Navigation** — the `<ul class="nav-list">` block is copy-pasted across all six pages. Update all of them, then run `node test.js` — the nav consistency check will catch any mismatch.

**Adding a new page** — create the `.html` file, add it to the nav on every existing page, and add it to the `pages` array at the top of `test.js`.

## Regenerating the social card (og-image.png)

1. Open `assets/images/og-image.html` in Chrome
2. DevTools → Toggle device toolbar → set to **1200 × 630**
3. `Cmd+Shift+P` → "Capture screenshot"
4. Save output as `assets/images/og-image.png` and commit

Chrome captures at 2× on retina screens, producing a 2400×1260 file — that's correct.

## Contact form

Handled by [Formspree](https://formspree.io) (form ID `mpqkbdzb`). No backend required. Configure email notifications and spam filtering in the Formspree dashboard.
