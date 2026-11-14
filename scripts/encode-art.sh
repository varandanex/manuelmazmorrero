#!/bin/sh
# Re-encode generated originals for delivery; preserve dimensions and alpha.
set -eu
cd "$(dirname "$0")/.."
mkdir -p assets/webp
for source in assets/art/*.png assets/art/enemies/*.png; do
  name=${source#assets/art/}
  name=${name%.png}
  mkdir -p "assets/webp/$(dirname "$name")"
  cwebp -quiet -mt -q 90 -alpha_q 100 "$source" -o "assets/webp/$name.webp"
done
