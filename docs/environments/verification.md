# Distinct floors and KYV cover dedication

## Delivered

- Six new reference-guided screenprint assets: three room backgrounds and three matching obstacle sprites. Source PNGs and delivery WebPs are kept in the project; original room/pillar assets are retained for provenance only.
- Matadero: industrial tilework, iron doors, pipes, hooks, drainage edges and steel bollards.
- Jardín podrido: overgrown greenhouse windows, root borders, muted soil/moss and fungal stumps. Decorative greens remain subdued, unlike actual lime-green hazard indicators.
- Plató final: studio trusses, cameras, monitors, stage panels and small spotlight pedestals. Decorative lights do not cast attack-like beams into the arena.
- Runtime chooses room and pillar artwork by floor. All four pillar positions, radii, foot anchors and 48-unit sprite canvases remain unchanged. `src/game.js` and `src/main.js` were not modified.
- Lobby preview uses the new matadero. Loading now waits for all 15 required assets, including all three obstacle variants; failures still block play rather than silently hiding scenery.
- The exact credit `UNA AVENTURA HECHA CON ❤️ POR KYV` appears in a high-contrast printed panel directly below the home logo and again in the footer. KYV uses large pixel lettering; the heart remains the requested red emoji. No credit text is added to combat.
- Short landscape layouts reduce the cover spacing to keep the dedication above the fold. A whitespace fix keeps the two tagline sentences separated when the mobile line break is hidden.

## Artwork and process

Built-in `image_gen`, reference-guided style-transfer; no external API/CLI generation. Exact prompts, reference names and transparency requests are in `prompts.json`. Delivery uses the existing `cwebp -q 90 -alpha_q 100` pipeline with dimensions and alpha preserved. `scripts/encode-art.sh` now includes the environments directory.

- `assets/art/environments/room-{matadero,jardin,plato}.png`
- `assets/art/environments/pillar-{matadero,jardin,plato}.png`
- Matching `.webp` files under `assets/webp/environments/`.

## Verification

- `npm run check`: passed.
- `npm test`: 68 tests passed. New tests cover per-floor room/obstacle selection, all four unchanged anchors, non-mutation of simulation state, the lobby preview, missing-art failure, image dimensions/alpha format, and exact cover/footer wording.
- 180 layout assertions passed across nine viewports: 320×568, 360×640, 390×667, 390×844, 430×740, 430×600, 667×375, 844×390 and 1280×800. Checked the prominent dedication, viewport fit, all three arenas, health UI and text-free combat. See `layout-results.json`.
- 196 regression assertions passed: combat UI 48, mobile 8, transition guard 21, touch handlers 6, boss conversations 55, lobby buttons 58. See `browser-results.json`.
- Visual review of all three actual rendered boss arenas at 390×844, including the garden poison telegraph, plus desktop and mobile covers. Figures, hazards and shield generators remain legible against the new floors.
- Chrome console: no captured warnings or errors. The temporary 127.0.0.1 test checkpoint was restored, the fixture removed by clean reload, default sound remained on, viewport emulation was cleared and the temporary test tab was closed. The user's localhost game and checkpoint were not replaced.

## Evidence

- `home-mobile.png`, `home-desktop.png`: clean, production-code lobby with the KYV panel.
- `matadero-mobile.png`, `jardin-mobile.png`, `plato-mobile.png`: deterministic test scenes using production rendering; the garden includes an injected hazard to review its contrast.
- `test-results.txt`: Node validation output.
- `asset-manifest.json`: local asset dimensions, alpha-channel format and delivery sizes.

## Limits

Local implementation only; no commit, push or VPS deployment. Browser emulation does not replace physical-phone acceptance testing. Multi-touch checks exercise synthetic handlers, not an actual device pinch gesture.
