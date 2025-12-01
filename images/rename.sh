#!/bin/bash

# Folder with full images
FULLS_DIR="fulls"

# Make sure exiftool is installed
command -v exiftool >/dev/null 2>&1 || { echo "exiftool is required. Install it first."; exit 1; }

# Loop over JPG files starting with DSC
for f in "$FULLS_DIR"/DSC*.jpg; do
    # Skip if no files match
    [ -e "$f" ] || continue

    # Rename using EXIF DateTimeOriginal, keeping original name
    exiftool -overwrite_original "-FileName<DateTimeOriginal" -d "%Y%m%d_%H%M%S_%%f.%%e" "$f"
    echo "Renamed $f"
done

echo "Done! Only DSC* files in $FULLS_DIR have been renamed."
