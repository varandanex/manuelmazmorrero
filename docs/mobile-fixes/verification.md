# Mobile interaction fixes

## Scope

Three reported problems: unintended zoom during two-finger play, a narrow arena on mobile, and combat input accidentally activating a newly opened result menu. This patch changes input/UI behavior only. The checks below were performed locally before repository publication; they do not verify a VPS deployment.

## Reproduction and causes

The actual page was exercised through a local response-injected test fixture. `tests/browser/mobile-regression.js` returned six failures before the fix (`before.json`):

- At 390 × 667 CSS px, the arena was only **253.71 px** wide. Several overlapping height-based CSS caps reserved space for the large logo and other chrome by shrinking the arena.
- Only individual controls owned touch gestures. The broader game surface was not protected; Safari gesture events and multi-touch fallback events were not canceled. This reproduces the missing protection, not a physical Safari zoom gesture.
- Upgrade, defeat and victory screens accepted immediate clicks. Upgrade also focused its first action immediately. Simulation input was cleared without tracking fingers/keys still physically held.

## Changes

### Gesture ownership

- `touch-action: none` on the complete game surface and root while combat is active, not just individual controls.
- Scoped non-passive handlers for Safari gesture events and multi-touch start/move. One-finger menu interactions are not canceled.
- Lobby and dialogs retain browser zoom; the viewport meta tag does not globally disable accessibility zoom.
- Pointer captures are released when combat input is cleared.

Standards consulted: [W3C Pointer Events, touch-action](https://www.w3.org/TR/pointerevents/#the-touch-action-css-property) and [WebKit's explanation of manipulation](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/). Preventing a pointer event alone is not a substitute for declaring gesture ownership before the gesture starts.

### Mobile layout

- Removed the competing height-based portrait arena caps.
- Arena uses viewport width minus small safe-area-aware side gutters, retaining its aspect ratio and simulation dimensions.
- Large in-game wordmark omitted on phones; narrator omitted on shorter screens, header on the shortest screens. Pause retains the audio controls.
- Landscape retains a complete height-fitted arena with controls alongside it; desktop keyboard/sidebar layout remains intact.
- At 390 × 667: **382 px arena width**, approximately **51% wider**. Both combat controls and joystick remain visible.

### Result transitions

- Separate physical-input tracking in `src/transition-guard.js`; clearing simulation input no longer forgets held keys or fingers.
- Upgrade, defeat and victory require at least **1000 ms**, release of every held input, and a **200 ms quiet interval** after the last release.
- Rapid taps during the delay extend the quiet interval; repeat key events cannot activate result actions.
- Result actions are inert while locked. Focus lands on the heading, not the first action; the status says “Un segundo… Suelta los controles.”
- Fresh deliberate keyboard/touch choices work after unlock. Explicit pause/help remains immediate. Blur/hidden state clears missing physical releases to avoid a permanent lock.

## Validation

- `npm test`: **52/52 passed**, including seven deterministic transition-guard regressions.
- `npm run check`: passed.
- Browser regression scripts: **35/35 checks passed** (8 original symptom checks, 21 transition checks, 6 synthetic touch-handler checks).
- A real native Space key was held for 1500 ms across a scheduled upgrade transition. The result remained open on floor 0; a later Tab + Enter deliberately selected an upgrade and reached floor 1.
- Nine viewport sizes checked with a boss present: 320×568, 360×640, 390×667, 390×844, 430×740, 430×600, 667×375, 844×390 and 1280×800. No horizontal overflow; arena and controls fit. Portrait arena widths are viewport width minus 8 px in this zero-safe-inset environment.
- Pause is immediate and restores root/dialog `touch-action: auto`; audio controls remain available.
- No browser console errors or warnings after a clean reload.
- Simulation, renderer, art and audio files are unchanged. Existing deterministic simulation comparison still passes 28,800 frames.
- Original browser checkpoint restored; test hooks, touch emulation and viewport overrides removed. The production source has no QA global.

## Re-running browser checks

Use a local development server (`npm run dev`) and a browser developer test session. Append `tests/browser/ui-fixture.js` **only to the intercepted local main.js response**, never to production files. Once assets have loaded, evaluate these scripts against the actual page:

1. `tests/browser/mobile-regression.js` at 390×667; verify every returned `pass` is true.
2. `tests/browser/transition-regression.js`; allow at least 15 seconds for its intentional timing assertions.
3. `tests/browser/touch-regression.js`; verify every returned `pass` is true.

The fixture exposes only scenario setup; assertions use real DOM handlers and visible menu state. The touch test temporarily stubs pointer capture because synthetic pointers are not registered physical devices; it restores that primitive afterward. Restore the original checkpoint and reload without the response override when finished. The normal development server does not expose `tests/`.

## Evidence and limitations

- `before.json`, `after.json`, `transitions.json`, `touch.json`, `layout-matrix.json`.
- `before-390x667.png`, `after-390x667.png`, `after-320x568.png`, `after-844x390.png`, `after-1280x800.png`, `transition-locked.png`.
- `test-results.txt` contains the automated command output.

The in-app browser does **not** support native multi-touch injection. Gesture cancellation and simultaneous control state were checked with synthetic events; this is not proof of real iOS/Android gesture behavior. Final acceptance should include joystick + attack/dash, repeated taps, rotating the phone, and release after victory/death on the intended physical phone. A VPS deployment must be verified separately after publishing these changes.
