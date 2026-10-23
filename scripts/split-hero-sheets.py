
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
import numpy as np
import json
import re

INPUT_DIR = Path("assets/heroes")
OUTPUT_DIR = Path("assets/hero-parts")

ALPHA_THRESHOLD = 10
MIN_AREA = 20
PADDING = 3


def get_hero_name(path):
    name = path.stem
    if name.startswith("all_body_"):
        name = name[len("all_body_"):]
    return name.lower()


def safe_component_crop(image, labels, component_id, box):
    x1, y1, x2, y2 = box
    crop = image.crop(box)

    alpha = np.array(crop.getchannel("A"))
    component_labels = labels[y1:y2, x1:x2]

    alpha[component_labels != component_id] = 0
    crop.putalpha(Image.fromarray(alpha.astype(np.uint8)))

    return crop


def make_preview(image, parts, output_path):
    # Cuadrícula clara y oscura para comprobar visualmente la transparencia.
    canvas = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    tile = 25

    for y in range(0, image.height, tile):
        for x in range(0, image.width, tile):
            color = (
                (215, 215, 215, 255)
                if (x // tile + y // tile) % 2 == 0
                else (245, 245, 245, 255)
            )
            draw.rectangle(
                (x, y, x + tile - 1, y + tile - 1),
                fill=color
            )

    canvas.alpha_composite(image)

    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype(
            "/System/Library/Fonts/Supplemental/Arial.ttf", 12
        )
    except OSError:
        font = ImageFont.load_default()

    for part in parts:
        x, y, w, h = (
            part["x"], part["y"], part["width"], part["height"]
        )
        number = str(part["index"])

        draw.rectangle(
            (x, y, x + w - 1, y + h - 1),
            outline=(255, 40, 40, 255),
            width=1
        )

        # Etiqueta cerca de la esquina superior izquierda de cada pieza.
        tx = x
        ty = max(0, y - 15)

        draw.rectangle((tx, ty, tx + 22, ty + 14), fill=(255, 255, 0, 255))
        draw.text((tx + 2, ty), number, fill=(0, 0, 0, 255), font=font)

    canvas.convert("RGB").save(output_path, quality=95)


def process_image(image_path):
    hero = get_hero_name(image_path)
    print(f"\nProcesando {image_path.name}...")

    with Image.open(image_path) as source:
        image = source.convert("RGBA")

    alpha = np.array(image.getchannel("A"))
    mask = alpha > ALPHA_THRESHOLD

    structure = np.ones((3, 3), dtype=np.uint8)
    labels, count = ndimage.label(mask, structure=structure)

    objects = ndimage.find_objects(labels)
    detected = []

    for component_id, slices in enumerate(objects, start=1):
        if slices is None:
            continue

        ys, xs = slices
        x1, y1 = xs.start, ys.start
        x2, y2 = xs.stop, ys.stop

        component_mask = labels[y1:y2, x1:x2] == component_id
        area = int(component_mask.sum())

        if area < MIN_AREA:
            continue

        detected.append({
            "component_id": component_id,
            "x": x1,
            "y": y1,
            "width": x2 - x1,
            "height": y2 - y1,
            "area": area,
        })

    # Orden estable: de arriba abajo y, después, de izquierda a derecha.
    detected.sort(key=lambda p: (p["y"], p["x"]))

    hero_dir = OUTPUT_DIR / hero
    parts_dir = hero_dir / "parts"
    parts_dir.mkdir(parents=True, exist_ok=True)

    # Limpiar únicamente las piezas anteriores generadas por este script.
    for old_file in parts_dir.glob("part_*.png"):
        old_file.unlink()

    parts_metadata = []

    for index, part in enumerate(detected, start=1):
        x, y = part["x"], part["y"]
        w, h = part["width"], part["height"]
        component_id = part["component_id"]

        # Mantener un pequeño margen alrededor de cada componente.
        x1 = max(0, x - PADDING)
        y1 = max(0, y - PADDING)
        x2 = min(image.width, x + w + PADDING)
        y2 = min(image.height, y + h + PADDING)

        output_image = safe_component_crop(
            image,
            labels,
            component_id,
            (x1, y1, x2, y2)
        )

        filename = f"part_{index:03d}.png"
        output_image.save(parts_dir / filename)

        parts_metadata.append({
            "index": index,
            "file": filename,
            "x": x1,
            "y": y1,
            "width": x2 - x1,
            "height": y2 - y1,
            "component_area": part["area"],
            "centroid_x": float(ndimage.center_of_mass(
                mask, labels, component_id
            )[1]),
            "centroid_y": float(ndimage.center_of_mass(
                mask, labels, component_id
            )[0]),
        })

    metadata = {
        "hero": hero,
        "source": str(image_path),
        "canvas_width": image.width,
        "canvas_height": image.height,
        "alpha_threshold": ALPHA_THRESHOLD,
        "minimum_area": MIN_AREA,
        "parts": parts_metadata,
    }

    (hero_dir / "parts.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    make_preview(image, parts_metadata, hero_dir / "preview.png")

    print(f"  Piezas detectadas: {len(parts_metadata)}")
    print(f"  Vista previa: {hero_dir / 'preview.png'}")


def main():
    if not INPUT_DIR.is_dir():
        raise SystemExit(f"No existe la carpeta {INPUT_DIR}")

    files = sorted(
        p for p in INPUT_DIR.glob("*.png")
        if p.is_file() and not p.name.startswith(".")
    )

    if not files:
        raise SystemExit(f"No se encontraron PNG en {INPUT_DIR}")

    print(f"Se procesarán {len(files)} imágenes.")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for path in files:
        try:
            process_image(path)
        except Exception as error:
            print(f"ERROR con {path.name}: {error}")

    print("\nProceso terminado.")
    print(f"Resultados en: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

