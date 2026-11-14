# Quiet combat and retro typography

## Changes

- Removed in-combat objectives, repeated boss advice, narrator paragraphs, desktop sidebar, keyboard hints and visible control labels.
- Kept floor/health numbers, health bars and accessible names. Attack and dodge use their existing icons; dodge retains its numeric cooldown. Boss states use shield, lightning and warning icons. Shield-hit feedback is drawn rather than spelled out on the canvas.
- Floor and boss titles appear only in pre-combat phases, and never while enemies, projectiles or hazards remain. No simulation timers or combat mechanics changed.
- Moved floor advice, active perks, narrator commentary, time and score into Pause. Resume appears before the details so it stays reachable on small screens. Help explains all icon controls.
- Added self-hosted Pixelify Sans for headings, buttons and numbers; retained Inter for paragraph readability. Logo, screenprinted illustrations and palette are unchanged.

## Font provenance

- Official distribution: https://github.com/google/fonts/tree/main/ofl/pixelifysans
- Variable font: `assets/fonts/pixelify-sans-variable.ttf`, weights 400–700.
- Included SIL OFL 1.1 license: `assets/fonts/Pixelify-Sans-OFL.txt`.
- No external font service is contacted by the game.

## Verification

- `npm run check`: passed.
- `npm test`: 55 tests passed, including numeric pixel lettering and icon-only shield-hit feedback.
- `node docs/audio-integration/check-mechanics.mjs`: identical simulation state for 28,800 frames, four seeds and three floors (audio event metadata excluded by the existing comparison).
- Browser: 48 new combat UI assertions, 8 mobile regressions, 21 transition-input regressions and 6 touch-handler regressions passed. See `browser-results.json`.
- Nine viewports: 320×568, 360×640, 390×667, 390×844, 430×740, 430×600, 667×375, 844×390 and 1280×800. Arena/controls fit, no horizontal overflow in menus or transition cards, and Resume is visible without scrolling. See `layout-matrix.json`.
- Native browser inputs: resumed from Pause, moved with D, dodged with Shift and reopened Pause with P. No captured console errors or warnings.
- Browser fixture is appended to a local intercepted module response only. The clean page was reloaded, the original checkpoint restored, emulation cleared and the absence of the test hook verified. Sound remained on by default.

## Evidence

- `before-mobile.png` — previous combat copy.
- `after-mobile.png` — quiet mobile combat (unused bottom margin cropped).
- `after-desktop.png` — centered desktop arena without the sidebar.
- `upgrade-mobile.png` — pixel lettering and readable upgrade descriptions.
- `pause-mobile.png` — accessible Resume action and relocated information.

## Limits

Browser checks are not physical-phone acceptance tests. The multi-touch cases exercise synthetic browser handlers, not a real device pinch gesture. No commit, push or VPS deployment is included in this change.
