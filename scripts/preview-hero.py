from pathlib import Path
from PIL import Image, ImageDraw
import json
import sys

if len(sys.argv) < 2:
    print("Uso: python scripts/preview-hero.py ragnar")
    sys.exit(1)

hero = sys.argv[1].lower()

hero_dir = Path("assets/hero-parts") / hero
parts_dir = hero_dir / "parts"
json_path = hero_dir / "parts.json"

if not json_path.exists():
    sys.exit(f"No se encuentra: {json_path}")

with json_path.open(encoding="utf-8") as file:
    data = json.load(file)

width = data["canvas_width"]
height = data["canvas_height"]

canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))

# Restaurar cada pieza en su posición original.
for part in data["parts"]:
    path = parts_dir / part["file"]

    if not path.exists():
        print(f"No se encuentra la pieza: {path}")
        continue

    with Image.open(path) as source:
        piece = source.convert("RGBA")

    x = part["x"]
    y = part["y"]

    canvas.alpha_composite(piece, (x, y))

output = hero_dir / "reconstructed.png"
canvas.save(output)

print(f"Personaje reconstruido: {output}")
print(f"Dimensiones: {width}x{height}")
print(f"Piezas procesadas: {len(data['parts'])}")
