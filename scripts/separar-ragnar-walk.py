from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

source = Path("public/sprites/ragnar/walk.png")
output = Path("public/sprites/ragnar/frames/walk-mask")

image = Image.open(source).convert("RGBA")
pixels = np.array(image)

visible = pixels[:, :, 3] > 10
structure = np.ones((3, 3), dtype=np.uint8)
labels, count = ndimage.label(visible, structure=structure)

components = []

for component_id in range(1, count + 1):
    ys, xs = np.where(labels == component_id)

    if len(xs) < 1000:
        continue

    x1, x2 = int(xs.min()), int(xs.max()) + 1
    y1, y2 = int(ys.min()), int(ys.max()) + 1

    # Seleccionar únicamente los personajes de la fila superior.
    if y1 >= 200:
        continue

    components.append({
        "id": component_id,
        "x": x1,
        "y": y1,
        "right": x2,
        "bottom": y2,
        "area": len(xs),
    })

components.sort(key=lambda c: c["x"])
output.mkdir(parents=True, exist_ok=True)

print(f"Frames de caminar detectados: {len(components)}")

for index, component in enumerate(components, start=1):
    x1, y1 = component["x"], component["y"]
    x2, y2 = component["right"], component["bottom"]
    component_id = component["id"]

    crop = pixels[y1:y2, x1:x2].copy()
    mask = labels[y1:y2, x1:x2] == component_id
    crop[~mask] = 0

    destination = output / f"{index:02d}.png"
    Image.fromarray(crop, "RGBA").save(destination)

    print(
        f"{destination.name}: {x2-x1}x{y2-y1}, "
        f"{component['area']} píxeles"
    )

print(f"\nResultado: {output}")
