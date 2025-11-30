for f in fulls/*.jpg; do
    base=$(basename "$f")
    convert "$f" -resize 50% -quality 50 "thumbs/$base"
done
