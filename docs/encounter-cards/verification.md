# Narrative briefings and encounter cards

## Delivered flow

1. **Floor narrative:** one original, short Spanish introduction for each of the five locations, over its existing scene illustration.
2. **Enemy briefing:** one screen per possible regular enemy species in that floor's wave order. Each has its full-body art, Spanish name, humorous attack title, description of the implemented behavior and survival advice. Duplicate species within a wave are omitted from the briefing.
3. **Arena:** only the explicit “Entrar en el piso” action starts the existing floor announcement and waves.
4. **Boss conversation:** the three previously approved lines are unchanged. The last action is now “Ver presentación”.
5. **Boss reveal:** a separate fight poster with an illustrated entrance, existing boss sting, attack description and counterplay. Only “¡Al lío!” spawns the boss and resumes music.

The new prose uses original dark game-show humor and location-specific atmosphere; it does not reproduce book passages or imitate an author's exact wording. Attack titles are game adaptations, not canonical ability names. The displayed **Desperdigador** label is verified in the [Spanish publisher excerpt](https://www.penguinlibros.com/es/libros-de-ciencia-ficcion/545179-ebook-pack-bienvenido-a-la-mazmorra-carl-el-mazmorrero-el-juicio-final-de-carl-el-libro-de-cocina-del-anarquista-carl-e-9788410466531/fragmento); its existing `enemy-scatterer` filename and `bat` simulation ID remain unchanged.

## Implementation

- `src/encounter-cards.js`: five narratives and card copy for seven regular species and five bosses. Every floor derives its enemy deck from `FLOORS.mobs` rather than a second roster.
- `src/game.js`: explicit `floor-intro` and `boss-reveal` states. `beginFloorCombat`, `beginBossReveal` and `beginBossFight` validate mode/phase. Reading freezes time, movement, damage, hazards and cooldowns. Bosses cannot spawn directly from the conversation anymore.
- `src/main.js`: one illustrated-card presenter, explicit progression, guarded taps/keyboard input, and stale-audio protection after asynchronous decoding. Starting, continuing and retrying replay the floor narrative and cards. No new checkpoint fields or version are needed.
- `src/audio.js`: music stays paused while reading. A narrow presentation API permits only the existing UI/impact/boss stings, while ordinary combat effects remain blocked. Mute, effect volume and background suspension are respected. Retry/upgrade feedback is retained. The boss sting is not repeated when the actual fight starts.
- `style.css`: the existing black/yellow/magenta print identity and Pixelify/Inter typography remain. Character entrance animation and a printed burst distinguish the boss reveal. Reduced motion disables animations; room crops retain the top-wall landmarks.
- `assets/art/enemies/manifest.json`: Spanish display label updated without renaming or regenerating the existing sprite.

No new artwork or audio files, dependencies, combat balance changes, deployment or commit were required for this feature. Prior uncommitted expansion work was preserved.

## Verification

- `npm run check`: passed, including the new content module.
- `npm test`: **90 passed, 0 failed**. New checks cover roster deduplication, shipped artwork, narrative coverage, frozen presentation states, required transition order, save/retry compatibility and presentation audio.
- Isolated headless Chromium: **394 browser assertions passed**, including narrative → enemy cards → arena and conversation → boss reveal → fight on every floor; previous mobile, dialogue, combat and transition regressions; actual emulated touch taps/multi-touch; keyboard acknowledgement; and saved-game continue/retry. No browser exceptions or console errors.
- **88 layout checks passed** across every narrative, enemy card and boss poster at 320×568, 390×667, 1280×800 and 667×390. Text and action buttons fit without scrolling or horizontal overflow. Reduced-motion behavior checked separately.
- Guards checked against held attack input, key repeat, rapid clicks, Escape and backgrounding. Tapping the last illustration cannot launch a floor or boss fight.

Browser scripts live in `tests/browser/`; `ui-fixture.js` is injected only into local test responses, never included by the application. Local ignored evidence and screenshots are in `output/playwright/encounter-cards/`, including `results.json`, `visual-results.json`, `run-qa.mjs` and `visual-qa.mjs`.

Physical-phone comfort and listening acceptance remain manual checks. The browser runs emulate touch and viewport sizes, not an actual iOS/Android device.
