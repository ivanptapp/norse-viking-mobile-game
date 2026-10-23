from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path("public/sprites/lagertha")
SOURCE = ROOT / "walk.png"
OUTPUT = ROOT / "previews" / "walk-separacion"

# Componente 1: contiene las dos Lagertha que queremos separar.
COMPONENT_NUMBER = 1

# Centros aproximados de las dos figuras (Y, X).
CENTERS = [
    (375, 975),
    (375, 1100),
]

COLORS = [
    (255, 60, 60),
    (50, 200, 100),
]

ALPHA_THRESHOLD = 64
MIN_AREA = 1000
PADDING = 15

OUTPUT.mkdir(parents=True, exist_ok=True)

image = Image.open(SOURCE).convert("RGBA")
pixels = np.array(image)
alpha = pixels[:, :, 3]
height, width = alpha.shape

# Reproducir la detección utilizada en diagnostico-colores-lagertha.py.
core = alpha > ALPHA_THRESHOLD
labels, count = ndimage.label(
    core,
    structure=np.ones((3, 3), dtype=np.uint8),
)

components = []

for component_id in range(1, count + 1):
    ys, xs = np.where(labels == component_id)

    if len(xs) < MIN_AREA:
        continue

    components.append({
        "id": component_id,
        "x": int(xs.min()),
        "y": int(ys.min()),
        "right": int(xs.max()) + 1,
        "bottom": int(ys.max()) + 1,
        "area": len(xs),
    })

# Mantener exactamente el orden de numeración del diagnóstico.
components.sort(key=lambda c: (c["x"], c["y"]))

if len(components) < COMPONENT_NUMBER:
    raise RuntimeError(
        f"Solo se detectaron {len(components)} componentes."
    )

component = components[COMPONENT_NUMBER - 1]
component_id = component["id"]

x0 = max(0, component["x"] - PADDING)
y0 = max(0, component["y"] - PADDING)
x1 = min(width, component["right"] + PADDING)
y1 = min(height, component["bottom"] + PADDING)

print(f"Separando únicamente el componente {COMPONENT_NUMBER}")
print(f"Caja: X={x0}..{x1}, Y={y0}..{y1}")
print(f"Área del núcleo: {component['area']} píxeles")

# Limitar la operación al componente seleccionado.
# No se colorean ni se modifican los demás componentes.
region_alpha = alpha[y0:y1, x0:x1]
region_pixels = pixels[y0:y1, x0:x1].copy()

# Los dos centros se convierten a coordenadas locales.
local_centers = [
    (cy - y0, cx - x0)
    for cy, cx in CENTERS
]

rh, rw = region_alpha.shape
yy, xx = np.indices((rh, rw))

distance_maps = []

for cy, cx in local_centers:
    distance_maps.append(
        (yy - cy) ** 2 + (xx - cx) ** 2
    )

owner = np.argmin(np.stack(distance_maps), axis=0)
visible = region_alpha > 0

# Diagnóstico: conservar el resto de walk.png tal cual.
preview = pixels.copy()

for index, color in enumerate(COLORS):
    selected = visible & (owner == index)
    destination = preview[y0:y1, x0:x1]
    destination[selected, :3] = color
    destination[selected, 3] = region_alpha[selected]

preview_path = OUTPUT / "walk-componente-1-dos-colores.png"
Image.fromarray(preview).save(preview_path)

# Recortes provisionales de las dos figuras.
for index in range(2):
    selected = visible & (owner == index)

    if not selected.any():
        raise RuntimeError(
            f"No se han asignado píxeles a Lagertha {index + 1}."
        )

    ys, xs = np.where(selected)
    bx0, bx1 = xs.min(), xs.max() + 1
    by0, by1 = ys.min(), ys.max() + 1

    crop = region_pixels[by0:by1, bx0:bx1].copy()
    crop_mask = selected[by0:by1, bx0:bx1]

    # Hacer transparentes los píxeles asignados a la otra figura.
    crop[~crop_mask, 3] = 0

    path = OUTPUT / f"walk-componente-1-lagertha-{index + 1}.png"
    Image.fromarray(crop).save(path)
    print(f"Guardado: {path}")

print(f"\nVista de diagnóstico: {preview_path}")
print("Los originales y los demás componentes no se han modificado.")
