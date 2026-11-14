# Audio integration verification

## Scope
31 existing WAV effects and six supplied MP3 themes integrated. No audio files regenerated, retuned or moved. Game mechanics and the checkpoint format are unchanged. No deployment or publication.

## Implementation
- Simulation events now distinguish accepted attacks, misses, nonlethal hits, heavy recovery hits, shield blocks, generator/shield destruction and terminal outcomes.
- Boss intro fires at spawn only. Butcher transitions, host half-health phase and one warning/activation per hazard volley are explicit. Cast is emitted once per volley, not projectile.
- Separate effects/music buses, a shared compressor and master headroom, maximum six effect voices/two impacts, priority eviction and independent variant rotation.
- UI sound is not emitted on combat pointer events. Retry/upgrade cues precede floor start. Final victory replaces boss defeat; lethal damage replaces hurt.
- Streamed themes: lobby, three floors, upgrades and non-looping victory. Death is silent after its effect. Terminal music waits for the dry terminal effect. New tracks fade in over 250 ms.
- Attenuation-only track trims use rough RMS measurements in music-levels.json. No pitch or file changes; this is not perceptual loudness certification.
- Audio stays off until a gesture. Help/Pause expose independent volumes, with optional local preference storage. Background/pauses stop effects and pending sequences, pause music and never replay old warnings.
- Safe local HTTP delivery supports Unicode/spaced MP3 names, audio MIME, single/open/suffix byte ranges and HEAD. Documents/traversal/symlinks stay outside the asset surface.

## Automated verification
- 45 tests passed; npm run check passed. See test-results.txt.
- check-mechanics.mjs compared 28,800 frames across four seeds and all floors against the pre-audio snapshot: identical state excluding audio-only events/metadata.
- Tests cover real simulation cues, buffers and media through external browser boundaries, failed loads/playback, late promise rejection, pause/background/mute cancellation, terminal sequencing, independent volumes, all 31 asset mappings and six music files, HTTP ranges/MIME/path restrictions.

## Browser verification
- In-app Chromium, actual user-gesture activation: AudioContext running; all 31 effects fetched/decoded, missing=[]; no console errors/warnings.
- Actual media playback verified for all six MP3s. Spaced and Chinese filenames loaded correctly. Final fanfare loop=false, readyState=4.
- Real attack/dodge buttons, pause/resume, volume sliders, upgrade selection, death/retry and return to lobby exercised. Boss terminal scenarios used temporary in-memory fixtures, not shipped cheats.
- Paused music time remained 8.026667 s while editing volumes; resumed from that position. Blur handler stopped music/paused gameplay; focus did not silently resume gameplay.
- 390×844 and 320×568 layouts: no horizontal overflow; long dialogs scroll at 320 px. Screenshot: audio-controls-390.png.
- Test hooks/interception/viewport overrides removed; original checkpoint restored and test volume preferences removed. Clean reload starts muted.

## Remaining acceptance
Subjective mix, iOS Safari/Android hardware playback, interruption by calls/lock screen, touch feel and final listening on the intended physical phone have not been verified. No claim of device-level auditory acceptance.

## API references
- [Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): user-gesture activation.
- [MediaElementAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode): media routed through an independent gain bus.
- [AudioScheduledSourceNode.stop](https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/stop): cancel active/scheduled sources.
- [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests): partial media delivery.
