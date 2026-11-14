# Closed umbrella and pre-boss conversations

## Delivered

- Manolo's production sprite now carries a closed black umbrella. The built-in image editor preserved his identity, pose, scale, clothing, palette and transparent background. The new original and WebP are inside the project; the previous wrench asset remains only as provenance. See `art-prompt.md` for the exact prompt and process.
- Gameplay, idle/attack animation, dodge trails, lobby preview and dialogue portraits all use the new delivery sprite. Attack/power-up icons, help and preview accessibility text also refer to the umbrella.
- Each boss gets exactly the three approved original lines in `src/boss-dialogues.js`, with full-body Manolo on the left, the correct boss on the right and the current speaker highlighted.
- The existing pre-boss warning interval leads to a `boss-intro` state, rather than immediately spawning a boss. Simulation, health, cooldowns and music remain paused for reading; Escape and app focus changes cannot skip it.
- Tapping a figure, the speech or Continue advances one line. Only the explicit final «¡Al lío!» action starts the fight. Keyboard: Enter/Space/Right advance lines; Tab then Enter/Space activates the final button.
- The opening waits one second and requires all prior physical controls to be released. Each later line has a 250 ms double-tap guard and a quiet-release interval. Focus returns to the heading when actions are temporarily inert, preventing keyboard users from losing the dialog focus.
- Retrying a floor repeats its introduction. No checkpoint schema or save-key migration.

## Verification

- `npm run check`: passed.
- `npm test`: 63 tests passed, including the approved text, complete pause behavior, one-time boss spawning, correct shield generators, retries, sprite alpha and short dialogue guards.
- 138 browser assertions passed: 55 dialogue checks, 48 quiet-combat checks, 8 mobile checks, 21 transition-input checks and 6 touch-handler checks. See `browser-results.json`.
- Nine viewports × three bosses × three lines = 81 layout cases. All fit horizontally and vertically, with the final button visible without scrolling. Sizes: 320×568, 360×640, 390×667, 390×844, 430×740, 430×600, 667×375, 844×390 and 1280×800. See `layout-matrix.json`.
- Native browser input: held Space across the transition for 1.5 seconds; the first line remained intact. Fresh Enter advanced the reply, and Tab/Enter on «¡Al lío!» spawned the boss; P then opened Pause normally.
- `node docs/audio-integration/check-mechanics.mjs`: active simulation state matches the prior baseline for 28,800 frames across four seeds and all three floors. The comparison explicitly acknowledges the new presentation-only gate each time it appears; it does not pretend the new conversation has no timing effect.
- No captured console errors or warnings. Clean reload was ready, sound remained on by default, the original test-origin checkpoint was restored and the test hook was absent. The temporary test tab was closed; the user's localhost game/checkpoint was not overwritten.
- The new PNG is 1254×1254 with alpha. The WebP preserves dimensions and alpha via the existing encoding pipeline.

## Visual evidence

- `manolo-reply-mobile.png` — final layout, Manolo speaking with the closed umbrella.
- `krakaren-mobile.png` — final layout, the last boss introducing itself.
- `umbrella-combat-mobile.png` — production sprite and attack icon.
- `juicer-mobile.png`, `hoarder-mobile.png` — earlier visual review captures before the small full-body framing adjustment.

## Limits

Browser tests do not replace physical-phone acceptance. Multi-touch regression cases are synthetic handler tests; this session did not perform a real pinch gesture on a phone. No commit, push or VPS deployment was performed.
