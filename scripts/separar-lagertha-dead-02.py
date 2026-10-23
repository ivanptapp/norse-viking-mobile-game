from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

source = Path("public/sprites/lagertha/dead.png")
output = Path("public/sprites/lagertha/previews/dead-separacion")

# Coordenadas facilitadas: (Y, X).
centers = [
    (400, 600),
    (400, 800),
    (450, 975),
    (475, 1225),
]

colors = [
    (255, 60, 60),
    (50, 130, 255),
    (50, 200, 80),
    (255, 170, 20),
]

image = Image.open(source).convert("RGBA")
pixels = np.array(image)
alpha = pixels[:, :, 3]

# Detectar la silueta original.
visible = alpha > 10

# Identificar la zona conectada que contiene los personajes.
labels, count = ndimage.label(
    visible,
    structure=np.ones((3, 3), dtype=np.uint8),
)

# Localizar cada centro sobre un píxel visible cercano.
seeds = []

for index, (y, x) in enumerate(centers, start=1):
    if not (0 <= y < image.height and 0 <= x < image.width):
        raise ValueError(f"Centro {index} fuera de la imagen: {(y, x)}")

    if visible[y, x]:
        sy, sx = y, x
    else:
        y0, y1 = max(0, y - 30), min(image.height, y + 31)
        x0, x1 = max(0, x - 30), min(image.width, x + 31)

        local = visible[y0:y1, x0:x1]
        yy, xx = np.where(local)

        if len(xx) == 0:
            raise ValueError(
                f"No hay píxeles visibles cerca del centro {(y, x)}"
            )

        distances = (yy + y0 - y) ** 2 + (xx + x0 - x) ** 2
        nearest = int(np.argmin(distances))
        sy, sx = int(yy[nearest] + y0), int(xx[nearest] + x0)

    seeds.append((sy, sx))
    print(f"Lagertha {index}: centro ajustado a Y={sy}, X={sx}")

# Los cuatro núcleos deben pertenecer a la misma zona conectada.
component_ids = [int(labels[y, x]) for y, x in seeds]

print("Componentes de los núcleos:", component_ids)

if any(component_id == 0 for component_id in component_ids):
    raise SystemExit(
        "ERROR: algún núcleo no pertenece a una silueta visible."
    )

# Limitar la operación a los componentes que contienen los cuatro núcleos.
target = np.isin(labels, component_ids)
ys, xs = np.where(target)

if len(xs) == 0:
    raise SystemExit("ERROR: no se ha encontrado la zona de los personajes.")

x0, x1 = int(xs.min()), int(xs.max()) + 1
y0, y1 = int(ys.min()), int(ys.max()) + 1

region = target[y0:y1, x0:x1]
yy, xx = np.indices(region.shape)

# Asignar cada píxel visible al núcleo más cercano.
distances = []

for sy, sx in seeds:
    distance = (yy + y0 - sy) ** 2 + (xx + x0 - sx) ** 2
    distances.append(distance)

owner = np.argmin(np.stack(distances, axis=0), axis=0) + 1

# Crear una vista de diagnóstico: un color por personaje.
preview = np.full((image.height, image.width, 3), 255, dtype=np.uint8)

for index, color in enumerate(colors, start=1):
    mask = region & (owner == index)
    preview[y0:y1, x0:x1][mask] = color

output.mkdir(parents=True, exist_ok=True)
destination = output / "dead-cuatro-colores.png"
Image.fromarray(preview, "RGB").save(destination)

# Guardar también cuatro recortes RGBA de prueba.
# Los píxeles originales se conservan dentro de cada máscara.
for index in range(1, 5):
    mask = target.copy()
    local_owner = owner == index
    mask[y0:y1, x0:x1] &= local_owner

    cy, cx = np.where(mask)

    if len(cx) == 0:
        print(f"AVISO: Lagertha {index} no tiene píxeles asignados.")
        continue

    bx0, bx1 = int(cx.min()), int(cx.max()) + 1
    by0, by1 = int(cy.min()), int(cy.max()) + 1

    crop = pixels[by0:by1, bx0:bx1].copy()
    crop[~mask[by0:by1, bx0:bx1]] = 0

    path = output / f"lagertha-{index}.png"
    Image.fromarray(crop, "RGBA").save(path)

    print(f"Guardado: {path} ({crop.shape[1]}x{crop.shape[0]})")

print(f"\nDiagnóstico guardado: {destination}")
print("El archivo original no se ha modificado.")
