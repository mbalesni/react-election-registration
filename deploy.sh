#!/bin/bash

# small util to easily build and move bundle to bigreg

SRC="./build"
DIST="../bigreg"

pnpm run build

rm -r "$DIST/static/"
rm "$DIST/config/web/html/index.html"

mkdir "$DIST/static"
cp -R "$SRC/static/" "$DIST/static/"
cp "$SRC/index.html" "$DIST/config/web/html/"
cp "$SRC/favicon.ico" "$DIST/static"

echo "Copied files to '$DIST'."

