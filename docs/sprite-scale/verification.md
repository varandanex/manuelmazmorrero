# Larger character artwork

## Request and scope
Increase the small in-game illustrations, especially for mobile play. Preserve the approved artwork, title, room size, controls and combat mechanics. All deliverables stay in the project; no publication.

## Change
Only src/render.js changed in the application. Shared visual heights now apply consistently to player animation and dodge trails:

| Artwork | Previous world height | New world height |
| --- | ---: | ---: |
| Manolo | 57 | 78 |
| Grunt | 48 | 66 |
| Bat | 42 | 58 |
| Caster | 54 | 74 |
| Butcher | 96 | 116 |
| Spore | 101 | 122 |
| Host | 88 | 106 |
| Generator | 47 | 60 |

At a 366 px arena width (390 px mobile viewport), Manolo's drawn image height increases from 43.46 to 59.48 CSS px. Boss height is capped near the north canvas edge to keep tall artwork visible. The host's decorative shield follows its visual size. Hitboxes, foot anchors, warning geometry, attack arcs, damage and cooldowns are unchanged.

## Verification
- npm test: all 45 existing tests pass. npm run check passes.
- src/game.js SHA-256 matches its pre-change value (game-before.sha256).
- Side-by-side browser comparison uses identical scene data, time, canvas scale and viewport width; only the renderer differs. Saved as before-after.png.
- North-boundary and shield/beam fixture inspected: north-boundary-and-shield.png.
- Native keyboard movement, held attack and dodge exercised at 390×844 in the actual UI. No console warnings/errors. Screenshot: game-mobile-390.png.
- Temporary browser overlays and module hooks removed; viewport override cleared; existing checkpoint unchanged.
- Rendering snapshot before the change: render-before.js. It is an archival source copy, not a production module.
