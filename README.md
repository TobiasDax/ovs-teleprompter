# Teleprompter

A lightweight, offline teleprompter for TV and video productions. Drop in a `.docx` script file and read it full-screen — no server, no build step, no internet required.  
This is meant for any usecase that requires a manually scrolled text instead of the automatic scrolling used in many professional teleprompter tools.   

Writing the script in Word is a concession towards our non-technical staff and their needs for content production, having a manually scrolled teleprompter is needed to keep in sync with the experiments and interactions our videos contain.  

We had a similar solution implemented as a theme for Wordpress but updates, security concerns and usability led us to the creation of this solution.

## What it does

The tool reads a structured Word document containing a production script table and renders it as a scrollable teleprompter display. The expected table format is:

| # | Bildebene | Tonebene | Bemerkung |
|---|-----------|----------|-----------|
| 1 | Camera description | Spoken text | Notes |

- **Section headers** (rows that span the full table width) are rendered in a distinct style to mark scene breaks
- **Bracketed text** like `[applause]` is highlighted in orange
- A toggle button shows or hides the auxiliary columns (Bildebene, Bemerkung) for a clean read-only view of the spoken text
- Parse errors in the document structure are shown on screen with a back link

## How to use

1. Clone the repo or download the `index.html` and `*.js` files
1. Serve the folder locally and open it in a browser — e.g. `npx serve .` or `python -m http.server 3000`, then visit `http://localhost:3000`. Opening `index.html` directly as a `file://` URL will not work: the strict Content Security Policy's `script-src 'self'` does not apply to sibling files under `file://`, so `mammoth.min.js`/`purify.min.js` get silently blocked and nothing happens when you drop a file.
2. Drop a `.docx` file onto the upload area, or click to browse
3. Read — scroll with the mouse or keyboard

A blank template file is included to get started.

## How it was built

This project was built entirely using [Claude Code](https://claude.ai/code) (Anthropic's AI coding CLI), powered by **Claude Sonnet 4.6**. All source code — HTML, CSS, and JavaScript — was written iteratively through a conversation-driven development session, including:

- Initial scaffold and UI
- `.docx` parsing and table validation
- Teleprompter rendering with DOMPurify sanitization
- Security hardening (Content Security Policy, extraction of inline scripts)
- Git history cleaning with `git-filter-repo`

The idea and outcome of the tool was driven by the existin wordpress based solution. No code was written by hand.

One main goals of this project was to test out a complete vibe coded project to see how it would behave and work on something i had a real use case for.

## Security

- All document content is sanitized with **DOMPurify** before DOM insertion — no raw HTML from user files ever reaches the page
- A strict **Content Security Policy** (`script-src 'self'`) is set via meta tag, blocking inline script injection
- All processing is local — no data leaves the browser

## Updates

This tool is provided as is and currently not is use, if you have any usecase for it feel free to try it out, fork it or create a PR.

## Dependencies

The following libraries are bundled directly (no CDN, works offline):

| Library | Version | License |
|---------|---------|---------|
| [mammoth.js](https://github.com/mwilliamson/mammoth.js) | browser build | BSD 2-Clause © 2013 Michael Williamson |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.4.0 | Apache 2.0 / MPL 2.0 © Cure53 and contributors |

### License compatibility

This project is released under the **MIT License**. The bundled dependencies are compatible:

- **mammoth.js** (BSD 2-Clause): permissive, fully MIT compatible. License notice is retained in `mammoth.min.js`.
- **DOMPurify** (Apache 2.0 / MPL 2.0 dual-license): both licenses are compatible with MIT distribution. Apache 2.0 requires retaining the notice (present in the file header of `purify.min.js`). MPL 2.0 is file-scoped copyleft — it applies only to `purify.min.js` itself and does not extend to the surrounding project code.

## License

MIT — see [LICENSE](LICENSE).
