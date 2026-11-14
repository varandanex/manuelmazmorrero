# Original-art gallery verification

## Delivered behavior

- The main menu opens a separate native modal dialog, outside gameplay and its transition guards.
- 38 slides cover every PNG under `assets/art/`: five current bosses, seven regular enemies, three Manolo illustrations, five backgrounds, four props, the logo and thirteen previous designs.
- One image per slide, uncropped, with name, category, source dimensions and source file size. Transparent art uses a checkerboard backdrop.
- Next/previous buttons, left/right arrow keys and horizontal swipes wrap around the collection. Home/End select its endpoints. Close/Escape restore focus to the menu entry; reopening retains the current slide.
- Each download is the original PNG, not the lighter preview. The complete ZIP preserves all 38 source files and their relative folders. No resizing, upscaling, flattening or image recompression occurs.
- The gallery requests only its current WebP preview. Original PNGs and the ZIP are fetched on explicit download, not when the menu or gallery opens.
- Preview errors offer a retry while leaving the original download available. Late responses cannot overwrite a newer slide.

## Implementation

- `scripts/build_art_gallery.py`: Python 3.9+ standard-library catalog/ZIP builder; Spanish labels, curated order and discovery of additional PNGs. Requires a matching WebP per source. Fixed timestamps and ordering make rebuilds deterministic.
- `src/art-gallery-data.js`: generated source metadata, hashes, preview paths and archive metadata.
- `src/art-gallery.js`: isolated gallery, focus handling, keyboard/pointer input and lazy previews.
- `assets/downloads/manolo-ilustraciones-png.zip`: prebuilt ZIP; 69,038,862 bytes. All PNG entries use ZIP STORE and match their source SHA-256 hashes.
- `index.html`, `src/main.js`, `style.css`: menu entry, initialization and responsive styles. No combat mechanics or checkpoint schema changes for the gallery.
- `server.mjs`: exact archive allowlist, attachment headers, streaming ZIP delivery, HEAD and byte ranges. PNG attachment headers require the explicit `download=1` query. Other archives and project documents remain inaccessible.

## Automated and browser verification

- `npm run check`: passed.
- `npm test`: 95/95 passed, including five gallery/catalog/archive/server tests.
- Python ZIP CRC validation: 38 entries, no errors. Rebuilding produces identical ZIP and catalog hashes.
- Chromium 151.0.7922.34, headless: **415 checks passed**, no uncaught browser errors.
- All 38 slides checked at 320×568, 390×667, 1280×800 and 667×390. Full image containment, viewport/label fit and minimum 44 px gallery controls verified. Portrait and landscape screenshots visually inspected.
- Menu actions checked with and without a saved checkpoint, after CSS transitions settle.
- Trusted keyboard navigation, native Escape, focus restoration, wrapping and reopening checked.
- Trusted touch input verified horizontal navigation, vertical-gesture cancellation and no advancement on canceled multitouch; pinch zoom remains permitted by CSS.
- Actual browser PNG and full ZIP downloads completed; filenames and SHA-256 hashes matched the source catalog.
- Network requests verified no eager original PNG or archive downloads.
- Aborted-preview retry, delayed stale preview, exact checkpoint preservation and continuing the saved fourth floor verified.
- Existing gameplay/presentation browser suite rerun: **394 checks passed**, no failures or browser errors (floor cards, boss dialogue, mobile layouts, environments, combat UI, transition guards, touch controls, five-floor progression, keyboard input and saved-game/retry briefings).

Local browser runner, results, downloaded verification copies and screenshots are under `output/playwright/art-gallery/` (ignored by Git). The runner uses the locally available Playwright installation; no runtime or project dependency was added. Unit/archive/HTTP tests are maintained in `tests/art-gallery.test.js`; menu layout checks are in `tests/browser/entry-buttons-regression.js`.

## Acceptance boundaries

- This is a local implementation, not a public deployment. Include the generated ZIP and catalog when deploying.
- Maximum quality means the existing source PNG resolution; no higher-resolution artwork was generated.
- Physical iOS/Android download destinations, browser share/save dialogs, slow mobile networks and VoiceOver/TalkBack still need device acceptance. Browser automation does not replace this.
- A native download may open the browser's download/save UI. The page does not claim that a file has been saved before the browser completes it.
