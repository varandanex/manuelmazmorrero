# Exclusive floor rosters and three-wave progression

## Scope

- Three exclusive regular species per floor: 15 total, no cross-floor reuse.
- Three authored formations per floor, then the existing dialogue, reveal and boss.
- Wave counts: 4/5/6, 4/6/7, 5/6/8, 5/7/8 and 6/7/8 (92 regular enemies).
- First wave introduces two species; the second introduces the third; the third increases combined pressure. Counts and total enemy health rise strictly inside every floor without scaling individual enemy stats between waves.
- Eight new original transparent PNGs, delivery WebPs, Spanish briefing cards, original umbrella jokes and combat patterns.
- Gallery and ZIP contain 21 dossiers: Manolo, 15 enemies and the same five bosses. All PNG dossiers remain 1600×2400. Optional source PNG downloads retain native dimensions and transparency.
- Book-name evidence and adaptation caveats are in `canon-research.md`; full individual built-in image-generation prompts are in `art-prompts.json`.
- Publication is a separate step requiring explicit authorization and independent checks against the public URL.

## Fairness and compatibility

- New lunges, volleys, melee strikes and floor zones telegraph before activation and expose recovery windows. Targets do not track the player after the warning.
- Spawn candidates stay at least 100 world units from the player. Automated checks cover 2,100 floor/wave/player-location combinations, including original spawn sites, with no overlap against pillars, boundaries or other spawn hitboxes.
- Existing boss mechanics, music, upgrades, player controls and checkpoint version/key remain unchanged. Existing regular enemies retain their previous individual stats; the goblin now belongs only to floor one.
- Tall regular sprites are kept within the northern canvas edge, like bosses.
- The server still serves the same static gallery/archive routes. No runtime dependency or production test hook was added.

## Verification

- `npm run check`: syntax checks pass.
- `npm test`: 104 passing tests. New coverage verifies exclusive identity/artwork, all three waves before bosses, stable individual stats, increasing health budgets, safe spawns, locked warnings, damage timing, recovery and flanking. Updated gallery tests check 21 complete byte-identical ZIP entries, source hashes, attachments and ranges.
- Chromium 151.0.7922.34, local loopback server:
  - 448 gallery checks across 320×568, 390×667, 1280×800 and 667×390: all 21 cards, reachable content, keyboard/focus, touch slides/scroll, reduced motion, failure/retry, exact PNG/original/ZIP downloads and checkpoint preservation.
  - 406 gameplay/presentation checks: all three enemy cards for all floors, all boss dialogues/reveals, five-floor progression, controls, transitions, save/retry and real touch/keyboard input.
  - 72 visual checks: all 15 species drawn in third waves, all seven new warning-based attacks, every enemy briefing at all four viewports without horizontal overflow. Eight original images also checked for native dimensions and true transparent alpha.
- Authoring renderer verified all 21 printable layouts before publishing updated local assets.
- No uncaught browser errors in the validation runs.

## Local evidence

Ignored, reproducible QA artifacts in `output/playwright/exclusive-rosters/`: `check-gameplay.mjs`, `check-gallery.mjs`, `check-visuals.mjs`, their JSON results, downloadable sample files, five third-wave captures, seven warning captures and small/large briefing captures.

## Remaining acceptance

Difficulty progression is implemented and mechanically verified, not proven subjectively fun by automation. Real-player pacing, physical iOS/Android downloads, VoiceOver/TalkBack and comfort remain manual acceptance. Publish only after an explicit request.
