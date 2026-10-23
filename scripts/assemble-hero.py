from pathlib import Path
from PIL import Image
import json
import sys

if len(sys.argv) < 2:
    print("Uso: python scripts/assemble-hero.py ragnar")
    sys.exit(1)

hero = sys.argv[1].lower()

hero_dir = Path("assets/hero-parts") / hero
parts_dir = hero_dir / "parts"
json_path = hero_dir / "parts.json"

if not json_path.exists():
    sys.exit(f"No se encuentra: {json_path}")

with json_path.open(encoding="utf-8") as f:
    data = json.load(f)

# Lienzo más alto para montar el personaje completo.
CANVAS_WIDTH = 500
CANVAS_HEIGHT = 600

# Coordenadas DESTINO de cada pieza.
# Ya no utilizamos las coordenadas originales del PNG.
#
# x = distancia desde el borde izquierdo.
# y = distancia desde el borde superior.
#
# Son posiciones iniciales aproximadas que ajustaremos
# después de ver la composición.

POSITIONS = {
    1: {"name": "body",       "x": 173, "y": 20,  "layer": 4},
    2: {"name": "legs_both",  "x": 0,   "y": 0,   "layer": 0},
    3: {"name": "right_arm",  "x": 295, "y": 100, "layer": 5},
    4: {"name": "left_arm",   "x": 165, "y": 100, "layer": 5},
    5: {"name": "shield",     "x": 110, "y": 155, "layer": 7},
    6: {"name": "axe",        "x": 320, "y": 105, "layer": 6},
    7: {"name": "right_leg",  "x": 180, "y": 245, "layer": 3},
    8: {"name": "left_leg",   "x": 235, "y": 245, "layer": 3},
    9: {"name": "cape",       "x": 174, "y": 80,  "layer": 1},
} 
# Configuración específica de Fenrir.
# Coordenadas originales extraídas de parts.json.
if hero == "fenrir":
    POSITIONS = {
        1: {"name": "head",            "x": 265, "y": 37,  "layer": 4},  # Cabeza: mantener
        2: {"name": "body",            "x": 139, "y": 70,  "layer": 3},  # Tronco: mantener
        3: {"name": "front_left_leg",  "x": 150, "y": 90,  "layer": 4},  # Izquierda: bajar un poco
        4: {"name": "front_right_leg", "x": 290, "y": 135, "layer": 2},  # Arriba: subir 10 px
        5: {"name": "hind_left_leg",   "x": 125, "y": 190, "layer": 1},
        6: {"name": "hind_right_leg",  "x": 240, "y": 190, "layer": 1},  # Abajo: acercar al centro
        7: {"name": "tail",            "x": 40,  "y": 220, "layer": 0},    
    }

canvas = Image.new(
    "RGBA",
    (CANVAS_WIDTH, CANVAS_HEIGHT),
    (0, 0, 0, 0),
)

manifest_parts = []

for part in data["parts"]:
    index = part["index"]

    if index not in POSITIONS:
        continue

    # En Ragnar se omite la pieza 2 porque contiene las piernas agrupadas.
    # En Fenrir, la pieza 2 es el tronco y debe incluirse.
    if hero == "ragnar" and index == 2:
        continue

    config = POSITIONS[index]
    image_path = parts_dir / part["file"]

    if not image_path.exists():
        print(f"Falta la imagen: {image_path}")
        continue

    with Image.open(image_path) as source:
        image = source.convert("RGBA")

    x = config["x"]
    y = config["y"]

    manifest_parts.append({
        "index": index,
        "name": config["name"],
        "x": x,
        "y": y,
        "width": image.width,
        "height": image.height,
        "layer": config["layer"],
        "file": part["file"],
        "_image": image,
    })

# Pintamos primero la capa y las piernas,
# después el cuerpo y finalmente brazos y accesorios.
for part in sorted(manifest_parts, key=lambda p: p["layer"]):
    canvas.alpha_composite(
        part["_image"],
        (part["x"], part["y"]),
    )

output_path = hero_dir / f"{hero}-assembled.png"
canvas.save(output_path)

manifest = {
    "hero": hero,
    "canvas": {
        "width": CANVAS_WIDTH,
        "height": CANVAS_HEIGHT,
    },
    "parts": [
        {
            key: value
            for key, value in part.items()
            if key != "_image"
        }
        for part in manifest_parts
    ],
}

with (hero_dir / "assembly.json").open(
    "w",
    encoding="utf-8",
) as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"\nPersonaje generado: {output_path}")
print(f"Piezas utilizadas: {len(manifest_parts)}")
print(f"Configuración: {hero_dir / 'assembly.json'}")