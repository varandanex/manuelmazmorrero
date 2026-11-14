# Approved visual implementation

## Decision
Use concept 1 as the complete visual system; borrow only concept 2's clear adult anatomy and action poses. The game is named **Manolo el Mazmorrero**. The physical gift-box contents remain unrelated to gameplay.

## Design tokens
- Ink `#0B0B0E`; paper `#F4EDDD`; yellow `#FFE000`; magenta `#ED147B`.
- Orange `#FF5738` is reserved for low health. Green is a functional poison/healing cue retained from the existing game, not the identity palette.
- Generated irregular logo; Barlow Condensed 800 for display/actions; Inter for readable body text; IBM Plex Mono for compact telemetry. Existing local font files and licenses retained.
- Signature: original screenprinted lettering, barefoot improvised-weapon protagonist, cream masonry with industrial hazard markings, magenta attack telegraphs.
- Layout: logo → player HUD → arena → boss bar/objective → system commentary → thumb controls. On short screens the extra logo gives way to the arena. Desktop keyboard users get the existing progression sidebar without duplicated mobile controls.

## Artwork
Original PNG assets and generation prompts live in `assets/art/`. Delivery assets are dimension-preserving WebP re-encodes in `assets/webp/`; `scripts/encode-art.sh` reproduces them with the local `cwebp` encoder. The manifest is `docs/redesign/assets.json`. Fourteen originals cover the logo, portrait, player, seven enemy/emitter sprites, collision pillar and three environment variants. No publisher cover art is shipped inside the game.

The production arena intentionally retains the existing 480 × 420 world, four pillars and combat scale rather than copying the concept's tall illustration literally. Generated sprites preserve complete silhouettes. The quieter floor and smaller actors keep several moving enemies and accurate attack geometry readable. The 960 × 840 canvas backing store improves raster quality without changing world coordinates.

Icons: vendored Phosphor Bold SVG files, unmodified, MIT license in `assets/icons/LICENSE`. Source: https://github.com/phosphor-icons/core (retrieved 2026-11-14).

## Behavior preservation
Comparing `src/game.js` with `docs/redesign/before-source.tar.gz` confirms that its only change is the displayed name, Manu → Manolo. Enemy statistics, simulation, collisions, timing, upgrades and checkpoint format are identical. The legacy `manu-dungeon-checkpoint-v1` key is retained deliberately. Existing Spanish UI remains Spanish.

## Loading robustness
The entry action remains disabled until all required sprites decode. Missing artwork surfaces an explicit reload action; gameplay cannot start with invisible enemies. A browser-injected failed image exposed a race where later progress callbacks replaced the error copy. The loader now suppresses progress callbacks after the first failure, with a regression test and a verified browser retry.

## Scope and follow-up
Local preview only. No deployment, public QR, accounts, analytics or external game services were added. Next acceptance step is a play-through on the intended physical phone, then an explicitly approved deployment and final HTTPS QR.
