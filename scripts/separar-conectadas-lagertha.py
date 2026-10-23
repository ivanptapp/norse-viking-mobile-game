from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.feature import peak_local_max
from skimage.segmentation import watershed

ROOT = Path("public/sprites/lagertha")
OUTPUT = ROOT / "previews" / "watershed"

ANIMATIONS = ["idle", "walk", "dead"]
ALPHA_THRESHOLD = 10

# Distancia mínima entre núcleos candidatos.
# Se podrá ajustar según el resultado visual.
MIN_DISTANCE = 35

COLORS = [
    (255, 60, 60),
    (50, 130, 255),
    (50, 200, 80),
    (255, 170, 20),
    (210, 60, 255),
    (20, 210, 210),
    (255, 100, 170),
    (180, 210, 30),
    (255, 120, 40),
    (120, 100, 255),
    (30, 160, 120),
    (230, 210, 60),
]

OUTPUT.mkdir(parents=True, exist_ok=True)

for animation in ANIMATIONS:
    source = ROOT / f"{animation}.png"

    if not source.exists():
        print(f"No existe: {source}")
        continue

    image = Image.open(source).convert("RGBA")
    pixels = np.array(image)
    alpha = pixels[:, :, 3]

    # Silueta visible, incluidos los píxeles semitransparentes.
    visible = alpha > ALPHA_THRESHOLD

    # Distancia de cada píxel visible al fondo transparente.
    distance = ndimage.distance_transform_edt(visible)

    # Buscar máximos locales que puedan servir como núcleos.
    coordinates = peak_local_max(
        distance,
        min_distance=MIN_DISTANCE,
        threshold_abs=8,
        labels=visible.astype(np.uint8),
        exclude_border=False,
    )

    markers = np.zeros(visible.shape, dtype=np.int32)

    for index, (y, x) in enumerate(coordinates, start=1):
        markers[y, x] = index

    if len(coordinates) == 0:
        print(f"{animation}: no se encontraron núcleos.")
        continue

    # Separar la silueta por cuencas desde los núcleos detectados.
    regions = watershed(
        -distance,
        markers,
        mask=visible,
    )

    # Visualización: un color por región.
    preview = Image.new("RGB", image.size, "white")
    draw = ImageDraw.Draw(preview)

    for region_id in range(1, int(regions.max()) + 1):
        mask = regions == region_id

        if int(mask.sum()) < 100:
            continue

        color = COLORS[(region_id - 1) % len(COLORS)]

        rgb = np.zeros((image.height, image.width, 3), dtype=np.uint8)
        rgb[mask] = color

        preview.paste(
            Image.fromarray(rgb, "RGB"),
            mask=Image.fromarray(mask.astype(np.uint8) * 255, "L"),
        )

        ys, xs = np.where(mask)
        x1, x2 = int(xs.min()), int(xs.max())
        y1, y2 = int(ys.min()), int(ys.max())

        draw.rectangle(
            (x1, y1, x2, y2),
            outline=color,
            width=2,
        )

        draw.text(
            (x1, y1),
            str(region_id),
            fill=color,
            stroke_width=2,
            stroke_fill="white",
        )

    destination = OUTPUT / f"{animation}-watershed.png"
    preview.save(destination)

    print(f"\n{animation}: {len(coordinates)} núcleos candidatos")
    for index, (y, x) in enumerate(coordinates, start=1):
        print(f"  Núcleo {index}: x={x}, y={y}")

    print(f"Imagen generada: {destination}")

print("\nDiagnóstico terminado. No se han modificado los originales.")
