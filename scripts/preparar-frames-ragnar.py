from pathlib import Path
from PIL import Image

ROOT = Path("public/sprites/ragnar/frames")
OUTPUT = Path("public/sprites/ragnar/frames-ready")

ANIMATIONS = {
    "idle": "idle-mask",
    "walk": "walk-mask",
    "attack": "attack-mask",
    "hit": "hit-mask",
    "death": "death-mask",
    "victory": "victory-mask",
}

CANVAS_WIDTH = 240
CANVAS_HEIGHT = 260
MARGIN = 10
MAX_SCALE = 2.0


def get_files(animation, folder):
    files = []

    for path in folder.glob("*.png"):
        name = path.name.lower()

        if "diagnostico" in name or "contact-sheet" in name:
            continue

        # En la victoria utilizamos los dos personajes separados,
        # nunca la imagen original que contiene ambos.
        if animation == "victory" and path.name == "02.png":
            continue

        files.append(path)

    return sorted(
        files,
        key=lambda p: (
            int(p.stem.split("-")[0])
            if p.stem.split("-")[0].isdigit()
            else 999,
            p.stem,
        ),
    )


def main():
    # Primero recortamos mentalmente las zonas transparentes para
    # determinar una escala común para todos los fotogramas.
    sources = {}
    max_width = 1
    max_height = 1

    for animation, folder_name in ANIMATIONS.items():
        folder = ROOT / folder_name

        if not folder.exists():
            print(f"AVISO: no existe {folder}")
            continue

        files = get_files(animation, folder)

        if not files:
            print(f"AVISO: no hay fotogramas para {animation}")
            continue

        sources[animation] = []

        for path in files:
            with Image.open(path) as source:
                image = source.convert("RGBA")

            bbox = image.getchannel("A").getbbox()

            if bbox:
                image = image.crop(bbox)
            else:
                image.close()
                print(f"AVISO: imagen transparente vacía: {path}")
                continue

            max_width = max(max_width, image.width)
            max_height = max(max_height, image.height)

            sources[animation].append((path, image))

    if not sources:
        raise SystemExit("No se encontraron fotogramas válidos.")

    available_width = CANVAS_WIDTH - 2 * MARGIN
    available_height = CANVAS_HEIGHT - 2 * MARGIN

    # Una única escala para que el tamaño del personaje no cambie
    # al pasar de una animación a otra.
    scale = min(
        MAX_SCALE,
        available_width / max_width,
        available_height / max_height,
    )

    OUTPUT.mkdir(parents=True, exist_ok=True)

    print(f"Escala común: {scale:.3f}x")

    for animation, entries in sources.items():
        destination_folder = OUTPUT / animation
        destination_folder.mkdir(parents=True, exist_ok=True)

        for index, (source_path, image) in enumerate(entries, start=1):
            width = max(1, round(image.width * scale))
            height = max(1, round(image.height * scale))

            resized = image.resize(
                (width, height),
                Image.Resampling.NEAREST,
            )

            canvas = Image.new(
                "RGBA",
                (CANVAS_WIDTH, CANVAS_HEIGHT),
                (0, 0, 0, 0),
            )

            x = (CANVAS_WIDTH - width) // 2
            y = CANVAS_HEIGHT - MARGIN - height

            canvas.alpha_composite(resized, (x, y))

            destination = destination_folder / f"{index:02d}.png"
            canvas.save(destination)

            image.close()
            resized.close()
            canvas.close()

        print(
            f"{animation}: {len(entries)} fotogramas preparados "
            f"en {destination_folder}"
        )

    print("\nPreparación terminada.")
    print(f"Archivos preparados en: {OUTPUT}")


if __name__ == "__main__":
    main()
