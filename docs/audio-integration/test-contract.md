# Audio integration test contract

The user approved these public test boundaries before new tests were written:

1. Simulation inputs and its emitted event queue: accepted actions, one-shot warnings/activations, volley grouping, terminal outcomes, and unchanged mechanics.
2. Audio controller: opt-in/gesture activation, effect/music volume independence, voice priorities/limits, pause/state cleanup, music selection and transition cancellation. Browser Web Audio, media, network and clock APIs are external test boundaries.
3. Local HTTP delivery: correct WAV/MP3 MIME types, encoded filenames, byte ranges, missing files and traversal protection.

Run existing regression tests and browser checks in addition to these tests. Keep all task artifacts in this project, preserve the supplied music/audio originals, and do not publish.
