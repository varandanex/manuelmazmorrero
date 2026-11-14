# Manolo el Mazmorrero

A mobile-first, single-player dungeon crawler. Original screenprinted character artwork, Spanish text, original procedural sound effects and a six-track soundtrack. An unofficial fan-inspired birthday game; not affiliated with the book series. No actual gift-box items are used in the gameplay.

## Run

Requires Node.js 20 or later. No package installation is needed.

```sh
npm run dev
```

Open `http://localhost:4173`. To test on a phone, connect it to the same Wi-Fi as the computer and open the LAN URL printed by the server. The computer must stay awake and the server must keep running. VPNs and client-isolated Wi-Fi may prevent access.

This is a local preview, not a public deployment. The public website can be hosted as static files (`index.html`, `style.css`, `src/`, `assets/webp/`, `assets/icons/`, `assets/fonts/`, `assets/audio/`). No build step, backend, accounts, analytics or API keys are required. Fonts are self-hosted and their OFL licenses are in `assets/fonts/`. Phosphor Bold icons are vendored with the MIT license in `assets/icons/`. Gameplay makes no external requests. Generate the gift QR only after choosing and verifying the final HTTPS address.

## Play

- Move: left touch joystick, WASD or arrow keys.
- Attack: hold the attack button, Space or J. Short-range attacks aim at a nearby enemy.
- Dodge: dodge button, Shift or K. Brief invulnerability, followed by a cooldown.
- Pause: pause button, P or Escape. Losing window focus also pauses the game.
- Audio: music and effects are enabled by default and start on the first click, tap or key press permitted by the browser. The sound toggle still mutes both. Adjust effects and music independently in Help or Pause. Volume preferences are saved locally; each new page load defaults to sound on. An explicit mute is respected for the current visit.
- Mobile combat owns touch gestures to avoid accidental pinch/double-tap zoom. Normal zoom remains available in the lobby and dialogs. Portrait prioritizes arena width over the large logo; shorter screens also omit the narrator/header, with audio still available in Pause.
- Automatic result screens wait at least one second and require all held keys/fingers to be released, followed by a 200 ms quiet interval. Repeated attack input cannot choose an upgrade or restart a run. Explicit pause/help menus remain immediate.

Each of three floors contains two enemy waves and one boss. El Juicer telegraphs charges, La Acaparadora uses projectile volleys and toxic pools, and the Clon de Krakaren uses destructible shield generators and warning beams. Goblins, Scatterers and malicious llamas replace the original regular enemies without changing their combat roles. These are game adaptations, not claims about canonical abilities. Choose one permanent advantage after each of the first two floors. Death restarts the current floor, not the entire run.

The beginning of the current floor is stored locally in this browser. It is not a mid-combat save and it does not sync across devices. A new run replaces this checkpoint. Victory removes it. The game remains playable if browser storage is unavailable.

## Checks

```sh
npm run check
npm test
```

`src/game.js` contains the deterministic simulation and can be tested without a browser. `src/render.js` owns high-density canvas rendering with generated raster sprites. `src/main.js` handles UI, pointer/keyboard input and local checkpoints. `src/audio.js` owns Web Audio effects, streamed music, volume and lifecycle; `src/audio-config.js` maps the supplied files. `server.mjs` is a small development-only static server.

## Current limitations

- No multiplayer, online leaderboard or dynamic AI service; the audience and narrator are scripted fiction.
- The player sprite is a stylized likeness based on the two supplied Manu illustrations. His confident portrait appears beside the unchanged title and in the HUD; the surprised portrait appears on defeat.
- Bosses, waves and upgrades are implemented; difficulty and pacing still need feedback from real mobile play.
- Touch and responsive behavior can be browser-tested, but final acceptance should include the intended physical phone and its browser.
- Canvas combat is visual and is not fully playable with a screen reader. Menus and controls have keyboard and accessible labels; reduced-motion settings disable shake, idle bobbing and dodge trails.

## Visual direction

The approved visual system uses the first editorial-screenprint concept and the clear adult poses of the second concept. Black, electric yellow, magenta and warm cream replace the muted pixel-art palette. Original art sources, prompts and licenses are kept in `assets/`; references and visual QA evidence are in `docs/redesign/`.

The 480 × 420 simulation, collisions, timings, enemy statistics and save format remain unchanged. The legacy storage key is intentionally retained so existing checkpoints continue working. Artwork must finish loading before play starts; failures provide a reload action rather than starting with invisible enemies.

Generated PNG originals are kept for provenance. The browser loads the smaller WebP files. Regenerate delivery assets with `./scripts/encode-art.sh` if the originals change (requires `cwebp`). See `design-qa.md` for verification and remaining real-device checks.

## Audio verification

31 WAV effects are decoded on the first enabled user interaction; six MP3 tracks are streamed by screen/floor. Combat cues follow simulation outcomes, impacts are capped, danger is prioritized, and pause/background/transitions cancel old sounds. The development server supports encoded filenames, MIME and byte ranges. See `docs/audio-integration/verification.md` for checks and remaining physical-phone listening acceptance.

## Manu identity assets

The original generic hero is preserved for provenance but is no longer loaded in gameplay. `assets/art/hero-manu.png` is the reference-guided replacement, used by the existing idle, attack, facing and dodge-trail rendering. The original two supplied face illustrations are preserved and encoded as WebP for the title/HUD and defeat panel. The title remains **Manolo el Mazmorrero**. See `docs/manu-identity/verification.md`.

## Enemy artwork

The approved six-role replacement set is stored as individual transparent PNGs under `assets/art/enemies/`, with WebP delivery copies under `assets/webp/enemies/`. Prompts and the mapping manifest are stored beside the PNGs. Technical role IDs and audio event names remain stable. The generators, increased sprite sizes and Manu player art are preserved. See `docs/enemy-redesign/verification.md`.

## Mobile interaction regressions

`src/transition-guard.js` tracks physical input separately from simulation input. Its deterministic tests run with `npm test`; local browser regression scripts live in `tests/browser/`. See `docs/mobile-fixes/verification.md` for before/after measurements, browser checks and physical-device limitations.
