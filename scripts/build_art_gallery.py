#!/usr/bin/env python3
"""Package only the authored character dossiers; never scan legacy source art."""
from hashlib import sha256
import json
from pathlib import Path
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CARDS = ROOT / 'assets/cards'
ARCHIVE = ROOT / 'assets/downloads/manolo-fichas-personajes.zip'


def build():
    manifest = json.loads((CARDS / 'manifest.json').read_text())
    if len(manifest['cards']) != 13:
        raise ValueError('Expected Manolo, seven enemies and five bosses')
    for relative, expected in manifest['sourceHashes'].items():
        if sha256((ROOT / relative).read_bytes()).hexdigest() != expected:
            raise ValueError(f'Stale card export; regenerate PNGs first: {relative}')
    items = []
    ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
    temporary = ARCHIVE.with_suffix('.zip.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_STORED) as archive:
            for card in manifest['cards']:
                path = CARDS / card['filename']
                if path.is_symlink() or not path.resolve().is_relative_to(CARDS.resolve()):
                    raise ValueError(f'Card must be local: {path}')
                data = path.read_bytes()
                if data[:8] != b'\x89PNG\r\n\x1a\n':
                    raise ValueError(f'Invalid PNG: {path}')
                width, height = struct.unpack('>II', data[16:24])
                if (width, height) != (1600, 2400):
                    raise ValueError(f'Incorrect card dimensions: {path}')
                entry = f'manolo-fichas/{path.name}'
                info = zipfile.ZipInfo(entry, date_time=(1980, 1, 1, 0, 0, 0))
                info.external_attr = 0o644 << 16
                archive.writestr(info, data)
                items.append(dict(**card, url=f'/assets/cards/{path.name}', entry=entry, width=width,
                                  height=height, bytes=len(data), sha256=sha256(data).hexdigest()))
        temporary.replace(ARCHIVE)
    finally:
        temporary.unlink(missing_ok=True)
    bundle = dict(url='/' + ARCHIVE.relative_to(ROOT).as_posix(), filename=ARCHIVE.name,
                  count=len(items), bytes=ARCHIVE.stat().st_size, sha256=sha256(ARCHIVE.read_bytes()).hexdigest())
    source = '// Generated character-card download metadata; run npm run gallery:build.\n'
    source += 'export const CARD_DOWNLOADS = ' + json.dumps(items, ensure_ascii=False, indent=2) + ';\n'
    source += 'export const ART_ARCHIVE = ' + json.dumps(bundle, ensure_ascii=False, indent=2) + ';\n'
    (ROOT / 'src/art-gallery-data.js').write_text(source, encoding='utf-8')
    # Retire the superseded all-art download, while preserving every source PNG.
    (ROOT / 'assets/downloads/manolo-ilustraciones-png.zip').unlink(missing_ok=True)
    print(f'{len(items)} character cards; {bundle["bytes"]:,} bytes; {ARCHIVE.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
