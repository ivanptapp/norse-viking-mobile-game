from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path("public/sprites/lagertha")
PREVIEW = ROOT / "previews"

ANIMATIONS = [
    "idle",
    "walk",
    "attack",
    "hit",
    "victory",
    "dead",
]

ALPHA_THRESHOLD = 10
MIN_AREA = 1000

PREVIEW.mkdir(parents=True, exist_ok=True)

structure = np.ones((3, 3), dtype=np.uint8)

for animation in ANIMATIONS:
    source = ROOT / f"{animation}.png"

    if not source.exists():
        print(f"\nAVISO: no existe {source}")
        continue

    with Image.open(source) as original:
        image = original.convert("RGBA")

    pixels = np.array(image)
    visible = pixels[:, :, 3] > ALPHA_THRESHOLD

    labels, count = ndimage.label(
        visible,
        structure=structure,
    )

    objects = ndimage.find_objects(labels)
    components = []

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

        components.append({
            "id": component_id,
            "x": x1,
            "y": y1,
            "right": x2,
            "bottom": y2,
            "area": area,
        })

    # Orden de lectura: arriba abajo y, dentro de cada fila,
    # de izquierda a derecha.
    components.sort(key=lambda c: (c["y"], c["x"]))

    print(f"\n{'=' * 55}")
    print(f"ANIMACIÓN: {animation}")
    print(f"Imagen original: {image.width}x{image.height}")
    print(f"Componentes conectados encontrados: {count}")
    print(f"Componentes válidos (área >= {MIN_AREA}): {len(components)}")

    # Crear una copia de diagnóstico con las cajas y los números.
    preview = image.copy()
    draw = ImageDraw.Draw(preview)

    for index, component in enumerate(components, start=1):
        x1 = component["x"]
        y1 = component["y"]
        x2 = component["right"]
        y2 = component["bottom"]

        draw.rectangle(
            (x1, y1, x2 - 1, y2 - 1),
            outline=(255, 40, 40, 255),
            width=3,
        )

        draw.rectangle(
            (x1, y1, x1 + 35, y1 + 20),
            fill=(255, 255, 0, 255),
        )

        draw.text(
            (x1 + 3, y1 + 2),
            str(index),
            fill=(0, 0, 0, 255),
        )

        print(
            f"  {index:02d}: "
            f"x={x1}, y={y1}, "
            f"tamaño={x2-x1}x{y2-y1}, "
            f"área={component['area']}"
        )

    destination = PREVIEW / f"{animation}-deteccion.png"
    preview.save(destination)

    print(f"Vista previa: {destination}")

print("\nAnálisis terminado. No se han modificado las imágenes originales.")
