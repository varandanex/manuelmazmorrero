# Manolo el Mazmorrero

A mobile-first, single-player dungeon crawler. Original screenprinted character artwork, Spanish text, original procedural sound effects and a six-track soundtrack. An unofficial fan-inspired birthday game; not affiliated with the book series. No actual gift-box items are used in the gameplay.

## Run

Requires Node.js 20 or later. No package installation is needed.

```sh
npm run dev
```

Open `http://localhost:4173`. To test on a phone, connect it to the same Wi-Fi as the computer and open the LAN URL printed by the server. The computer must stay awake and the server must keep running. VPNs and client-isolated Wi-Fi may prevent access.

This is a local preview, not a public deployment. Run `npm start` on a single Node.js 20+ server to share the arcade top 10 across players. Keep `data/leaderboard.json` on persistent storage (or configure `LEADERBOARD_FILE`). Static-only hosting runs the game but cannot save the shared ranking. See [leaderboard hosting and trust boundary](docs/leaderboard.md). No build step, accounts, analytics or API keys are required. Fonts are self-hosted and their OFL licenses are in `assets/fonts/`. Phosphor Bold icons are vendored with the MIT license in `assets/icons/`. Gameplay makes no third-party requests; the shared ranking uses the same-origin `/api/leaderboard` endpoint. Generate the gift QR only after choosing and verifying the final HTTPS address.

## Play

- Move: left touch joystick, WASD or arrow keys.
- Attack: hold the attack button, Space or J. Short-range attacks aim at a nearby enemy.
- Dodge: dodge button, Shift or K. Brief invulnerability, followed by a cooldown.
- Pause: pause button, P or Escape. Losing window focus also pauses the game.
- Audio: music and effects are enabled by default and start on the first click, tap or key press permitted by the browser. The sound toggle still mutes both. Adjust effects and music independently in Help or Pause. Volume preferences are saved locally; each new page load defaults to sound on. An explicit mute is respected for the current visit.
- Mobile combat owns touch gestures to avoid accidental pinch/double-tap zoom. Normal zoom remains available in the lobby and dialogs. Portrait prioritizes arena width; combat omits the header and narrative copy, with audio still available in Pause.
- Combat shows health bars, floor numbers and icon-only controls. Boss states use a shield, lightning or warning icon; advice, commentary, score and perks are available in Pause. Floor titles appear only before combat; each boss has an illustrated three-line conversation with explicit advancement.
- Automatic result screens wait at least one second and require all held keys/fingers to be released, followed by a 200 ms quiet interval. Repeated attack input cannot choose an upgrade or restart a run. Explicit pause/help menus remain immediate.

At the beginning of every floor, a short original narrative introduces the setting. The next screens present each possible regular enemy once, with its illustration, Spanish name, exaggerated attack title, actual attack behavior and a survival tip. Repeated species within a wave are not repeated within the briefing. Tap the card or use the button to advance; the last card requires the explicit «Entrar en el piso» action.

Before each boss, simulation and music pause while Manolo and the boss trade three approved lines. Tap the illustration, speech panel or Continue to advance. After the third line, «Ver presentación» opens a separate illustrated boss poster with an entrance sting, signature attack and survival advice. Only its «¡Al lío!» button starts the fight (Tab then Enter/Space on a keyboard). Held combat input cannot dismiss the opening screens, and rapid double taps cannot skip replies or cards. Escape or losing focus does not bypass any presentation. Starting, continuing and retrying a floor replay its narrative and enemy briefing; retrying also replays the later boss introduction. Reduced-motion settings disable entrance animations.

Narratives and card copy live in `src/encounter-cards.js`; their attack titles are original game-show jokes, not quotations or claims about book abilities. Existing illustrations and WAV effects are reused. See `docs/encounter-cards/verification.md` for state transitions, browser checks and remaining physical-device acceptance.

Each of five floors contains three increasingly demanding enemy waves and one boss:

1. **El matadero:** El Juicer telegraphs charges.
2. **El jardín podrido:** La Acaparadora uses projectile volleys and toxic pools.
3. **La Maraña de Hierro:** Drek pursue in packs; Jikininki telegraph close-range strikes. The Humanotauro marks live rails and ground smashes, then becomes vulnerable.
4. **El horno de la furia:** Empaladores ácidos rastreros spit from range; Ingenieros goblin charge in bulldozers. The Elemental de furia marks fire circles and launches a three-projectile volley before recovering.
5. **El plató final:** the Clon de Krakaren retains destructible shield generators, warning beams and a second shield phase. Boss and generator health account for the two additional upgrades.

Each floor owns three exclusive species. The first wave introduces two, the second adds the third, and the last uses a denser combined formation. Individual enemies do not gain hidden health or speed between waves.

| Floor | Exclusive regular enemies | Enemy counts by wave |
| --- | --- | --- |
| El matadero | Goblin, Rata, Desperdigador | 4 → 5 → 6 |
| El jardín podrido | Vigilante de pared, Llama maligna, Mono talador | 4 → 6 → 7 |
| La Maraña de Hierro | Drek, Jikininki, Abrojo psicópata | 5 → 6 → 8 |
| El horno de la furia | Empalador ácido rastrero, Ingeniero goblin, Motor de carbón | 5 → 7 → 8 |
| El plató final | Comadreja nocturna exploradora, Campana funeraria, Hobgoblin | 6 → 7 → 8 |

There are 15 unique regular species, 15 waves and 92 regular enemies per complete run. Bosses and shield emitters are counted separately. Authored formations own the counts; progression and announcements read their length instead of assuming two waves. Spawn candidates stay at least 100 world units from the player. See `docs/exclusive-rosters/verification.md` and `docs/exclusive-rosters/canon-research.md` for scope and evidence.

These are game adaptations, not claims about canonical abilities or encounter order. Choose one permanent advantage after each of the first four floors. Death restarts the current floor, not the entire run.

The beginning of the current floor is stored locally in this browser. It is not a mid-combat save and it does not sync across devices. A new run replaces this checkpoint. Victory removes it. The game remains playable if browser storage is unavailable. Version-2 checkpoints support all five floors. Legacy version-1 saves retain their completed-floor count, upgrades and score; an old third-floor save enters La Maraña de Hierro rather than skipping the expansion. The legacy storage key is intentionally retained.

## Collectible character dossiers

Open **Galería · Fichas de personaje** from the menu. The collection contains **21 current characters only**: Manolo's full-body umbrella sprite, fifteen regular enemies and five bosses. There are no portraits, scenarios, props, logos or previous designs in the gallery or ZIP. Their source files remain untouched for gameplay and provenance.

Each dossier shows its Spanish name, class, floors, an original character line, health, damage, mobility, attacks and survival advice. Stats come from the simulation: Manolo is shown without upgrades; each regular enemy belongs to exactly one floor. Enemy damage is explicitly contact damage, not a promise that every special attack does the same damage. Krakaren's movement is a scripted patrol, not its zero base-speed field. Quotes and combat data are game adaptations, not statistics from the novels.

Use the arrows, horizontal swipes or keyboard (←/→, Home/End) to change cards. Scroll vertically to read long dossiers; navigation and download controls stay available. Escape closes the gallery and restores focus. Manolo's preview has a subtle idle animation with a pause button and reduced-motion support; **downloaded PNGs are static**.

**Ficha PNG** downloads the complete 1600×2400 dossier, including the artwork and text. **Todas en ZIP** downloads exactly those twenty-one PNGs (about 19 MB). **PNG sin ficha**, inside each dossier, still downloads the unchanged source illustration with its original transparency. Lightweight WebPs are used only for browsing; downloads are prebuilt and do not require browser-side canvas conversion or ZIP assembly.

`src/character-cards.js` owns the shared content/DOM renderer and reads live base stats through `enemyStats` in `src/game.js`. `src/character-cards.css` provides responsive and print layouts. `assets/cards/manifest.json` records hashes of the source copy, stats, artwork, fonts and styling; tests fail if exported cards are stale.

To regenerate cards after changing their inputs, use an authoring installation of Playwright with Chromium, plus Python 3.9+. Set `PLAYWRIGHT_MODULE` to the absolute ESM module path if Playwright is installed outside this project:

```sh
npm run gallery:build
npm run check
npm test
```

The builder renders the same dossier component using original PNG artwork and local fonts, verifies layout, then packages the twenty-one cards. Commit `assets/cards/`, `assets/downloads/manolo-fichas-personajes.zip` and `src/art-gallery-data.js` together. Normal play, serving and downloading need only Node.js 20+ and the committed assets; Playwright is an authoring tool, not a runtime dependency. The former 38-image ZIP is retired.

See `docs/art-gallery/verification.md` for checks and device limitations.

## Checks

```sh
npm run check
npm test
```

`src/game.js` contains the deterministic simulation and can be tested without a browser. `src/render.js` owns high-density canvas rendering with generated raster sprites. `src/main.js` handles UI, pointer/keyboard input and local checkpoints. `src/audio.js` owns Web Audio effects, streamed music, volume and lifecycle; `src/audio-config.js` maps the supplied files. `src/leaderboard.js` displays the shared ranking and initials form. `server.mjs` serves the game and ranking API; `server/leaderboard.mjs` serializes and persists the top 10.

## Current limitations

- No multiplayer or dynamic AI service; the audience and narrator are scripted fiction.
- The player sprite is a stylized likeness based on the two supplied Manu illustrations. His confident portrait appears beside the unchanged title and in the HUD; the surprised portrait appears on defeat.
- Bosses, waves and upgrades are implemented; difficulty and pacing still need feedback from real mobile play.
- Touch and responsive behavior can be browser-tested, but final acceptance should include the intended physical phone and its browser.
- Canvas combat is visual and is not fully playable with a screen reader. Menus and controls have keyboard and accessible labels; reduced-motion settings disable shake, idle bobbing and dodge trails.

## Visual direction

The approved visual system uses the first editorial-screenprint concept and the clear adult poses of the second concept. Black, electric yellow, magenta and warm cream replace the muted pixel-art palette. Original art sources, prompts and licenses are kept in `assets/`; references and visual QA evidence are in `docs/redesign/`.

Headings, buttons and combat numbers use locally hosted [Pixelify Sans](https://github.com/google/fonts/tree/main/ofl/pixelifysans) (SIL OFL 1.1; license in `assets/fonts/Pixelify-Sans-OFL.txt`). Long descriptions retain Inter for readability. The illustrated logo and characters retain the approved screenprinted identity.

The 480 × 420 arena, collision geometry and controls remain unchanged. New enemy behaviors, progression and checkpoint migration are covered by deterministic tests. Artwork must finish loading before play starts; failures provide a reload action rather than starting with invisible enemies.

Generated PNG originals are kept for provenance. The browser loads the smaller WebP files. Regenerate delivery assets with `./scripts/encode-art.sh` if the originals change (requires `cwebp`). See `design-qa.md` for verification and remaining real-device checks.

### Distinct environments and cover dedication

Each floor has its own background in `assets/art/environments/`, with delivery files in `assets/webp/environments/`. The two new floors reuse the industrial pillar sprite:

- **El matadero:** tiled industrial walls, iron doors, pipes, hooks and steel bollards.
- **El jardín podrido:** an overgrown greenhouse, muted moss-earth, roots, fungi and tree stumps.
- **La Maraña de Hierro:** a derelict underground station, steel floor, train doors and industrial bollards.
- **El horno de la furia:** brick furnaces, hot pipes, a dark stone floor and industrial bollards.
- **El plató final:** a television soundstage, cameras, screens, modular flooring and studio-light pedestals.

Arena bounds, all four pillar positions/radii and sprite foot anchors are preserved. Decoration stays at the perimeter; quiet floor textures keep attack indicators readable. The lobby preview uses the matadero. Previous environment originals remain for provenance and are not loaded.

The exact dedication **UNA AVENTURA HECHA CON ❤️ POR KYV** appears on a contrasting cover panel directly under the logo, before the game buttons, and is repeated in the footer. It never appears during combat.

See `docs/environments/verification.md` for visual checks and `docs/environments/prompts.json` for the built-in image-generation prompt set.

## Audio verification

31 WAV effects are decoded on the first enabled user interaction; six MP3 tracks are streamed across eight screen/floor scenes. Floors 1–4 alternate `Dungeon Showdown` and `毒花迷宫`; `Dungeon Game-Show Finale` is reserved for floor 5. Lobby, upgrade and victory retain their tracks. No new songs were generated. Combat cues follow simulation outcomes, impacts are capped, danger is prioritized, and pause/background/transitions cancel old sounds. The development server supports encoded filenames, MIME and byte ranges. See `docs/audio-integration/verification.md` for earlier checks and remaining physical-phone listening acceptance.

## Manu identity assets

The original generic hero is preserved for provenance but is no longer loaded in gameplay. `assets/art/hero-manu-umbrella.png` is the current reference-guided hero, holding a closed black umbrella. Its WebP is used by the existing idle, attack, facing, dodge-trail and preview rendering, plus the boss introductions. `hero-manu.png` preserves the previous wrench version for provenance only. The attack button, power-up icon and help copy now match the umbrella. The original two supplied face illustrations are preserved and encoded as WebP for the title/HUD and defeat panel. The title remains **Manolo el Mazmorrero**. See `docs/manu-identity/verification.md` for the earlier identity work and `docs/boss-introductions/verification.md` for the umbrella and conversations.

## Enemy artwork

The approved six-role replacement set is stored as individual transparent PNGs under `assets/art/enemies/`, with WebP delivery copies under `assets/webp/enemies/`. Prompts and the mapping manifest are stored beside the PNGs. Technical role IDs and audio event names remain stable. The generators, increased sprite sizes and Manu player art are preserved. See `docs/enemy-redesign/verification.md`.

The expansion adds six separately generated transparent character sprites and two arena backgrounds in the same screenprinted palette. The Humanotauro is entirely human-shaped, not a bull/minotaur; the Elemental de furia is a smoky, horned, six-limbed creature rather than a generic fire humanoid. Spanish names follow the verified edition labels. See `docs/level-expansion/manifest.json` for asset mappings, `art-prompts.json` for the exact generation prompts, `canon-research.md` for sources and `verification.md` for checks and remaining limitations.

## Mobile interaction regressions

`src/transition-guard.js` tracks physical input separately from simulation input. Its deterministic tests run with `npm test`; local browser regression scripts live in `tests/browser/`. See `docs/mobile-fixes/verification.md` for before/after measurements, browser checks and physical-device limitations.
