from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path("public/sprites/lagertha")
OUTPUT = ROOT / "previews" / "colores"

ANIMATIONS = [
    "idle",
    "walk",
    "attack",
    "hit",
    "dead",
    "victory",
]

ALPHA_THRESHOLD = 64
MIN_AREA = 1000

# Colores intensos para distinguir los componentes.
COLORS = [
    (255, 60, 60),
    (50, 130, 255),
    (50, 210, 100),
    (255, 180, 30),
    (210, 70, 255),
    (30, 220, 220),
    (255, 100, 180),
    (180, 220, 40),
    (255, 130, 50),
    (120, 100, 255),
    (30, 180, 150),
    (240, 220, 60),
]

OUTPUT.mkdir(parents=True, exist_ok=True)

for animation in ANIMATIONS:
    source = ROOT / f"{animation}.png"

    if not source.exists():
        print(f"\n[AVISO] No existe: {source}")
        continue

    image = Image.open(source).convert("RGBA")
    pixels = np.array(image)
    alpha = pixels[:, :, 3]

    # Núcleos opacos: mismo principio que utilizamos con Ragnar.
    seeds = alpha > ALPHA_THRESHOLD

    labels, count = ndimage.label(
        seeds,
        structure=np.ones((3, 3), dtype=np.uint8),
    )

    components = []

    for component_id in range(1, count + 1):
        ys, xs = np.where(labels == component_id)
        area = len(xs)

        if area < MIN_AREA:
            continue

        components.append({
            "id": component_id,
            "area": area,
            "x": int(xs.min()),
            "y": int(ys.min()),
            "right": int(xs.max()) + 1,
            "bottom": int(ys.max()) + 1,
        })

    # Orden de izquierda a derecha y, después, de arriba abajo.
    components.sort(key=lambda c: (c["x"], c["y"]))

    print(f"\n{'=' * 45}")
    print(f"ANIMACIÓN: {animation}")
    print(f"Imagen: {image.width}x{image.height}")
    print(f"Componentes opacos detectados: {len(components)}")

    # Fondo blanco para visualizar las zonas transparentes.
    preview = Image.new("RGB", image.size, "white")
    preview_rgba = image.copy()
    preview_rgba.putalpha(image.getchannel("A"))
    preview.paste(image.convert("RGB"), mask=image.getchannel("A"))

    draw = ImageDraw.Draw(preview)

    # Mostrar cada núcleo con un color diferente.
    for index, component in enumerate(components):
        color = COLORS[index % len(COLORS)]
        component_id = component["id"]

        mask = labels == component_id
        ys, xs = np.where(mask)

        # Colorear únicamente los píxeles del núcleo detectado.
        overlay = np.zeros_like(pixels[:, :, :3])
        overlay[mask] = color

        colored = Image.fromarray(overlay, "RGB")
        preview.paste(colored, mask=Image.fromarray(
            (mask.astype(np.uint8) * 255), "L"
        ))

        box = (
            component["x"],
            component["y"],
            component["right"] - 1,
            component["bottom"] - 1,
        )

        draw.rectangle(box, outline=color, width=3)
        draw.text(
            (component["x"] + 3, component["y"] + 3),
            f'{index + 1} ({component["area"]} px)',
            fill=color,
            stroke_width=1,
            stroke_fill="white",
        )

        print(
            f"  {index + 1}: "
            f"x={component['x']}..{component['right']}, "
            f"y={component['y']}..{component['bottom']}, "
            f"área={component['area']}"
        )

    destination = OUTPUT / f"{animation}-colores.png"
    preview.save(destination)
    print(f"Diagnóstico guardado: {destination}")

print("\nDiagnósticos terminados. Los originales no se han modificado.")
