#!/usr/bin/env bash
set -euo pipefail

mkdir -p public

rsvg-convert -w 180 -h 180 public/icon.svg -o public/apple-touch-icon.png
cp public/apple-touch-icon.png public/apple-touch-icon-finmonth-v3.png
rsvg-convert -w 192 -h 192 public/icon.svg -o public/icon-192.png
rsvg-convert -w 512 -h 512 public/icon.svg -o public/icon-512.png
magick public/icon-512.png -define icon:auto-resize=16,32,48 public/favicon.ico

echo "FinMonth icons generated from public/icon.svg"
