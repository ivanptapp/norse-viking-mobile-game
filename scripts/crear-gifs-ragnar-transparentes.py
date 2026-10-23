from pathlib import Path
import re

from PIL import Image

ROOT = Path("public/sprites/ragnar/frames")
OUTPUT = Path("public/sprites/ragnar/gifs-transparentes")

FOLDERS = {
    "idle": ROOT / "idle-mask",
    "walk": ROOT / "walk-mask",
    "attack": ROOT / "attack-mask",
    "hit": ROOT / "hit-mask",
    "death": ROOT / "death-mask",
    "victory": ROOT / "victory-mask",
}

DURATIONS = {
    "idle": 180,
    "walk": 110,
    "attack": 100,
    "hit": 130,
    "death": 220,
    "victory": 180,
}


def natural_key(path):
    return [
        int(part) if part.isdigit() else part.lower()
        for part in re.split(r"(\d+)", path.stem)
    ]


def get_files(animation, folder):
    files = [
        p for p in folder.glob("*.png")
        if "diagnostico" not in p.stem
        and "contact-sheet" not in p.stem
    ]

    if animation == "victory":
        files = [
            p for p in files
            if p.name not in ("02.png", "02-diagnostico.png")
        ]

    return sorted(files, key=natural_key)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)

    for animation, folder in FOLDERS.items():
        if not folder.exists():
            print(f"Carpeta inexistente: {folder}")
            continue

        files = get_files(animation, folder)

        if not files:
            print(f"Sin frames: {animation}")
            continue

        originals = [Image.open(p).convert("RGBA") for p in files]

        scale = 2
        max_width = max(im.width for im in originals) * scale
        max_height = max(im.height for im in originals) * scale

        canvas_size = (max_width + 40, max_height + 40)
        frames = []

        for original in originals:
            frame = original.resize(
                (original.width * scale, original.height * scale),
                Image.Resampling.NEAREST,
            )

            canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
            x = (canvas.width - frame.width) // 2
            y = canvas.height - frame.height - 20
            canvas.alpha_composite(frame, (x, y))

            # GIF no admite alfa parcial: convertir los píxeles
            # casi transparentes en transparencia total.
            rgba = canvas.copy()
            alpha = rgba.getchannel("A")
            alpha = alpha.point(lambda value: 255 if value >= 128 else 0)
            rgba.putalpha(alpha)

            # Reservar un índice de paleta para la transparencia.
            paletted = Image.new("P", canvas_size, 0)
            rgb = rgba.convert("RGB")
            quantized = rgb.quantize(colors=255, method=Image.Quantize.FASTOCTREE)

            # Copiar la paleta y los píxeles del frame cuantizado.
            paletted.paste(quantized)
            palette = quantized.getpalette()
            if palette:
                paletted.putpalette(palette)

            # Hacer transparentes los píxeles que lo eran en RGBA.
            mask = alpha.point(lambda value: 255 if value == 0 else 0)
            paletted.paste(255, mask=mask)

            # Definir un índice específico como transparente.
            palette = paletted.getpalette() or [0] * 768
            palette[255 * 3:255 * 3 + 3] = [255, 0, 255]
            paletted.putpalette(palette)

            frames.append(paletted)

            original.close()
            frame.close()
            canvas.close()
            rgba.close()
            rgb.close()
            quantized.close()

        destination = OUTPUT / f"{animation}.gif"
        frames[0].save(
            destination,
            save_all=True,
            append_images=frames[1:],
            duration=DURATIONS[animation],
            loop=0,
            transparency=255,
            disposal=2,
            optimize=False,
        )

        print(f"{animation}: {len(frames)} frames -> {destination}")

        for frame in frames:
            frame.close()

    print(f"\nGIF transparentes guardados en: {OUTPUT}")


if __name__ == "__main__":
    main()
