from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path("public/sprites/ragnar/frames")
CELL_W = 180
CELL_H = 230
COLS = 4

def load_frames(folder, exclude=()):
    files = sorted(
        p for p in folder.glob("*.png")
        if p.name not in exclude and "diagnostico" not in p.name
    )
    return [(p.name, Image.open(p).convert("RGBA")) for p in files]

def create_contact_sheet(frames, destination, title):
    if not frames:
        print(f"Sin imágenes para {title}")
        return

    rows = (len(frames) + COLS - 1) // COLS
    sheet = Image.new(
        "RGB",
        (COLS * CELL_W, 45 + rows * CELL_H),
        "#eeeeee"
    )
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 12), title, fill="black")

    for i, (name, frame) in enumerate(frames):
        col = i % COLS
        row = i // COLS

        x = col * CELL_W
        y = 45 + row * CELL_H

        # Fondo blanco para visualizar la transparencia.
        draw.rectangle(
            (x + 5, y + 5, x + CELL_W - 5, y + CELL_H - 5),
            fill="white"
        )

        frame.thumbnail((CELL_W - 24, CELL_H - 45))

        px = x + (CELL_W - frame.width) // 2
        py = y + 10 + (CELL_H - 45 - frame.height)

        sheet.paste(frame, (px, py), frame)
        draw.text((x + 8, y + CELL_H - 28), name, fill="black")

    sheet.save(destination)
    print(f"Creado: {destination}")

death = load_frames(ROOT / "death-mask")

victory = load_frames(
    ROOT / "victory-mask",
    exclude=("02.png", "02-diagnostico.png")
)

create_contact_sheet(
    death,
    ROOT / "death-contact-sheet.png",
    "RAGNAR - DEATH"
)

create_contact_sheet(
    victory,
    ROOT / "victory-contact-sheet.png",
    "RAGNAR - VICTORY"
)
