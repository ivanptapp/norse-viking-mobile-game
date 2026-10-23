"""Cut Lagertha's original illustration into articulated, game-ready layers.

The source is a single flattened drawing. We keep the original figure as a
static base (torso, cape, shield and costume) and lift only the parts that
move: the head with all of its hair, the sword arm (upper arm and
forearm+hand+sword), and both legs split at the knee.

A clean plate fills the lifted areas with the nearest surrounding artwork,
so a swinging limb never reveals the background. At rest, base + parts
reproduce the source pixel-for-pixel.

Run: .venv/bin/python scripts/build-lagertha-rig.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/heroes/figure_lagertha.png"
OUT = ROOT / "public/heroes/lagertha-rig"
QA = ROOT / "public/qa-lagertha"

SS = 4


def poly(size: tuple[int, int], points: list[tuple[int, int]]) -> np.ndarray:
    width, height = size
    image = Image.new("L", (width * SS, height * SS), 0)
    draw = ImageDraw.Draw(image)
    draw.polygon([(x * SS, y * SS) for x, y in points], fill=255)
    image = image.resize(size, Image.LANCZOS)
    return np.array(image) > 96


def ellipse(
    size: tuple[int, int], center: tuple[int, int], radius: tuple[int, int]
) -> np.ndarray:
    width, height = size
    image = Image.new("L", (width * SS, height * SS), 0)
    draw = ImageDraw.Draw(image)
    cx, cy = center
    rx, ry = radius
    draw.ellipse(
        ((cx - rx) * SS, (cy - ry) * SS, (cx + rx) * SS, (cy + ry) * SS),
        fill=255,
    )
    image = image.resize(size, Image.LANCZOS)
    return np.array(image) > 96


def stroke(
    size: tuple[int, int],
    points: list[tuple[int, int]],
    width: int,
) -> np.ndarray:
    image = Image.new("L", (size[0] * SS, size[1] * SS), 0)
    draw = ImageDraw.Draw(image)
    draw.line(
        [(x * SS, y * SS) for x, y in points],
        fill=255,
        width=width * SS,
        joint="curve",
    )
    image = image.resize(size, Image.LANCZOS)
    return np.array(image) > 96


def union(*masks: np.ndarray) -> np.ndarray:
    out = np.zeros_like(masks[0], dtype=bool)
    for mask in masks:
        out |= mask
    return out


def bounds(mask: np.ndarray, padding: int = 2) -> tuple[int, int, int, int]:
    ys, xs = np.where(mask)
    if len(xs) == 0:
        raise ValueError("empty mask")
    return (
        max(0, int(xs.min()) - padding),
        max(0, int(ys.min()) - padding),
        min(mask.shape[1], int(xs.max()) + 1 + padding),
        min(mask.shape[0], int(ys.max()) + 1 + padding),
    )


source_image = Image.open(SOURCE).convert("RGBA")
WIDTH, HEIGHT = source_image.size
source = np.array(source_image)
foreground = source[:, :, 3] > 0

# ---------------------------------------------------------------------------
# Head: face, crown, both braids and the flowing hair behind the shoulders.
# The hair is included so head turns carry it naturally.
# ---------------------------------------------------------------------------

HAIR_REGION = poly(
    (WIDTH, HEIGHT),
    [
        (235, 52), (222, 58), (208, 68), (194, 80), (180, 93),
        (166, 107), (152, 121), (140, 135), (130, 149), (124, 163),
        (128, 177), (140, 186), (154, 185), (168, 178), (181, 168),
        (193, 156), (202, 142), (209, 126), (215, 109), (222, 92),
        (228, 75), (232, 62),
    ],
)

source_rgb = source.astype(np.int16)
r, g, b = source_rgb[:, :, 0], source_rgb[:, :, 1], source_rgb[:, :, 2]
# Blonde hair is warm; this keeps the dark fur mantle behind it in the base.
HAIR_COLOR = (
    (r > 78)
    & (g > 55)
    & (r > b + 10)
    & (g > b + 4)
    & foreground
)
HAIR_MASK = HAIR_REGION & HAIR_COLOR
HAIR_MASK = ndimage.binary_closing(HAIR_MASK, iterations=2)
HAIR_MASK = ndimage.binary_dilation(HAIR_MASK, iterations=1)
HAIR_MASK &= HAIR_REGION

SHIELD_CORE = ellipse((WIDTH, HEIGHT), (350, 252), (80, 112))

SWORD_CORE = union(
    stroke((WIDTH, HEIGHT), [(143, 298), (282, 438)], 24),
    stroke((WIDTH, HEIGHT), [(104, 286), (166, 307)], 14),
    stroke((WIDTH, HEIGHT), [(120, 290), (100, 326)], 15),
    ellipse((WIDTH, HEIGHT), (98, 326), (13, 13)),
)

HEAD = union(
    poly(
        (WIDTH, HEIGHT),
        [
            (232, 66), (240, 53), (254, 46), (272, 45), (290, 51),
            (307, 62), (321, 76), (332, 93), (339, 112), (342, 133),
            (340, 152), (335, 170), (326, 185), (315, 199), (303, 208),
            (291, 213), (279, 210), (270, 201), (263, 191), (253, 183),
            (244, 172), (237, 159), (232, 145), (227, 130), (225, 114),
            (227, 98), (232, 82),
        ],
    ),
    HAIR_MASK,
    # thick front braid
    poly(
        (WIDTH, HEIGHT),
        [
            (232, 116), (247, 117), (253, 133), (252, 151), (248, 170),
            (246, 190), (243, 209), (231, 214), (220, 209), (220, 190),
            (224, 170), (228, 150), (228, 132),
        ],
    ),
    # thin braid on the far side of the face
    poly(
        (WIDTH, HEIGHT),
        [
            (320, 102), (332, 106), (336, 122), (332, 140), (326, 157),
            (319, 171), (311, 168), (314, 152), (318, 135), (319, 118),
        ],
    ),
    # neck hidden behind the fur collar
    poly(
        (WIDTH, HEIGHT),
        [
            (276, 168), (311, 168), (314, 190), (308, 210), (284, 215),
            (272, 198),
        ],
    ),
)
HEAD &= ~SHIELD_CORE

# ---------------------------------------------------------------------------
# Sword arm. Upper arm is one piece; forearm + hand + sword is another.
# ---------------------------------------------------------------------------

ARM_UPPER = poly(
    (WIDTH, HEIGHT),
    [
        (158, 172), (188, 174), (205, 186), (212, 202), (208, 219),
        (198, 235), (186, 249), (170, 259), (152, 264), (137, 261),
        (128, 251), (134, 238), (144, 226), (151, 212), (153, 198),
        (155, 184),
    ],
)

ARM_LOWER = union(
    # vambrace + cuff, kept close to the visible armour
    poly(
        (WIDTH, HEIGHT),
        [
            (122, 232), (143, 232), (156, 244), (158, 260), (154, 278),
            (149, 294), (139, 306), (125, 310), (111, 302), (104, 288),
            (104, 272), (109, 256), (114, 242),
        ],
    ),
    # fist
    ellipse((WIDTH, HEIGHT), (116, 300), (26, 21)),
    # blade, guard, grip and pommel as one continuous silhouette
    SWORD_CORE,
)

# ---------------------------------------------------------------------------
# Legs. Each leg is two rigid pieces with an overlap under the knee guard.
# ---------------------------------------------------------------------------

LEG_NEAR_UPPER = poly(
    (WIDTH, HEIGHT),
    [
        (148, 318), (180, 308), (214, 316), (230, 334), (232, 358),
        (223, 382), (207, 400), (187, 408), (167, 403), (153, 389),
        (146, 371), (144, 346),
    ],
)

LEG_NEAR_LOWER = poly(
    (WIDTH, HEIGHT),
    [
        (144, 386), (174, 380), (194, 390), (202, 408), (199, 431),
        (190, 454), (178, 478), (163, 500), (146, 520), (126, 536),
        (106, 548), (84, 552), (64, 546), (52, 534), (56, 520),
        (70, 506), (85, 490), (98, 472), (108, 452), (115, 432),
        (120, 412), (128, 398),
    ],
)

LEG_FAR_UPPER = poly(
    (WIDTH, HEIGHT),
    [
        (300, 316), (334, 308), (364, 318), (380, 338), (383, 363),
        (375, 387), (359, 402), (336, 409), (313, 399), (299, 381),
        (293, 356), (295, 335),
    ],
)

LEG_FAR_LOWER = poly(
    (WIDTH, HEIGHT),
    [
        (305, 388), (335, 380), (360, 382), (379, 394), (389, 412),
        (391, 434), (394, 457), (399, 480), (404, 503), (406, 525),
        (399, 543), (386, 553), (366, 555), (346, 549), (329, 539),
        (316, 523), (307, 505), (301, 485), (299, 463), (299, 440),
        (301, 414),
    ],
)

PARTS = [
    ("head", HEAD, (292, 194), "front"),
    ("arm-upper", ARM_UPPER, (195, 195), "front"),
    ("arm-lower", ARM_LOWER, (150, 252), "front"),
    ("leg-far-upper", LEG_FAR_UPPER, (335, 333), "back"),
    ("leg-far-lower", LEG_FAR_LOWER, (335, 392), "back"),
    ("leg-near-upper", LEG_NEAR_UPPER, (198, 333), "back"),
    ("leg-near-lower", LEG_NEAR_LOWER, (178, 391), "back"),
]

OUT.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)

manifest: dict = {
    "source": str(SOURCE.relative_to(ROOT)),
    "canvasWidth": WIDTH,
    "canvasHeight": HEIGHT,
    "base": "base.png",
    "underlay": "underlay.png",
    "parts": [],
}

masks: dict[str, np.ndarray] = {}
for name, mask, pivot, depth in PARTS:
    masks[name] = mask & foreground

LEG_NAMES = {
    "leg-far-upper",
    "leg-far-lower",
    "leg-near-upper",
    "leg-near-lower",
}

# Base holes only remove visible moving pixels. The sword and shield stay in
# the base; a leg cut in front of them would otherwise punch a hole in them.
base_removed = union(
    *(
        mask if name not in LEG_NAMES else mask & ~SWORD_CORE & ~SHIELD_CORE
        for name, mask in masks.items()
    )
)

# Static base: the untouched drawing with lifted parts cut away.
base = source.copy()
base[:, :, 3] = np.where(base_removed, 0, base[:, :, 3])
Image.fromarray(base, "RGBA").save(OUT / "base.png")

# Clean plate: every lifted pixel takes the colour of the nearest surviving
# pixel. This stretches surrounding fur, mail and leather into the gap
# without inventing bright or black areas.
hole = ndimage.binary_dilation(base_removed, iterations=2)
# Only foreground pixels may donate colour; transparent black must never
# leak into the clean plate.
valid = foreground & ~hole
_, indices = ndimage.distance_transform_edt(~valid, return_indices=True)
filled_rgb = source[:, :, :3][indices[0], indices[1]].astype(np.float32)
# A light blur inside the hole removes hard stretch streaks.
blurred = ndimage.gaussian_filter(filled_rgb, sigma=(0.9, 0.9, 0))
underlay_rgb = source[:, :, :3].astype(np.float32)
underlay_rgb[hole] = blurred[hole]
underlay = source.copy()
underlay[:, :, :3] = np.clip(underlay_rgb, 0, 255).astype(np.uint8)
Image.fromarray(underlay, "RGBA").save(OUT / "underlay.png")

# Individual parts.
for name, mask, pivot, depth in PARTS:
    mask = masks[name]
    x0, y0, x1, y1 = bounds(mask, 2)
    part = source.copy()

    if name in LEG_NAMES:
        # Fill the part of the leg hidden by the sword or shield with the
        # nearest visible leg pixels, so the limb stays continuous when it
        # moves out from behind them.
        occluded = mask & (SWORD_CORE | SHIELD_CORE)
        visible = mask & ~occluded & foreground
        if occluded.any() and visible.any():
            _, idx = ndimage.distance_transform_edt(~visible, return_indices=True)
            filled = source[:, :, :3][idx[0], idx[1]]
            part[:, :, :3][occluded] = filled[occluded]

    part[:, :, 3] = np.where(mask, part[:, :, 3], 0)
    crop = part[y0:y1, x0:x1]
    Image.fromarray(crop, "RGBA").save(OUT / f"{name}.png")
    manifest["parts"].append(
        {
            "name": name,
            "file": f"{name}.png",
            "x": int(x0),
            "y": int(y0),
            "width": int(x1 - x0),
            "height": int(y1 - y0),
            "pivotX": int(pivot[0]),
            "pivotY": int(pivot[1]),
            "depth": depth,
        }
    )

(OUT / "rig.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

# At-rest composite verification.
by_name = {item["name"]: item for item in manifest["parts"]}
composite = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
composite.alpha_composite(Image.open(OUT / "underlay.png"))
for name, mask, pivot, depth in PARTS:
    if depth == "back":
        item = by_name[name]
        composite.alpha_composite(Image.open(OUT / f"{name}.png"), (item["x"], item["y"]))
composite.alpha_composite(Image.open(OUT / "base.png"))
for name, mask, pivot, depth in PARTS:
    if depth == "front":
        item = by_name[name]
        composite.alpha_composite(Image.open(OUT / f"{name}.png"), (item["x"], item["y"]))
composite.save(QA / "rig-at-rest.png")

diff = np.abs(np.array(composite).astype(int) - source.astype(int))
print(f"At-rest mean abs diff: {diff[:, :, :3].mean():.4f}")
print(f"At-rest max alpha diff: {diff[:, :, 3].max()}")

for part in manifest["parts"]:
    print(
        f"  {part['name']:16s} {part['width']:3d}x{part['height']:3d}"
        f" at {part['x']:3d},{part['y']:3d} pivot {part['pivotX']:3d},{part['pivotY']:3d}"
    )
