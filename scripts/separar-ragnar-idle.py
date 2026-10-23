from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# Imagen original: no se modifica.
source = Path("public/sprites/ragnar/idle.png")
output = Path("public/sprites/ragnar/frames/idle-mask")

image = Image.open(source).convert("RGBA")
pixels = np.array(image)

# Detectar los píxeles visibles.
visible = pixels[:, :, 3] > 10

# Agrupar píxeles conectados, incluyendo conexiones diagonales.
structure = np.ones((3, 3), dtype=np.uint8)
labels, count = ndimage.label(visible, structure=structure)

components = []

for component_id in range(1, count + 1):
    ys, xs = np.where(labels == component_id)

    if len(xs) < 1000:
        continue

    components.append({
        "id": component_id,
        "x": int(xs.min()),
        "y": int(ys.min()),
        "right": int(xs.max()) + 1,
        "bottom": int(ys.max()) + 1,
        "area": len(xs),
    })

# Ragnar aparece de izquierda a derecha.
components.sort(key=lambda c: (c["x"], c["y"]))

output.mkdir(parents=True, exist_ok=True)

print(f"Componentes detectados: {len(components)}")

for index, component in enumerate(components, start=1):
    x1 = component["x"]
    y1 = component["y"]
    x2 = component["right"]
    y2 = component["bottom"]
    component_id = component["id"]

    # Recortar el área del personaje.
    crop = pixels[y1:y2, x1:x2].copy()

    # Eliminar cualquier píxel que pertenezca a otro componente.
    component_mask = labels[y1:y2, x1:x2] == component_id
    crop[~component_mask] = 0

    destination = output / f"{index:02d}.png"
    Image.fromarray(crop, "RGBA").save(destination)

    print(
        f"{index:02d}.png | "
        f"x={x1}, y={y1} | "
        f"tamaño={x2-x1}x{y2-y1} | "
        f"píxeles={component['area']}"
    )

print(f"\nFrames guardados en: {output}")
