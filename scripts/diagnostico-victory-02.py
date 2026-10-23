from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

source = Path("public/sprites/ragnar/frames/victory-mask/02.png")
destination = Path("public/sprites/ragnar/frames/victory-mask/02-diagnostico.png")

image = Image.open(source).convert("RGBA")
pixels = np.array(image)

visible = pixels[:, :, 3] > 10
labels, count = ndimage.label(
    visible,
    structure=np.ones((3, 3), dtype=np.uint8)
)

# Imagen ampliada sobre fondo blanco para visualizar la transparencia.
background = Image.new("RGB", image.size, "white")
background.paste(image, mask=image.getchannel("A"))
background = background.resize(
    (image.width * 3, image.height * 3),
    Image.Resampling.NEAREST
)

draw = ImageDraw.Draw(background)

# Marcar en rojo los puntos de contacto entre componentes vecinos.
for y in range(1, labels.shape[0] - 1):
    for x in range(1, labels.shape[1] - 1):
        if labels[y, x] == 0:
            continue

        neighborhood = labels[y-1:y+2, x-1:x+2]
        neighbors = set(neighborhood.ravel()) - {0, labels[y, x]}

        if neighbors:
            draw.rectangle(
                (x * 3, y * 3, x * 3 + 2, y * 3 + 2),
                fill="red"
            )

background.save(destination)

print(f"Componentes conectados: {count}")
print(f"Diagnóstico guardado en: {destination}")
