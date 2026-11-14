# Manolo el Mazmorrero — visual QA

final result: passed

## Visual truth and evidence
- Approved system: `docs/style-guide/proposals/01-editorial.png`.
- Pose reference: `docs/style-guide/proposals/02-comic.png`.
- Combined target: `docs/redesign/selected-target.png` (852 × 1846 pixels).
- Latest implementation: `docs/redesign/game-mobile-390.png` (390 × 844 pixels).
- Full-view and focused control comparison: `docs/redesign/comparison-final.png`, produced by `docs/redesign/compare.html`. Both source and implementation were opened together and reviewed in the same image, not from filenames or separate recollections.
- Comparison viewport: 390 × 844 CSS pixels, first-floor boss with charge telegraph, 80 HP. The source is proportionally normalized to that display size; implementation was captured as PNG at device scale 1. The assembled comparison uses a 1280px-wide review canvas.
- Supporting captures: `game-mobile-320.jpg`, `game-landscape.jpg`, `game-desktop.jpg`, `spore-mobile.png`, `host-mobile.png`, `help-mobile.jpg`, `upgrade-mobile.jpg`, `death-mobile.jpg`, `victory-mobile.jpg`, `asset-error.jpg`, and `lobby-desktop.jpg`, all in `docs/redesign/`.

## Findings and comparison history
1. **P2 — Boss-bar layout overflow.** Initial 390 × 844 run produced 889px of document height (`game-mobile-first.jpg`); the joystick label/lower content fell below the viewport. Reduced the in-game logo, removed desktop keyboard hints on mobile and reserved space for the boss bar. Final measured document: 390 × 844, without overflow.
2. **P2 — Small-screen and landscape overflow.** Initial 320 × 568 layout was 595px high; 844 × 390 layout was 417px high. Short screens now suppress the redundant logo, use an 84px joystick and height-constrained arena. Landscape centers a height-constrained arena and places controls alongside it. Final measurements: 320 × 568 and 844 × 390, without overflow. All primary controls remain visible.
3. **P2 — HUD portrait.** The full-body sprite was illegible as a small avatar. Replaced it with a separately generated head-and-shoulders image matching the hero. Verified in the final comparison.
4. **P2 — Desktop arena height.** Adding the mobile title treatment would push combat below a desktop viewport. Fine-pointer desktops now use keyboard hints and the existing sidebar, without duplicated touch controls/narration, and constrain the arena by available height. The complete combat area, pause and keyboard hints fit at 1280 × 720 (`game-desktop.jpg`). Secondary sidebar help may require a small scroll; the equivalent help button remains in the header.
5. **P2 — Loading error overwritten.** Simulated missing boss art revealed late progress updates replacing the error message. Fixed in `loadArt`, added a regression test and repeated the browser failure/reload flow. Error copy now persists, play cannot start, and reload recovers normally (`asset-error.jpg`).

6. **P2 — Intermediate phone heights.** The first height-specific rules covered 568px and 844px but did not reserve enough space in between. Added a continuous tall-phone arena bound and corrected the intermediate-height reserve. Verified 390px width at heights 620, 650, 700, 720, 740, 760, 780, 800 and 844: document height equaled viewport height throughout, and attack controls remained visible. Re-captured and compared the final 390 × 844 scene after this fix.

The final combined comparison finds no remaining actionable P0/P1/P2 issue within this approved visual-system adaptation.

## Required fidelity surfaces
- **Typography:** irregular lettering remains in the generated logo asset. Local Barlow Condensed gives bold, compact action labels and boss names; Inter and IBM Plex Mono provide readable narrative and HUD text. Browser checks confirm display/body fonts are loaded. No broken logo spelling or clipped core labels. Utility text on the smallest viewport remains deliberately compact.
- **Spacing/layout:** mobile content order follows the chosen system; boss status sits below the arena rather than covering the fight. Touch targets are at least 71px for combat and 84px for the joystick in the tested short layout. No horizontal overflow in tested mobile states. Short-screen and landscape variants prioritize the arena/controls over repeated branding.
- **Colors/tokens:** black, yellow, magenta and cream replace the muted purple/gold system. Health and attack warnings also use text, bar lengths and stripes; they are not communicated only by hue. Functional green poison/healing remains to match the existing rules.
- **Image quality:** all character/environment artwork is generated raster imagery, not code-native pixel art or a screenshot masquerading as a game. Full silhouettes, matching portrait, three differentiated rooms, retained alpha, high-density canvas, and dimension-preserving WebP delivery were inspected. Standard icons use a licensed matching library. Telegraph geometry, bars and joystick circles are functional controls, not replacement illustrations.
- **Copy/content:** Manolo is consistent in title, menus, instructions and ending. Existing scripted humor and game mechanics are retained. No gift-box items were introduced. No claim of affiliation or photographic likeness is made.

## Intentional differences from the concept
This is the user's selected **visual system**, not a request to replace the playable arena with the concept image. The original 480 × 420 simulation, four physical collision pillars and relative combat scale remain. Actors are smaller than the poster-like concept so multiple enemies and true attack ranges remain readable. The floor is less busy; poison pools and projectiles remain distinct. Desktop uses the keyboard-oriented layout. These are explicit implementation constraints, not unreviewed design drift.

## Functional verification
- `npm run check`: passed.
- `npm test`: 26 passed, including existing deterministic gameplay coverage and new asset/loading regressions.
- Verified simulation source unchanged except the displayed name against the pre-redesign archive.
- Browser: existing checkpoint continued; keyboard movement changed player position and released keys reset; sustained pointer attack cleared both first-floor waves and naturally reached the first boss; dodge showed its cooldown; joystick drag moved the player and reset on release.
- Help paused the simulation clock and resumed correctly. Upgrade selection, death/retry with retained advantages, final victory and checkpoint clearing were exercised through real UI actions with browser-only scenario acceleration for late-game setup.
- All three boss/environment combinations rendered. Sound toggle switched on/off. Loading failure and recovery were tested by temporary response interception.
- Final clean reload: all DOM images loaded, display/body fonts loaded, no console warnings/errors, and no test hook present. Temporary interception and viewport overrides were cleared; the prior checkpoint was restored. No debug code was written into the shipped source.

## Follow-up polish and test gaps
- P3: The concept has more distressed control surfaces. Current controls intentionally prioritize clean touch affordances; optional texture can be considered later.
- Additional animation frames could replace the current lightweight idle/attack transforms.
- Physical iPhone/Android play-through, browser chrome/safe-area behavior, simultaneous multi-touch on the actual phone, and difficulty feedback remain acceptance checks. Browser automation is not a substitute for real-device validation.
- Canvas combat remains a visual experience, not fully screen-reader playable. Menus/actions keep accessible labels, keyboard access and visible focus; reduced motion disables idle bobbing, trails and screen shake.

## Implementation checklist
- [x] Approved art direction and name applied.
- [x] Original raster assets, prompts and licenses retained.
- [x] Mechanics and save compatibility preserved.
- [x] Loading failure guarded and regression-tested.
- [x] Mobile, small-mobile, landscape and desktop combat reviewed.
- [x] Full and focused source/implementation comparison completed after fixes.
- [x] Clean local preview left running; no public deployment performed.
