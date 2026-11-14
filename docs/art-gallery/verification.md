> Historical verification of the 13-card release. The current 21-card collection and expanded roster are documented in [exclusive-rosters/verification.md](../exclusive-rosters/verification.md).

# Collectible character dossiers

## Current scope

The former all-art gallery has been replaced with **13 character cards**: the current full-body umbrella Manolo, seven current regular enemies and five current bosses. Manolo's two portraits, environments, props, logo and earlier designs are not gallery entries or archive contents. Original art files remain untouched; only the superseded all-art ZIP is retired.

Every card has its name, class, floor availability, an in-character line, health, contact/umbrella damage, mobility, attack behavior and a survival tip. Manolo and boss lines reuse approved dialogue; seven regular-enemy lines are original game copy. The footer explicitly distinguishes game adaptation data from book statistics.

## Stats and gameplay boundary

- `enemyStats(type, floor)` in `src/game.js` is the same function used for actual enemy spawning and card values. Its extraction does not change balance or behavior.
- Manolo's 100 HP / 24 damage / 116 units per second are read from an unupgraded new game.
- Goblins show 38–58 HP and 34–50 base speed across their actual floors 1, 2 and 5. They are not presented as a single fixed-level opponent.
- Enemy damage is labeled **Contacto**, not special-attack damage. Special abilities remain described separately.
- La Acaparadora is stationary. Krakaren follows a scripted patrol, so its mobility label is **Patrulla**, rather than the misleading zero in its base-speed field.
- No new character illustrations, combat abilities, music or checkpoint fields were introduced.

## Viewing and downloading

- The same semantic DOM component renders the live dossiers and the downloadable posters. Names, stats and descriptions are real text, not unreadably scaled screenshot previews.
- Horizontal swipe, arrow buttons or ←/→ change characters; Home/End choose endpoints. Vertical gestures or keyboard scrolling read a dossier. The controls stay outside the scrolling card region. Escape returns focus to the menu.
- Manolo's sprite has a subtle CSS idle movement, with pause/resume and reduced-motion handling. This is a gallery preview, not an animated PNG export. All downloaded cards are static.
- **Ficha PNG** downloads the complete 1600×2400 card, with source PNG artwork and local fonts. **Todas en ZIP** downloads precisely those 13 PNGs, not the old originals collection. **PNG sin ficha** separately preserves the original transparent illustration bytes.
- Browsing loads one existing WebP illustration at a time. Neither full card PNGs nor the ZIP are downloaded eagerly. Late image responses cannot replace a newer card; preview errors retain readable card data and downloads.

## Authoring and delivery

- `src/character-cards.js`: profiles, real-stat integration and shared DOM renderer.
- `src/character-cards.css`: responsive dossiers and fixed-size print composition.
- `src/art-gallery.js`: carousel, original/card downloads, focus, swipe and optional idle movement.
- `scripts/build_character_cards.mjs`: optional Playwright/Chromium authoring step, using a private loopback server, original PNGs and self-hosted fonts. It checks export bounds and writes each card PNG only after all 13 renders succeed.
- `scripts/build_art_gallery.py`: validates source fingerprints and PNG dimensions, packages exactly the manifest's thirteen cards, and generates download metadata. ZIP entries have fixed timestamps and preserve PNG bytes.
- `assets/cards/manifest.json`: fingerprints source copy, simulation, styles, fonts and current original art. Tests fail on stale exports.
- `server.mjs`: exact ZIP and stylesheet allowlists, attachment headers for cards/originals, streaming ZIP delivery and byte ranges. The retired all-art ZIP URL and source manifest remain inaccessible.

Run `npm run gallery:build` with Playwright/Chromium available and Python 3.9+. If using a separate authoring installation, provide its absolute ESM module location through `PLAYWRIGHT_MODULE`. Runtime serving/play and downloads require no new dependencies. Include the generated card PNGs, ZIP, stylesheet and metadata in any later deployment.

## Verification

- Syntax checks and **97 unit/HTTP/archive tests** pass. Card tests cover the exact 13-character scope, source-derived statistics, preserved approved boss lines, all card dimensions/hashes, stale-export detection, ZIP membership/integrity, individual source/card downloads and retired paths.
- All 13 exported PNGs pass 1600×2400 layout-bound checks. Manolo and the longest-name enemy exports were visually inspected; no clipped character art or text.
- Deterministic old/new simulation comparison: **10,800 identical frames** across three seeds and all five floors, including regular waves and boss states.
- Browser coverage includes all 13 dossiers at 320×568, 390×667, 1280×800 and 667×390; scrollable content, stable 44 px controls, exact live stats/copy, full card/original/ZIP downloads, keyboard focus, native horizontal/vertical touch input, animation pause/reduced motion, failure/retry, delayed image responses and saved-game continuation.
- A narrow-screen overflow in the patrol label was caught and corrected. Keyboard focus is retained when navigation removes a focused in-card action.
- Isolated Chromium 151.0.7922.34: **320 gallery checks** passed and **394 existing gameplay/presentation checks** passed, with no uncaught browser errors.

Local browser evidence and authoring checks are under `output/playwright/character-cards/` (ignored by Git); unit tests are in `tests/art-gallery.test.js`.

## Acceptance boundaries

These checks validate the source and generated artifacts; production acceptance also requires a same-commit deployment and live smoke tests. Physical-device download destinations, iOS/Android browser dialogs, VoiceOver/TalkBack and comfort still need device acceptance. The new cards do not create extra detail beyond the original illustrations; original PNGs remain available separately at native resolution.
