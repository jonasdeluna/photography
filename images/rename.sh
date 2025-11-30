#!/bin/bash

# Folder with full images
FULLS_DIR="fulls"

# Make sure exiftool is installed
command -v exiftool >/dev/null 2>&1 || { echo "exiftool is required. Install it first."; exit 1; }

# Rename each file: prefix with EXIF timestamp, keep original name
# Format: YYYYMMDD_HHMMSS_originalname.ext
exiftool -overwrite_original \
  '-FileName<DateTimeOriginal' \
  -d "%Y%m%d_%H%M%S_%%f.%%e" \
  "$FULLS_DIR"

echo "Done! Files in $FULLS_DIR are now prefixed with EXIF timestamp."

