# Distinct lobby actions

- Continue, New game and Rules now share large, full-width button shapes and 12 px spacing. Continue uses yellow; New game uses a cream border; Rules uses a magenta border. Each keeps its own icon and the approved pixel typography.
- Save refreshes change the New game emphasis and label without discarding its button class or icon. Without a checkpoint, Continue stays hidden and starting the game becomes the primary action.
- The existing restart confirmation remains in place.

## Checks

- `npm run check` and all 55 Node tests passed.
- 118 browser assertions passed: six viewport sizes, return from Pause and no-checkpoint state. Checked border visibility, distinct treatments, consistent width, tap targets, spacing, text fit and font.
- Native actions verified New game confirmation/cancellation, Rules via Tab/Enter, closing with Escape, and Continue restoring a second-floor checkpoint with its health upgrade.
- No captured browser console warnings/errors.
- Tests used a separate 127.0.0.1 origin, with its original checkpoint restored afterward. The active localhost game and its checkpoint were not replaced. The final preview reads the real localhost checkpoint without starting a game.
- No commit, push or deployment.

See `menu-mobile.png`, `browser-results.json` and `test-results.txt` for evidence.
