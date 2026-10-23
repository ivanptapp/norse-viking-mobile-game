from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path("public/sprites/lagertha")
OUTPUT = ROOT / "previews" / "coordenadas"
ANIMATIONS = ["idle", "walk", "dead"]

OUTPUT.mkdir(parents=True, exist_ok=True)

for animation in ANIMATIONS:
    source = ROOT / f"{animation}.png"

    if not source.exists():
        continue

    image = Image.open(source).convert("RGBA")
    background = Image.new("RGB", image.size, "white")
    background.paste(image, mask=image.getchannel("A"))

    draw = ImageDraw.Draw(background)
    step = 50

    # Cuadrícula con coordenadas para localizar cada personaje.
    for x in range(0, image.width, step):
        draw.line((x, 0, x, image.height), fill=(190, 190, 190), width=1)
        draw.text((x + 2, 2), str(x), fill=(0, 0, 0))

    for y in range(0, image.height, step):
        draw.line((0, y, image.width, y), fill=(190, 190, 190), width=1)
        draw.text((2, y + 2), str(y), fill=(0, 0, 0))

    destination = OUTPUT / f"{animation}-coordenadas.png"
    background.save(destination)
    print(f"Generado: {destination}")

print("\nDiagnóstico terminado. Los originales siguen intactos.")
