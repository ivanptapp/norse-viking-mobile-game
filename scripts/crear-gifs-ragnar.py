from pathlib import Path
import re

from PIL import Image, ImageDraw

ROOT = Path("public/sprites/ragnar/frames")
OUTPUT = Path("public/sprites/ragnar/gifs")

# Duración de cada fotograma en milisegundos.
DURATIONS = {
    "idle": 220,
    "walk": 150,
    "attack": 140,
    "hit": 180,
    "death": 280,
    "victory": 250,
}

# Directorios de los PNG que ya hemos separado.
FOLDERS = {
    "idle": ROOT / "idle-mask",
    "walk": ROOT / "walk-mask",
    "attack": ROOT / "attack-mask",
    "hit": ROOT / "hit-mask",
    "death": ROOT / "death-mask",
    "victory": ROOT / "victory-mask",
}


def natural_key(path):
    return [
        int(part) if part.isdigit() else part.lower()
        for part in re.split(r"(\d+)", path.stem)
    ]


def get_frames(animation, folder):
    files = [
        p for p in folder.glob("*.png")
        if "diagnostico" not in p.stem
        and "contact-sheet" not in p.stem
        and not p.stem.endswith("-diagnostico")
    ]

    # En victory usamos los dos Ragnar separados.
    if animation == "victory":
        files = [
            p for p in files
            if p.name not in ("02.png", "02-diagnostico.png")
        ]

    files.sort(key=natural_key)
    return files


def prepare_frame(image, canvas_size, scale=2):
    image = image.convert("RGBA")

    # Ampliar mediante nearest-neighbor para mantener los píxeles nítidos.
    image = image.resize(
        (image.width * scale, image.height * scale),
        Image.Resampling.NEAREST,
    )

    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))

    # Centrar horizontalmente y apoyar los pies en la misma línea.
    x = (canvas.width - image.width) // 2
    y = canvas.height - image.height

    canvas.alpha_composite(image, (x, y))
    return canvas


def make_gif(animation, folder):
    files = get_frames(animation, folder)

    if not files:
        print(f"AVISO: no se encontraron PNG para {animation}")
        return None

    images = []

    try:
        for path in files:
            with Image.open(path) as source:
                images.append(source.convert("RGBA"))

        # Un mismo lienzo evita que cambien las dimensiones del GIF.
        max_width = max(image.width for image in images) * 2
        max_height = max(image.height for image in images) * 2
        canvas_size = (max_width + 40, max_height + 40)

        frames = [
            prepare_frame(image, canvas_size)
            for image in images
        ]

        # Para revisar el resultado, se muestra sobre fondo blanco.
        rgb_frames = []

        for frame in frames:
            background = Image.new(
                "RGBA", canvas_size, (255, 255, 255, 255)
            )
            background.alpha_composite(frame)
            rgb_frames.append(background.convert("RGB"))

        OUTPUT.mkdir(parents=True, exist_ok=True)
        destination = OUTPUT / f"{animation}.gif"

        save_options = {
            "save_all": True,
            "append_images": rgb_frames[1:],
            "duration": DURATIONS[animation],
            "optimize": False,
        }

        # Todas las animaciones, salvo muerte, se repiten indefinidamente.
        # Omitir "loop" en death evita configurar una repetición.
        if animation != "death":
            save_options["loop"] = 0

        rgb_frames[0].save(destination, **save_options)

        print(f"{animation}: {len(files)} frames -> {destination}")

        for frame in rgb_frames:
            frame.close()

        for frame in frames:
            frame.close()

        return destination

    finally:
        for image in images:
            image.close()


def make_overview(gif_paths):
    if not gif_paths:
        return

    # Hoja de contacto estática para localizar rápidamente cada animación.
    cell_w, cell_h = 320, 340
    columns = 3
    rows = (len(gif_paths) + columns - 1) // columns

    sheet = Image.new(
        "RGB",
        (columns * cell_w, rows * cell_h),
        "white",
    )
    draw = ImageDraw.Draw(sheet)

    for index, path in enumerate(gif_paths):
        animation = path.stem
        folder = FOLDERS[animation]
        files = get_frames(animation, folder)

        if not files:
            continue

        # Mostrar el primer frame de cada animación.
        with Image.open(files[0]) as source:
            frame = source.convert("RGBA")

        frame.thumbnail((cell_w - 30, cell_h - 70))

        x = (index % columns) * cell_w
        y = (index // columns) * cell_h

        draw.text((x + 12, y + 10), animation.upper(), fill="black")

        px = x + (cell_w - frame.width) // 2
        py = y + 40 + (cell_h - 55 - frame.height) // 2

        sheet.paste(frame, (px, py), frame)
        frame.close()

    destination = OUTPUT / "vista-general.png"
    sheet.save(destination)
    sheet.close()

    print(f"Vista general -> {destination}")


def main():
    generated = []

    for animation, folder in FOLDERS.items():
        if not folder.exists():
            print(f"AVISO: no existe la carpeta {folder}")
            continue

        result = make_gif(animation, folder)

        if result:
            generated.append(result)

    make_overview(generated)

    print("\nProceso terminado.")
    print(f"Archivos generados en: {OUTPUT}")


if __name__ == "__main__":
    main()