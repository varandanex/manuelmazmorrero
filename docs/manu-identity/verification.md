# Manu identity update

## Confirmed name
The title remains **Manolo el Mazmorrero**, including its existing wordmark, browser title and interface. The alternate name mentioned in the delegated message was explicitly corrected by the user and was not applied.

## Assets and implementation
- Source identity references: assets/art/Manu-01-confianza-temeraria.png and assets/art/Manu-02-caos-absoluto.png. Preserved without changes.
- New sprite: assets/art/hero-manu.png, generated with the built-in image-generation tool using both supplied illustrations and the previous full-body sprite. Real alpha transparency; turquoise glasses, wavy hair and beard retained from the references.
- Prompt: assets/art/hero-manu-prompt.txt.
- Delivery copies: assets/webp/hero-manu.webp and the two same-named Manu reference WebPs. Original generic hero is preserved but no longer loaded by the renderer.
- Existing render animation states (idle bob, facing/mirroring, attack tilt, invulnerability blink and dodge trails) now use the Manu sprite. No additional animation system or mechanical changes.
- Confident face beside the unchanged title and in the HUD; surprised face in the defeat panel.
- Changed consumers: index.html, src/render.js, src/main.js, style.css. Prior UI/render files are retained in this directory as a before snapshot.

## Verification
- 45 automated tests and syntax checks pass, including the asset-loader assertion that gameplay loads hero-manu.webp rather than the generic hero.
- In-app browser: portrait/title verified at 390 and 1365 px; no horizontal overflow at 320 px. Native movement, hold attack, dodge, death/retry and pause exercised with the new art. No console warnings/errors.
- Screenshots: cover-mobile-390.png, cover-desktop.png, game-mobile-390.png, defeat-mobile-390.png.
- Temporary viewport overrides cleared and original checkpoint restored after testing. No shipped test hooks and no deployment.
- Physical-phone gameplay and subjective audio mixing acceptance remain pending.
