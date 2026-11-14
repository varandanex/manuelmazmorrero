# Original game SFX

31 mono PCM WAV effects, 44.1 kHz / 16 bit. No music, recordings or external samples.
Created procedurally for this game. Integrated into gameplay through `src/game.js`, `src/audio.js` and `src/audio-config.js`.
Regeneration recreates the original manifest and resets its integration flag; verify it before replacing an integrated manifest.
Regenerate with `python3 scripts/generate_sfx.py` (NumPy required).
Review individually in `output/audio/index.html`; the montage is `output/audio/sfx-preview.wav`.

## Integration contract

- Use `manifest.json` for event triggers. Three swing and hit variants reduce repetition.
- Use successful simulation events, not raw button presses, for combat sounds.
- Trigger hazards once when their delay crosses zero, never on each simulation tick.
- Emit one casting sound per volley. Cap overlapping impact voices; prioritize danger and player damage.
- Separate SFX volume from music. Preserve gesture-based audio unlock and opt-in behavior.
- Stop warnings and pending sounds on pause, death, floor transition or loss of focus.
- These are dry, non-looping effects. Their fades and trailing silence prevent abrupt file edges.
- Final mixing and subjective listening acceptance still need testing on the target phone.
