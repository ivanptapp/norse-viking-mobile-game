from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

source = Path("public/sprites/ragnar/frames/victory-mask/02.png")
output = source.parent

image = Image.open(source).convert("RGBA")
pixels = np.array(image)
alpha = pixels[:, :, 3]

# Utilizar los píxeles con suficiente opacidad para identificar
# el núcleo de cada personaje.
seeds = alpha > 64

labels, count = ndimage.label(
    seeds,
    structure=np.ones((3, 3), dtype=np.uint8)
)

components = []

for component_id in range(1, count + 1):
    ys, xs = np.where(labels == component_id)

    if len(xs) < 1000:
        continue

    components.append({
        "id": component_id,
        "area": len(xs),
        "x": int(xs.min()),
        "y": int(ys.min()),
    })

components.sort(key=lambda c: c["x"])

print(f"Personajes identificados: {len(components)}")

if len(components) != 2:
    raise SystemExit(
        "ERROR: se esperaban exactamente dos personajes. "
        "No se han generado archivos."
    )

# Crear una máscara para cada personaje a partir de sus píxeles núcleo.
core_masks = [
    labels == component["id"]
    for component in components
]

# Para cada píxel, calcular la distancia al núcleo de cada personaje.
distances = []

for core in core_masks:
    distance = ndimage.distance_transform_edt(~core)
    distances.append(distance)

# Cada píxel visible, incluidos los semitransparentes, se asigna
# al núcleo más cercano. Se conservan sus RGBA originales.
visible = alpha > 0
owner = np.argmin(np.stack(distances, axis=0), axis=0)

for index in range(2):
    mask = visible & (owner == index)

    ys, xs = np.where(mask)

    if len(xs) == 0:
        raise SystemExit(f"ERROR: el personaje {index + 1} está vacío.")

    x1, x2 = int(xs.min()), int(xs.max()) + 1
    y1, y2 = int(ys.min()), int(ys.max()) + 1

    crop = pixels[y1:y2, x1:x2].copy()
    crop_mask = mask[y1:y2, x1:x2]

    # Mantener únicamente los píxeles asignados a este personaje.
    crop[~crop_mask] = 0

    destination = output / f"02-{index + 1}.png"
    Image.fromarray(crop, "RGBA").save(destination)

    print(
        f"{destination.name}: "
        f"{crop.shape[1]}x{crop.shape[0]}, "
        f"{int(mask.sum())} píxeles asignados"
    )

print("\nSeparación terminada.")
print("El archivo original 02.png no se ha modificado.")
