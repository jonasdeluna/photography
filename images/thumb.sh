mkdir -p thumbs

for f in fulls/*.jpg; do
    base=$(basename "$f")
    thumb="thumbs/$base"

    # Only create thumbnail if it doesn't already exist
    if [ ! -f "$thumb" ]; then
        convert "$f" -resize 50% -quality 50 "$thumb"
        echo "Created $thumb"
    else
        echo "Skipping $thumb, already exists"
    fi
done
