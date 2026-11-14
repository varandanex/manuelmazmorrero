"""Render original procedural SFX. Requires Python 3 and NumPy, not at runtime.

Run from any directory: python3 scripts/generate_sfx.py
No recordings, music, network services or third-party samples are used.
"""
from pathlib import Path
import html
import json
import wave
import zipfile

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets' / 'audio' / 'sfx'
REVIEW = ROOT / 'output' / 'audio'
RATE = 44100
RNG = np.random.default_rng(137)


def timeline(duration):
    return np.arange(round(duration * RATE)) / RATE


def envelope(t, attack=.004, decay=12):
    return np.minimum(1, t / attack) * np.exp(-decay * t)


def tone(duration, start, end=None, decay=12, fm=0, attack=.004):
    t = timeline(duration)
    end = start if end is None else end
    frequency = start * (end / start) ** (t / duration)
    phase = np.cumsum(frequency) * (2 * np.pi / RATE)
    return np.sin(phase + fm * np.sin(phase * 1.713) * np.exp(-8 * t)) * envelope(t, attack, decay)


def noise(duration, low=100, high=6000, decay=15, attack=.003):
    t = timeline(duration)
    source = RNG.normal(0, 1, len(t))
    frequencies = np.fft.rfftfreq(len(t), 1 / RATE)
    band = (1 - np.exp(-(frequencies / low) ** 4)) * np.exp(-(frequencies / high) ** 4)
    result = np.fft.irfft(np.fft.rfft(source) * band, n=len(t))
    result /= max(.001, np.sqrt(np.mean(result ** 2))) * 3
    return result * envelope(t, attack, decay)


def mix(*layers):
    result = np.zeros(max(round(offset * RATE) + len(sound) for offset, sound in layers))
    for offset, sound in layers:
        at = round(offset * RATE)
        result[at:at + len(sound)] += sound
    return result


def impact(duration=.24, frequency=150):
    return mix((0, tone(duration, frequency, 52, 22, .7)),
               (0, .65 * noise(duration, 400, 6500, 38)),
               (.012, .17 * tone(duration, 1210, 790, 35, 1.2)))


def metal(duration=.4, frequency=420):
    return sum(tone(duration, frequency * ratio, decay=9 + i * 7) / (i + 1)
               for i, ratio in enumerate([1, 1.431, 2.317, 3.82]))


def whoosh(duration=.24, frequency=650):
    t = timeline(duration)
    return noise(duration, 500, 5000, 3, .04) * np.sin(np.pi * t / duration) ** 1.5 + .16 * tone(duration, frequency, 110, 15)


def warning(duration=1.1, frequency=430):
    t = timeline(duration)
    gate = .15 + .85 * ((np.sin(2 * np.pi * (3 * t + 2 * t * t)) + 1) / 2) ** 4
    return tone(duration, frequency, frequency * 1.65, .25, .8, .015) * gate


def bubble(duration=.7):
    return mix((0, .3 * noise(duration, 140, 1500, 5, .03)),
               *[(at, volume * tone(.16, frequency, frequency * .38, 24, 1.1))
                 for at, frequency, volume in [(0, 430, .7), (.045, 610, .4), (.13, 340, .6), (.23, 760, .3), (.36, 290, .3)]])


def write_wav(path, signal):
    with wave.open(str(path), 'wb') as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(np.round(signal * 32767).astype('<i2').tobytes())


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    REVIEW.mkdir(parents=True, exist_ok=True)
    sounds = []

    def add(name, label, use, signal, peak=.60):
        signal = signal - np.mean(signal)
        signal = np.tanh(signal * 1.15)
        fade = min(round(.008 * RATE), len(signal) // 4)
        signal[:fade] *= np.linspace(0, 1, fade)
        signal[-fade:] *= np.linspace(1, 0, fade)
        # Preserve relative mix priorities, rather than maximizing every cue.
        signal *= peak / max(.001, np.max(np.abs(signal)))
        signal = np.concatenate([signal, np.zeros(round(.025 * RATE))])
        write_wav(DEST / f'{name}.wav', signal)
        sounds.append((dict(id=name, label=label, trigger=use, file=f'{name}.wav',
                            duration=round(len(signal) / RATE, 3),
                            peak_dbfs=round(20 * np.log10(peak), 2)), signal))

    for i, pitch in enumerate([150, 166, 137], 1):
        add(f'attack_swing_{i:02}', f'Ataque al aire {i}', 'Accepted player attack, including misses.', whoosh(.18, pitch * 4), .34)
        add(f'hit_enemy_{i:02}', f'Impacto en enemigo {i}', 'Successful nonlethal hit; alternate variants.', impact(frequency=pitch), .60)
    add('hit_heavy', 'Impacto fuerte', 'Successful hit during boss recovery; replaces ordinary impact.', mix((0, impact(.35, 105)), (.025, .3 * metal(.30, 260))), .68)
    add('dash', 'Esquiva', 'Accepted dodge, never on a cooldown-rejected input.', whoosh(.24, 930), .47)
    add('player_hurt', 'Daño recibido', 'Player takes damage; honor invulnerability interval.', mix((0, impact(.35, 210)), (.02, .45 * tone(.30, 340, 85, 9, 2))), .72)
    add('enemy_death', 'Enemigo derrotado', 'Enemy dies; replace ordinary impact for that target.', mix((0, impact(.3, 110)), (.03, .4 * noise(.32, 600, 4500, 13))), .51)
    add('projectile_cast', 'Disparo enemigo', 'Once per volley, not once per projectile.', mix((0, .4 * noise(.22, 1200, 7000, 30)), (0, tone(.23, 1150, 240, 18, 1.4))), .43)
    add('poison_warning', 'Aviso de veneno', 'Once when poison telegraph appears, 1.25 seconds before activation.', mix((0, .4 * bubble()), (0, .45 * warning(.65, 310))), .53)
    add('poison_activate', 'Veneno activo', 'Once when a pool delay crosses zero, never every update.', bubble(), .40)
    add('beam_warning', 'Aviso de rayo', 'Once per beam volley at telegraph start; 1.15-second lead time.', warning(1.1, 630), .63)
    add('beam_fire', 'Descarga del rayo', 'Once when beam delay crosses zero.', mix((0, noise(.40, 700, 8000, 13)), (0, .5 * tone(.36, 1700, 110, 14, 2))), .65)
    add('shield_block', 'Golpe contra escudo', 'Attack blocked by the host shield; not a successful hit.', metal(.27, 770), .48)
    add('generator_destroy', 'Emisor destruido', 'Generator dies; replaces ordinary enemy death.', mix((0, impact(.5, 90)), (0, .5 * metal(.60, 320)), (.08, .5 * noise(.60, 200, 4800, 7))), .68)
    add('shield_break', 'Escudo desactivado', 'Last living generator destroyed; once per shield phase.', mix((0, metal(.65, 620)), (.07, .5 * tone(.6, 820, 65, 7, 3)), (.10, .3 * noise(.5, 1500, 6000, 7))), .57)
    add('boss_intro', 'Entrada de jefe', 'Once per boss encounter, not both announcement and spawn.', mix((0, tone(.95, 145, 62, 4, 2)), (0, .3 * metal(.85, 210)), (.06, .4 * noise(.75, 80, 1700, 5))), .65)
    add('butcher_windup', 'Preparación de embestida', 'Butcher enters windup, 1.1 seconds before charge.', mix((0, warning(1.05, 230)), (0, .25 * noise(1.05, 500, 2800, 1, .12))), .60)
    add('butcher_charge', 'Embestida', 'Butcher transitions from windup to charge.', mix((0, whoosh(.45, 380)), (0, .6 * tone(.45, 160, 70, 6, 2))), .57)
    add('boss_recover', 'Jefe vulnerable', 'Butcher stops charging and enters recovery.', mix((0, impact(.45, 85)), (.025, .35 * metal(.42, 270))), .57)
    add('host_phase_two', 'Cambio de reglas', 'Host reaches half health and restores shield; once.', mix((0, warning(.75, 320)), (.16, .6 * metal(.65, 450)), (.38, .45 * noise(.55, 500, 4500, 8))), .67)
    add('heal', 'Botiquín', 'Pickup collected; do not duplicate during floor reset.', mix((0, tone(.32, 510, 1250, 13)), (0, .2 * noise(.3, 2500, 7500, 19))), .43)
    add('ui_confirm', 'Confirmación', 'One activation per menu button, not pointerdown plus click.', mix((0, tone(.08, 690, 540, 35)), (0, .18 * noise(.08, 600, 3000, 45))), .28)
    add('upgrade_select', 'Mejora elegida', 'Successful upgrade selection; replaces generic confirmation.', mix((0, metal(.25, 920)), (.04, .45 * tone(.36, 430, 1600, 10))), .45)
    add('floor_start', 'Inicio de piso', 'Floor starts or restarts; delay if overlapping upgrade selection.', mix((0, .4 * metal(.55, 310)), (.06, .5 * whoosh(.5, 850)), (.20, .35 * impact(.35, 110))), .48)
    add('player_death', 'Señal interrumpida', 'Lethal player damage; replaces ordinary hurt.', mix((0, impact(.6, 170)), (.05, .65 * tone(.9, 500, 36, 3, 2)), (.34, .3 * noise(.65, 800, 7000, 6))), .66)
    add('retry', 'Reintento', 'Retry confirmation; sequence before floor start.', mix((0, .6 * noise(.3, 400, 2800, 14)), (.04, .7 * tone(.25, 140, 680, 15))), .40)
    add('boss_defeat', 'Jefe derrotado', 'Boss death; replaces generic kill, no musical fanfare.', mix((0, impact(.7, 85)), (.08, .7 * metal(.8, 370)), (.18, .3 * noise(.8, 600, 6000, 5))), .68)
    add('victory', 'Fin del espectáculo', 'Final victory: use instead of boss_defeat, not on top of it.', mix((0, impact(.9, 100)), (.05, .6 * metal(1.1, 560)), (.15, .5 * tone(.9, 160, 1700, 5)), (.25, .3 * noise(.9, 1500, 8000, 5))), .68)

    manifest = dict(sample_rate=RATE, channels=1, bit_depth=16,
                    source='Original deterministic procedural synthesis; no samples or music.',
                    integrated=False, sounds=[meta for meta, _ in sounds])
    (DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    selected = ['attack_swing_01', 'hit_enemy_01', 'hit_heavy', 'dash', 'player_hurt',
                'projectile_cast', 'poison_warning', 'poison_activate', 'beam_warning', 'beam_fire',
                'shield_block', 'generator_destroy', 'butcher_windup', 'butcher_charge',
                'host_phase_two', 'heal', 'upgrade_select', 'player_death', 'victory']
    lookup = {meta['id']: (meta, audio) for meta, audio in sounds}
    segments, cues, position = [np.zeros(round(.3 * RATE))], [], .3
    for name in selected:
        meta, audio = lookup[name]
        cues.append(f"{position:05.2f}s — {meta['label']}")
        segments.extend([audio, np.zeros(round(.4 * RATE))])
        position += len(audio) / RATE + .4
    write_wav(REVIEW / 'sfx-preview.wav', np.concatenate(segments))
    (REVIEW / 'preview-order.txt').write_text('\n'.join(cues) + '\n')
    rows = ''.join(f'<article><h2>{html.escape(m["label"])}</h2><code>{m["file"]}</code><audio controls preload="none" src="../../assets/audio/sfx/{m["file"]}"></audio></article>' for m, _ in sounds)
    (REVIEW / 'index.html').write_text('''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Efectos · Manolo el Mazmorrero</title><style>body{background:#141414;color:#fff3d5;font:16px system-ui;max-width:1100px;margin:40px auto;padding:20px}h1{color:#eefa00}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px}article{padding:20px;border:1px solid #555;border-radius:12px}h2{font-size:18px}code{display:block;color:#ccc;font-size:12px;margin-bottom:16px}audio{width:100%}</style><h1>Efectos · Manolo el Mazmorrero</h1><p>Síntesis original · Sin música · Todavía no integrados en el juego. Empieza con un volumen bajo.</p><main>''' + rows + '</main></html>')
    (DEST / 'README.md').write_text('''# Original game SFX

31 mono PCM WAV effects, 44.1 kHz / 16 bit. No music, recordings or external samples.
Created procedurally for this game. Not wired into gameplay yet.
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
''')
    with zipfile.ZipFile(REVIEW / 'manolo-sfx.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(DEST.iterdir()):
            if path.is_file():
                archive.write(path, f'assets/audio/sfx/{path.name}')
        archive.write(Path(__file__), 'scripts/generate_sfx.py')
    print(f'Generated {len(sounds)} effects and {position:.2f}s preview.')


if __name__ == '__main__':
    main()
