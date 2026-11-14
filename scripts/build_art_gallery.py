#!/usr/bin/env python3
"""Index every original PNG and package its unchanged bytes in a static ZIP."""
from hashlib import sha256
import json
from pathlib import Path
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets/art'
ARCHIVE = ROOT / 'assets/downloads/manolo-ilustraciones-png.zip'

# Current characters first; source variants remain available in the archive.
LABELS = [
    ('enemies/boss-juicer', 'El Juicer', 'Jefes'),
    ('enemies/boss-hoarder', 'La Acaparadora', 'Jefes'),
    ('enemies/boss-mantaur', 'Humanotauro', 'Jefes'),
    ('enemies/boss-rage-elemental', 'Elemental de furia', 'Jefes'),
    ('enemies/boss-krakaren', 'Clon de Krakaren', 'Jefes'),
    ('enemies/enemy-goblin', 'Goblin', 'Enemigos'),
    ('enemies/enemy-scatterer', 'Desperdigador', 'Enemigos'),
    ('enemies/enemy-evil-llama', 'Llama maligna', 'Enemigos'),
    ('enemies/enemy-drek', 'Drek', 'Enemigos'),
    ('enemies/enemy-jikininki', 'Jikininki', 'Enemigos'),
    ('enemies/enemy-acid-crawler', 'Empalador ácido rastrero', 'Enemigos'),
    ('enemies/enemy-goblin-engineer', 'Ingeniero goblin', 'Enemigos'),
    ('hero-manu-umbrella', 'Manolo y su paraguas', 'Manolo'),
    ('Manu-01-confianza-temeraria', 'Confianza temeraria', 'Manolo'),
    ('Manu-02-caos-absoluto', 'Caos absoluto', 'Manolo'),
    ('logo', 'Manolo el Mazmorrero · Logotipo', 'Extras'),
    ('environments/room-matadero', 'El matadero', 'Escenarios'),
    ('environments/room-jardin', 'El jardín podrido', 'Escenarios'),
    ('environments/room-railway', 'La Maraña de Hierro', 'Escenarios'),
    ('environments/room-furnace', 'El horno de la furia', 'Escenarios'),
    ('environments/room-plato', 'El plató final', 'Escenarios'),
    ('environments/pillar-matadero', 'Pilar industrial', 'Objetos'),
    ('environments/pillar-jardin', 'Tocón del jardín', 'Objetos'),
    ('environments/pillar-plato', 'Pedestal del plató', 'Objetos'),
    ('generator', 'Emisor del escudo', 'Objetos'),
    ('hero-manu', 'Manolo con llave inglesa', 'Versiones anteriores'),
    ('hero', 'Héroe · Diseño inicial', 'Versiones anteriores'),
    ('portrait', 'Retrato · Diseño inicial', 'Versiones anteriores'),
    ('grunt', 'Enemigo cuerpo a cuerpo · Diseño inicial', 'Versiones anteriores'),
    ('bat', 'Enemigo veloz · Diseño inicial', 'Versiones anteriores'),
    ('caster', 'Enemigo a distancia · Diseño inicial', 'Versiones anteriores'),
    ('butcher', 'Jefe del matadero · Diseño inicial', 'Versiones anteriores'),
    ('spore', 'Jefe del jardín · Diseño inicial', 'Versiones anteriores'),
    ('host', 'Jefe del plató · Diseño inicial', 'Versiones anteriores'),
    ('room', 'El matadero · Diseño inicial', 'Versiones anteriores'),
    ('room-spore', 'El jardín · Diseño inicial', 'Versiones anteriores'),
    ('room-host', 'El plató · Diseño inicial', 'Versiones anteriores'),
    ('pillar', 'Pilar · Diseño inicial', 'Versiones anteriores'),
]


def build():
    paths = {p.relative_to(ART).with_suffix('').as_posix(): p for p in ART.rglob('*.png')}
    labels = {key: (name, category) for key, name, category in LABELS}
    order = [key for key, _, _ in LABELS if key in paths]
    order += sorted(paths.keys() - labels.keys())
    items = []
    ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
    temporary = ARCHIVE.with_suffix('.zip.tmp')
    try:
        # PNGs are already compressed. STORE avoids recompression and is lossless.
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_STORED) as archive:
            for key in order:
                path = paths[key]
                if path.is_symlink() or not path.resolve().is_relative_to(ART.resolve()):
                    raise ValueError(f'Original must be local, not a symlink: {path}')
                data = path.read_bytes()
                if data[:8] != b'\x89PNG\r\n\x1a\n':
                    raise ValueError(f'Invalid PNG: {path}')
                width, height = struct.unpack('>II', data[16:24])
                preview = ROOT / f'assets/webp/{key}.webp'
                if not preview.is_file():
                    raise ValueError(f'Missing lightweight preview: {preview}')
                name, category = labels.get(key, (path.stem.replace('-', ' '), 'Archivo'))
                entry = f'manolo-ilustraciones/{key}.png'
                info = zipfile.ZipInfo(entry, date_time=(1980, 1, 1, 0, 0, 0))
                info.external_attr = 0o644 << 16
                archive.writestr(info, data)
                items.append(dict(id=key, name=name, category=category,
                                  preview=f'/assets/webp/{key}.webp', original=f'/assets/art/{key}.png',
                                  filename=path.name, entry=entry, width=width, height=height,
                                  bytes=len(data), sha256=sha256(data).hexdigest()))
        temporary.replace(ARCHIVE)
    finally:
        temporary.unlink(missing_ok=True)
    bundle = dict(url='/' + ARCHIVE.relative_to(ROOT).as_posix(), filename=ARCHIVE.name,
                  count=len(items), bytes=ARCHIVE.stat().st_size, sha256=sha256(ARCHIVE.read_bytes()).hexdigest())
    source = '// Generated by scripts/build_art_gallery.py; do not hand-edit metadata.\n'
    source += 'export const GALLERY_ART = ' + json.dumps(items, ensure_ascii=False, indent=2) + ';\n'
    source += 'export const ART_ARCHIVE = ' + json.dumps(bundle, ensure_ascii=False, indent=2) + ';\n'
    (ROOT / 'src/art-gallery-data.js').write_text(source, encoding='utf-8')
    print(f'{len(items)} original PNGs; {bundle["bytes"]:,} bytes; {ARCHIVE.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
