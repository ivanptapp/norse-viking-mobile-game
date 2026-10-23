from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

source = Path("public/sprites/ragnar/frames/victory-mask/02.png")

image = Image.open(source).convert("RGBA")
pixels = np.array(image)
alpha = pixels[:, :, 3]

print(f"Imagen: {image.width}x{image.height}")
print(f"Píxeles totalmente opacos: {np.count_nonzero(alpha == 255)}")
print(f"Píxeles semitransparentes: {np.count_nonzero((alpha > 0) & (alpha < 255))}")

for threshold in [0, 10, 64, 128, 200, 254]:
    visible = alpha > threshold

    for connectivity in [1, 2]:
        structure = ndimage.generate_binary_structure(2, connectivity)
        labels, count = ndimage.label(visible, structure=structure)

        components = []
        for component_id in range(1, count + 1):
            ys, xs = np.where(labels == component_id)
            area = len(xs)

            if area >= 100:
                components.append({
                    "x": int(xs.min()),
                    "y": int(ys.min()),
                    "right": int(xs.max()) + 1,
                    "bottom": int(ys.max()) + 1,
                    "area": area,
                })

        components.sort(key=lambda c: c["x"])

        print(
            f"\nUmbral alpha > {threshold}, "
            f"conectividad {connectivity}: "
            f"{len(components)} componentes grandes"
        )

        for i, c in enumerate(components, start=1):
            print(
                f"  {i}: x={c['x']}..{c['right']}, "
                f"y={c['y']}..{c['bottom']}, "
                f"área={c['area']}"
            )
