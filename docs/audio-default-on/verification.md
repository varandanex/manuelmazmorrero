# Default-on music and effects

## Requested behavior

Music and sound effects are enabled on each new visit, without a separate activation step. This supersedes the earlier opt-in decision recorded in `docs/audio-integration/`.

## Implementation

- `src/audio.js` initializes its enabled preference to true, but still creates browser audio resources lazily.
- `src/main.js` unlocks audio on a click/tap or non-repeated key press. Existing start/continue handlers also unlock it, so entering combat does not require the sound toggle.
- Global click handling runs after button actions: choosing mute does not briefly start music, and subsequent interactions do not undo an explicit mute.
- Initial HTML and accessible toggle state display ON. New visits reset the enabled flag to ON; saved music/effects volume levels remain respected.
- Pause, background behavior and the existing error fallback are unchanged.

The first interaction is used to respect browser autoplay requirements rather than attempting to bypass them. See [Chrome's autoplay policy](https://developer.chrome.com/blog/autoplay) for the Web Audio resume requirement.

## Verification

- Updated the existing audio contract and added a mute/new-visit regression. Both failed against the old default and passed after the change.
- Full suite: **53 tests passed**, including the earlier mobile fixes. Syntax checks and whitespace checks passed.
- Real browser: initial state ON, with no audio context or media element created before interaction.
- A native click on the noninteractive title started `Welcome to the Dungeon.mp3`; the context was running, media was playing and all 31 effects were decoded without missing files.
- Continue started `Dungeon Showdown.mp3` without touching the sound toggle; an actual decoded dash effect could play.
- Mute stopped music and blocked effects. A later movement key did not re-enable sound.
- Clean reload showed ON again. No console warnings/errors. Temporary probes were removed, viewport override cleared and original checkpoint restored.

`default-on-mobile.png` shows the clean initial ON state. These checks were performed locally before repository publication, alongside the mobile interaction fixes. A VPS deployment must be verified separately.
