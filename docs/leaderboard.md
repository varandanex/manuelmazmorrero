# Shared arcade leaderboard

The game shows a shared top 10 at death and victory and from the main menu. Players may submit 1–3 uppercase letters/numbers. New equal scores rank before older ones; only the last entry is dropped when the list exceeds ten. A repeated request with the same submission ID does not duplicate a retained mark.

## Hosting

Run `npm start` with Node.js 20+ and route both the game and `/api/leaderboard` to that process. Static-only hosting cannot save shared scores. No external service or dependencies are required.

Scores live in `data/leaderboard.json` by default, outside the static-file allowlist. Set `LEADERBOARD_FILE` to an absolute path on a persistent writable volume in production. Back up that file. Use **one server process/replica**: updates are serialized within that process and saved by atomic rename; multiple writers or ephemeral deployment storage are not supported. Do not publish the data directory through a separate web server.

API: `GET /api/leaderboard`; `POST /api/leaderboard` with JSON `{ "id": "<UUID>", "initials": "ABC", "score": 500 }`. Responses are not cached. Invalid/oversized submissions are rejected; storage failures return 503 without resetting the ranking. UI failures do not block replaying and allow retrying a save.

## Trust boundary

This is a casual birthday-game leaderboard, not an authoritative competitive system. Scores are computed in the browser and can be forged by someone deliberately calling the API. Initials are not accounts, and multiple players can use the same initials. For public competitive use, add server-validated runs, submission tokens and proxy rate limits before exposing it at scale.

## Verification

`npm test` covers API persistence, independent clients, new-first ties, top-10 truncation, concurrent writes, retry idempotency, malformed requests, cross-origin rejection and storage corruption. No deployment is performed by this change.

## VPS service

`deploy/manoloelmazmorrero.service` runs a single unprivileged Node process on loopback port 4180. Systemd manages a persistent state directory separate from versioned releases at `/opt/manoloelmazmorrero/releases/<commit>`. The `current` symlink selects the release. Caddy should reverse proxy the existing game virtual host to `127.0.0.1:4180`, retaining the TLS binding and security headers. Never expose the Node port publicly.

Before switching traffic, back up the Caddyfile, validate its candidate configuration, and check the loopback API. Reload Caddy only after the service is healthy. For rollback restore the original virtual-host configuration (or point `current` at the previous release) and reload/restart the affected service only. Never remove the state directory on updates or rollbacks.
