from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

source = Path("public/sprites/ragnar/victory.png")
output = Path("public/sprites/ragnar/frames/victory-mask")

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

    components.append({
        "id": component_id,
        "x": int(xs.min()),
        "y": int(ys.min()),
        "right": int(xs.max()) + 1,
        "bottom": int(ys.max()) + 1,
        "area": len(xs),
    })

components.sort(key=lambda c: (c["y"], c["x"]))
output.mkdir(parents=True, exist_ok=True)

print(f"Componentes de victoria detectados: {len(components)}")

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
