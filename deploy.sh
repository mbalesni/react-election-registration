#!/bin/bash

# small util to easily build and move bundle to bigreg

SRC="./build"
DIST="../client/prod-build"

npm run build

rm -r "$DIST/static/"
rm "$DIST/index.html"
rm "$DIST/favicon.ico"

mkdir "$DIST/static"
cp -R "$SRC/static/" "$DIST/static/"
cp "$SRC/index.html" "$DIST"
cp "$SRC/favicon.ico" "$DIST"

echo "Copied files to '$DIST'."

