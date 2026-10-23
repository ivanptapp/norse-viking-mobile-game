"""Build Ragnar's articulated character from assets/heroes/all_body_ragnar.png.

The sheet is a paper-doll kit: one painted bust (head + torso + pauldrons),
two bent arms, two bent legs, a fur cape, a round shield and an axe. Placements
follow assets/hero-parts/ragnar/assembly.json, which is the layout that reads
correctly; this script adds the joints the kit does not ship with.

Joints are cut inside the cuffs the artist already drew (elbow cuff, boot fur,
collar), so both halves keep the pixels that cover the joint while it rotates.

Output: public/heroes/ragnar-kit/*.png + kit.json, and a rest composite for QA.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / "assets/heroes/all_body_ragnar.png"
OUT = ROOT / "public/heroes/ragnar-kit"
QA = ROOT / "public/qa-ragnar"

CANVAS = (500, 600)

source = Image.open(SHEET).convert("RGBA")
PIX = np.array(source)

# ---------------------------------------------------------------------------
# Source crops (sheet space)
# ---------------------------------------------------------------------------

BODY_BOX = (13, 13, 167, 281)
ARM_NEAR_BOX = (409, 15, 479, 175)   # iron vambrace, viewer right, holds the axe
ARM_FAR_BOX = (290, 17, 358, 179)    # leather bracer, viewer left, holds the shield
LEG_NEAR_BOX = (122, 294, 242, 477)  # viewer right
LEG_FAR_BOX = (21, 293, 98, 487)     # viewer left
CAPE_BOX = (331, 316, 483, 498)
SHIELD_BOX = (353, 183, 483, 313)
AXE_BOX = (243, 242, 329, 421)

# ---------------------------------------------------------------------------
# Where each piece sits in the finished character (from assembly.json).
# ---------------------------------------------------------------------------

# The arms ride 6 px higher than the raw assembly so the painted bicep closes
# the armpit gap the bust leaves open.
ARM_LIFT = 6

PLACE = {
    "torso": (173, 20),
    "head": (173, 20),
    "arm-near": (295, 100 - ARM_LIFT),
    "arm-far": (165, 100 - ARM_LIFT),
    "leg-near": (235, 245),
    "leg-far": (180, 245),
    "shield": (110, 155 - ARM_LIFT),
    "axe": (316, 105 - ARM_LIFT),
    "cape": (164, 84),
}

# Anatomical joints in canvas space.
NECK = (264, 107)
SHOULDER_NEAR = (306, 140 - ARM_LIFT)
SHOULDER_FAR = (203, 140 - ARM_LIFT)
ELBOW_NEAR = (307, 153 - ARM_LIFT)
ELBOW_FAR = (172, 183 - ARM_LIFT)
HIP_NEAR = (273, 256)
HIP_FAR = (221, 252)
KNEE_NEAR = (315, 351)
KNEE_FAR = (252, 345)
GRIP_NEAR = (340, 237 - ARM_LIFT)
GRIP_FAR = (206, 240 - ARM_LIFT)
CAPE_ROOT = (264, 126)
SHIELD_HAND = GRIP_FAR

# Cut rows in sheet space (inside the artist's cuffs).
CUT_ARM_NEAR = 74
CUT_ARM_FAR = 102
CUT_LEG_NEAR = 410
CUT_LEG_FAR = 404
CUT_HEAD = 97

# The cape is cut in two so the lower half can lag behind the upper one:
# that lag is the cloth follow-through the clips already ask for via
# pose.cloak[0..2]. Split row is in sheet space; both halves overlap.
CAPE_SPLIT = 422
CAPE_BLEED = 22

Z = {
    "cape": 1,
    "cape-tail": 1,
    "leg-far-upper": 2,
    "leg-near-upper": 2,
    "leg-far-lower": 3,
    "leg-near-lower": 3,
    "torso": 4,
    "arm-far-upper": 6,
    "arm-near-upper": 6,
    "arm-far-lower": 7,
    "arm-near-lower": 7,
    "shield": 8,
    "axe": 8,
    "head": 9,
}

PARTS: list[dict] = []
OUT.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)


def rows(max_y: int) -> np.ndarray:
    mask = np.zeros(PIX.shape[:2], dtype=bool)
    mask[: max_y + 1, :] = True
    return mask


def everything() -> np.ndarray:
    return np.ones(PIX.shape[:2], dtype=bool)


def poly(points: list[tuple[int, int]]) -> np.ndarray:
    """Smooth-edged polygon mask at 4x supersampling."""
    big = Image.new("L", (PIX.shape[1] * 4, PIX.shape[0] * 4), 0)
    ImageDraw.Draw(big).polygon([(x * 4, y * 4) for x, y in points], fill=255)
    return np.array(big.resize((PIX.shape[1], PIX.shape[0]), Image.LANCZOS)) > 96


def grade(piece: Image.Image) -> Image.Image:
    """Cinematic grade, applied to every piece so they stay one drawing.

    The reference clip is lit like a film still: cool teal shadows, warm amber
    highlights, slightly crushed blacks and a touch more contrast. Doing this
    per piece (instead of per screen) keeps the seams invisible, because both
    halves of a joint receive exactly the same transform.
    """
    arr = np.array(piece).astype(np.float32) / 255.0
    rgb, alpha = arr[:, :, :3], arr[:, :, 3:]

    # S-curve contrast around mid grey, gentle enough to keep the artist's
    # modelling intact.
    rgb = 0.5 + (rgb - 0.5) * 1.1
    rgb = np.clip(rgb, 0, 1)

    # Split tone: shadows towards a cold blue, highlights towards amber.
    luma = (rgb[:, :, 0] * 0.299 + rgb[:, :, 1] * 0.587 + rgb[:, :, 2] * 0.114)[:, :, None]
    cool = np.array([0.86, 1.0, 1.12], dtype=np.float32)
    warm = np.array([1.08, 1.02, 0.92], dtype=np.float32)
    tint = cool * (1.0 - luma) + warm * luma
    rgb = np.clip(rgb * (1.0 + (tint - 1.0) * 0.55), 0, 1)

    # Very slight desaturation: armour reads as metal, not as paint.
    grey = rgb.mean(axis=2, keepdims=True)
    rgb = np.clip(grey + (rgb - grey) * 0.95, 0, 1)

    out = np.concatenate([rgb, alpha], axis=2)
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")


def crop(box, mask, feather=(0, 0)):
    """Cut a piece out of the sheet.

    `feather` fades the alpha at the top and bottom edge of the crop. A rigid
    limb joint always has a straight cut somewhere; fading it over a few rows
    means that edge never draws a hard line across the cuff when the joint
    rotates, because the overlapping half already owns those pixels.
    """
    x0, y0, x1, y1 = box
    piece = source.crop(box)
    alpha = np.array(
        Image.fromarray((mask[y0:y1, x0:x1] * 255).astype(np.uint8), "L")
    ).astype(np.float32)

    top, bottom = feather
    height = alpha.shape[0]
    if top > 0:
        ramp = np.linspace(0.0, 1.0, top + 1, dtype=np.float32)[1:, None]
        alpha[:top, :] *= ramp
    if bottom > 0:
        ramp = np.linspace(0.0, 1.0, bottom + 1, dtype=np.float32)[:-1, None][::-1]
        alpha[height - bottom :, :] *= ramp

    alpha = Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8), "L")
    piece.putalpha(Image.fromarray(
        np.minimum(np.array(piece)[:, :, 3], np.array(alpha)), "L"
    ))
    # Only grade where the piece actually draws, so the faded edges keep the
    # original colour and never tint the stage behind them.
    graded = grade(piece)
    visible = np.array(piece)[:, :, 3] > 0
    base = np.array(piece)
    merged = np.where(visible[:, :, None], np.array(graded), base)
    return Image.fromarray(merged.astype(np.uint8), "RGBA")


def save(name, image, box, place_key, pivot):
    # PLACE holds where the crop's top-left sits in the finished character.
    x, y = PLACE[place_key]
    image.save(OUT / f"{name}.png")
    PARTS.append(
        {
            "name": name,
            "file": f"{name}.png",
            "x": x,
            "y": y,
            "width": image.width,
            "height": image.height,
            "pivot": [pivot[0], pivot[1]],
            "z": Z[name],
        }
    )


# ---------------------------------------------------------------------------
# HEAD and TORSO
# ---------------------------------------------------------------------------

# The cut follows the head's own outline instead of a straight row, so the
# collar below the beard stays intact and no flat edge can show.
head_mask = poly(
    [
        (66, 19), (80, 13), (96, 11), (111, 16), (122, 25), (130, 38),
        (134, 53), (133, 69), (128, 85), (121, 97), (112, 106), (101, 111),
        (89, 108), (79, 101), (72, 93), (76, 80), (79, 66), (76, 51),
        (69, 36), (59, 26),
    ]
)
# The braid hangs from the temple across the chest; it stays with the torso so
# turning the head cannot snap it in half.
save("head", crop(BODY_BOX, head_mask), BODY_BOX, "head", NECK)

torso = crop(BODY_BOX, ~head_mask)
save("torso", torso, BODY_BOX, "torso", NECK)

# ---------------------------------------------------------------------------
# ARMS
# ---------------------------------------------------------------------------

# The upper half fades into the cuff so its straight cut never draws a line
# over the bracer; the lower half keeps a soft top edge for the same reason.
ELBOW_BLEED = 34

save("arm-near-upper", crop(ARM_NEAR_BOX, rows(CUT_ARM_NEAR), feather=(0, 10)), ARM_NEAR_BOX, "arm-near", SHOULDER_NEAR)
save("arm-near-lower", crop(ARM_NEAR_BOX, ~rows(CUT_ARM_NEAR - ELBOW_BLEED), feather=(10, 0)), ARM_NEAR_BOX, "arm-near", ELBOW_NEAR)

save("arm-far-upper", crop(ARM_FAR_BOX, rows(CUT_ARM_FAR), feather=(0, 10)), ARM_FAR_BOX, "arm-far", SHOULDER_FAR)
save("arm-far-lower", crop(ARM_FAR_BOX, ~rows(CUT_ARM_FAR - ELBOW_BLEED), feather=(10, 0)), ARM_FAR_BOX, "arm-far", ELBOW_FAR)

# ---------------------------------------------------------------------------
# LEGS
# ---------------------------------------------------------------------------

# The knee sits inside the boot's fur cuff. Both halves fade across the cut,
# so a 30-degree bend reads as fur over trouser instead of a seam.
KNEE_BLEED = 36

save("leg-near-upper", crop(LEG_NEAR_BOX, rows(CUT_LEG_NEAR), feather=(0, 12)), LEG_NEAR_BOX, "leg-near", HIP_NEAR)
save("leg-near-lower", crop(LEG_NEAR_BOX, ~rows(CUT_LEG_NEAR - KNEE_BLEED), feather=(12, 0)), LEG_NEAR_BOX, "leg-near", KNEE_NEAR)

save("leg-far-upper", crop(LEG_FAR_BOX, rows(CUT_LEG_FAR), feather=(0, 12)), LEG_FAR_BOX, "leg-far", HIP_FAR)
save("leg-far-lower", crop(LEG_FAR_BOX, ~rows(CUT_LEG_FAR - KNEE_BLEED), feather=(12, 0)), LEG_FAR_BOX, "leg-far", KNEE_FAR)

# ---------------------------------------------------------------------------
# CAPE, SHIELD, AXE
# ---------------------------------------------------------------------------

save(
    "cape",
    crop(CAPE_BOX, rows(CAPE_SPLIT + CAPE_BLEED), feather=(0, 12)),
    CAPE_BOX,
    "cape",
    CAPE_ROOT,
)
save(
    "cape-tail",
    crop(CAPE_BOX, ~rows(CAPE_SPLIT - CAPE_BLEED), feather=(12, 0)),
    CAPE_BOX,
    "cape",
    # Canvas y of the split: the lower half hangs from where the halves meet.
    (CAPE_ROOT[0], PLACE["cape"][1] + (CAPE_SPLIT - CAPE_BOX[1])),
)

save("shield", crop(SHIELD_BOX, everything()), SHIELD_BOX, "shield", SHIELD_HAND)
save("axe", crop(AXE_BOX, everything()), AXE_BOX, "axe", GRIP_NEAR)

manifest = {
    "source": str(SHEET.relative_to(ROOT)),
    "canvas": {"width": CANVAS[0], "height": CANVAS[1]},
    "groundY": 445,
    "parts": PARTS,
}
(OUT / "kit.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

composite = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
for part in sorted(PARTS, key=lambda p: p["z"]):
    composite.alpha_composite(Image.open(OUT / part["file"]), (part["x"], part["y"]))
composite.save(QA / "kit-rest.png")

bg = Image.new("RGBA", CANVAS, (226, 224, 220, 255))
bg.alpha_composite(composite)
bg.resize((CANVAS[0] * 2, CANVAS[1] * 2), Image.LANCZOS).save(QA / "kit-rest-2x.png")

print(f"{len(PARTS)} parts")
for p in PARTS:
    print(f"  {p['name']:16s} {p['width']:3d}x{p['height']:3d} at {p['x']:4d},{p['y']:4d} pivot {p['pivot']}")
