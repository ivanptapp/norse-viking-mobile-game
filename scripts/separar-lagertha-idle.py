from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

source = Path("public/sprites/lagertha/idle.png")
output = Path("public/sprites/lagertha/previews/idle-separacion")

# Centros aproximados de las seis Lagertha: (Y, X).
centers = [
    (350, 200),
    (350, 425),
    (350, 625),
    (350, 825),
    (350, 1025),
    (350, 1225),
]

colors = [
    (255, 60, 60),
    (50, 130, 255),
    (50, 200, 80),
    (255, 170, 20),
    (210, 60, 255),
    (20, 210, 210),
]

image = Image.open(source).convert("RGBA")
pixels = np.array(image)
alpha = pixels[:, :, 3]
visible = alpha > 0

# Crear un núcleo opaco alrededor del punto indicado para cada personaje.
seeds = np.zeros(visible.shape, dtype=bool)

for index, (y, x) in enumerate(centers, start=1):
    if not (0 <= y < image.height and 0 <= x < image.width):
        raise ValueError(f"Centro fuera de la imagen: {(y, x)}")

    y0, y1 = max(0, y - 20), min(image.height, y + 21)
    x0, x1 = max(0, x - 20), min(image.width, x + 21)

    local_alpha = alpha[y0:y1, x0:x1]
    yy, xx = np.indices(local_alpha.shape)

    # Solo usamos píxeles opacos cercanos al centro.
    local_seeds = (
        (local_alpha > 64)
        & ((yy + y0 - y) ** 2 + (xx + x0 - x) ** 2 <= 20 ** 2)
    )

    if not local_seeds.any():
        raise SystemExit(
            f"No se encontraron píxeles opacos cerca del centro {index}: "
            f"{(y, x)}. Ajusta esa coordenada."
        )

    seeds[y0:y1, x0:x1] |= local_seeds
    print(f"Núcleo {index}: centro {(y, x)}")

# Etiquetar los núcleos y comprobar que cada uno es identificable.
markers, marker_count = ndimage.label(
    seeds,
    structure=np.ones((3, 3), dtype=np.uint8),
)

if marker_count != len(centers):
    raise SystemExit(
        f"Se han fusionado los núcleos: hay {marker_count}, "
        f"pero se esperaban {len(centers)}. Reduce el radio de 20 píxeles."
    )

# Asignar todos los píxeles visibles al núcleo más cercano.
distance_maps = []
for index in range(1, marker_count + 1):
    core = markers == index
    distance_maps.append(ndimage.distance_transform_edt(~core))

owner = np.argmin(np.stack(distance_maps, axis=0), axis=0) + 1

# Diagnóstico con un color uniforme por personaje.
preview = np.full((image.height, image.width, 3), 255, dtype=np.uint8)

for index, color in enumerate(colors, start=1):
    mask = visible & (owner == index)
    preview[mask] = color
    print(f"Lagertha {index}: {int(mask.sum())} píxeles asignados")

output.mkdir(parents=True, exist_ok=True)
destination = output / "idle-seis-colores.png"
Image.fromarray(preview, "RGB").save(destination)

print(f"\nDiagnóstico guardado: {destination}")
print("El PNG original no se ha modificado.")
