# indedomum.nl

Personal website of Tim Bolhoeve, full-stack software engineer. A single-page about / CV site, hosted on GitHub Pages at <https://indedomum.nl>.

Plain HTML, CSS and JavaScript: no framework, no build step, no dependencies to install.

## Sections

| Anchor | Content |
| --- | --- |
| `#top` | Hero with name, role and location (Obdam) |
| `#about` | Background, learning path and certificates |
| `#approach` | How I work |
| `#work` | Capabilities: integrations, low-code, Python/Django, full-stack |
| `#contact` | Email and social links |

## Hidden terminal

The site has an easter egg: a terminal with three mini games.

- **Open it** with the backtick key (`` ` ``), the arrow sequence ↑↑↓↓←→←→, or by tapping the faint arrow hint in the footer (for phones).
- **Commands:** `help`, `whoami`, `ls`, `cat`, `play <game>`, `scores`, `sudo hire-tim`, `clear`, `exit`. Tab completes, ↑/↓ browse history, Esc closes.
- **Games:**
  - `play orbit`: Orbit Switch, switch rings to dodge the triangles.
  - `play packet`: Packet Route, rotate tiles to connect two systems.
  - `play truck`: Load the Truck, pack the trailer before it departs.
- **Loaded on demand:** `terminal.js` and `terminal.css` are only fetched when the terminal is opened, so normal visits stay light.
- **High scores** are stored in the visitor's own browser (`localStorage`, key `indedomum-terminal-scores`).

## Structure

```text
index.html                  the whole page
CNAME                       custom domain for GitHub Pages
assets/
  css/personal.css          page styles
  css/terminal.css          terminal and game styles (lazy-loaded)
  js/personal.js            mobile menu, footer year, hero effect, terminal triggers
  js/terminal.js            terminal, commands and the three games (lazy-loaded)
  img/black_on_transparent.png   logo, header
  img/white_on_transparent.png   logo, footer
  img/persoon.webp          portrait
  img/favicon.png, favicon-32.png, apple-touch-icon.png   browser and home-screen icons
  img/social-preview.jpg    1200×630 image for link previews (LinkedIn, WhatsApp)
```

External resources, loaded from CDNs: Google Fonts (Space Grotesk, DM Mono) and Font Awesome 6.7.2 for icons.

## Running locally

Open `index.html` in a browser. That's enough, including the terminal.

To test it served over HTTP the way GitHub Pages does:

```powershell
python -m http.server 8000
# then open http://localhost:8000
```

## Making changes

1. Edit the files.
2. Check the page locally on both a wide and a narrow (phone-sized) window.
3. Commit and push to `main`. GitHub Pages republishes within a minute or two.

Browsers cache favicons hard. If an icon change doesn't show, close the tab and reopen the site. LinkedIn caches link previews too; its Post Inspector refreshes them.

### Notes

- **Text in the terminal:** `about.txt` and `skills.txt` live in the `FILES` object near the top of `assets/js/terminal.js`. Update them alongside the page when your experience changes.
- **Images:** keep them small. The portrait is WebP; convert new photos before adding them.
- **Backtick on US-International keyboards:** there the backtick is a dead key. The terminal input strips stray backticks so the first command still works.
