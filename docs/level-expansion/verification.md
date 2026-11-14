# Five-floor expansion verification

## Implemented

- Floor order: El matadero → El jardín podrido → La Maraña de Hierro → El horno de la furia → El plató final.
- Four new regular enemies: Drek, Jikininki, Empalador ácido rastrero and Ingeniero goblin. The engineer and bulldozer share one sprite and hitbox.
- Two new bosses: Humanotauro and Elemental de furia, with the exact approved three-line umbrella conversations.
- Six separately generated transparent character PNGs, six delivery WebPs, two new arena PNGs and two matching WebPs. Existing industrial pillars are reused; arena bounds and four obstacle hitboxes are unchanged.
- Four upgrade selections, five boss introductions, five-floor HUD/help/result text and version-2 checkpoints. Version-1 saves preserve completed-floor count, score and perks; their old third-floor checkpoint now starts the expansion's third floor. The local-storage key is unchanged.
- Existing music alternates Showdown / 毒花迷宫 / Showdown / 毒花迷宫 / Game-Show Finale. No new music files or effects were generated. Existing lobby, upgrade and victory tracks remain.
- Final boss HP is 630 and generator HP is 96 to account for the additional upgrades. Its shield, second phase and warning-beam behavior remain intact.

Character names use the checked Spanish edition labels. Level grouping, combat abilities and dialogue are original game adaptations, not book quotations or a literal reconstruction of the novels. In particular, the elemental can be damaged with Manolo's umbrella.

## Automated checks

- `npm run check`: passed.
- `npm test`: 83 passed, 0 failed. Includes five-floor progression, all five conversations, migration and retry on later floors, new wave composition, attack warnings/damage/recovery, asset availability and music selection.
- Chromium 151 headless: 327 browser assertions passed, 0 failed; no page exceptions, console errors or failed HTTP responses during the final run.
- Browser coverage: existing input/transition regressions, all five boss introductions, controlled five-floor progression through four real upgrade menus, save reload/Continue/Retry, native emulated touch taps, and simultaneous joystick/attack with real browser pointer capture.
- Sixty dialogue-layout checks: all three lines of all five bosses at 390×667, 320×568, 1280×800 and 667×390. No horizontal overflow, clipped action button or scrolling required in these checks.
- Fixed the new elemental's long-name layout at 320×568 by reducing illustration height and spacing only on short portrait screens. The action remains a large tap target; dialogue copy is unchanged.
- Six new delivery sprites decoded successfully and contain genuine transparent pixels (roughly 39–57% of each canvas); no baked opaque backgrounds. Room PNGs retain the 8:7 arena aspect ratio.
- The updated browser transition regression explicitly selects retry/restart actions rather than accidentally selecting the leaderboard form's submit button.

The CLI wrapper did not expose its expected executable. Browser checks therefore used the available Playwright tools, followed by an isolated local headless Chromium run. Foreground-tool runs showed focus/timer-sensitive failures; the final isolated run passed every regression without altering production input guards.

## Combat smoke test and limits

A deterministic steering bot played six runs using real movement, attack, dash, health and collision rules, with no invulnerability override, forced kills or skipped waves. All six cleared both new floors and reached the fifth; one defeated the final boss, while five died there. This demonstrates reachability, not human difficulty calibration. Final-boss difficulty, touch comfort and audio still need feedback on the intended physical phone. The browser progression test uses controlled encounters and is not presented as a balance test.

No deployment or commit was performed. No production leaderboard data was used or changed; browser checks used an isolated local leaderboard file.

## Evidence and provenance

- `docs/level-expansion/art-prompts.json`: exact prompts used for the eight image-generation calls.
- `docs/level-expansion/manifest.json`: role/name/floor/PNG/WebP mapping.
- `docs/level-expansion/canon-research.md`: name verification and secondary anatomy references.
- `tests/level-expansion.test.js`: deterministic feature coverage.
- `tests/browser/level-expansion-regression.js`: controlled browser progression regression; requires the local-only response fixture, never shipped.
- Local ignored evidence: `output/playwright/level-expansion/results.json`, `run-qa.log`, `combat-smoke.json`, plus screenshots for both new rooms, bosses and 320/390-wide conversations. The local `run-qa.mjs` and `combat-smoke.mjs` scripts record the QA setup.

Generated originals are retained under `assets/art/`; the browser loads only `assets/webp/`. Art was created with the built-in generator, then copied and encoded with the existing `cwebp -q 90 -alpha_q 100` pipeline. No generated source originals were removed.
