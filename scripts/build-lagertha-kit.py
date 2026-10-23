"""Build Lagertha's articulated character from assets/heroes/lagertha_parts.png.

The sheet is a paper-doll kit: a headless torso with its cape, a separate head,
one arm holding the sword, one forearm carrying the round shield, and two bent
legs. Nothing is re-drawn: every piece is cut out, graded once, and placed back
where it belongs in a 540 x 900 character, so the renderer only has to rotate.

Joints are cut inside the cuffs and armour the artist already painted (elbow
fur, boot fur, knee guard), and both halves keep a few rows of shared pixels so
the seam never opens while the limb turns.

Output: public/heroes/lagertha-kit/*.png + kit.json, plus QA composites.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / "assets/heroes/lagertha_parts.png"
OUT = ROOT / "public/heroes/lagertha-kit"
QA = ROOT / "public/qa-lagertha"

CANVAS = (540, 900)

source = Image.open(SHEET).convert("RGBA")
PIX = np.array(source)
ALPHA = PIX[:, :, 3]

# ---------------------------------------------------------------------------
# Source crops (sheet space, 1200 x 896)
# ---------------------------------------------------------------------------

BODY_BOX = (308, 141, 649, 540)
HEAD_BOX = (855, 45, 1085, 227)
SWORD_BOX = (724, 248, 918, 466)
SHIELD_BOX = (1001, 322, 1160, 509)
LEG_LEFT_BOX = (122, 493, 298, 782)
LEG_RIGHT_BOX = (346, 478, 494, 761)

# ---------------------------------------------------------------------------
# Assembly targets, in character space. Every placement is solved from the
# joint it hangs on, so tuning a target moves the whole limb instead of
# leaving a piece behind.
# ---------------------------------------------------------------------------

NECK = (265, 250)
# The arms hang from the centre of their painted pauldron, not from an
# estimate: the ball's specular highlight is the joint.
SWORD_SHOULDER = (340, 297)
SHIELD_SHOULDER = (182, 282)
KNEE_NEAR = (192, 678)
KNEE_FAR = (331, 669)

# Joints as painted, in sheet space.
NECK_SHEET = (507, 193)
SWORD_SHOULDER_SHEET = (740, 288)
SWORD_ELBOW_SHEET = (805, 352)
SHIELD_SHOULDER_SHEET = (1016, 333)
KNEE_NEAR_SHEET = (240, 600)
KNEE_FAR_SHEET = (440, 570)

# The elbow always sits exactly where the upper arm puts it, so the two halves
# of the arm can never be placed against each other.
SWORD_ELBOW_TARGET = (
    SWORD_SHOULDER[0] + (SWORD_ELBOW_SHEET[0] - SWORD_SHOULDER_SHEET[0]),
    SWORD_SHOULDER[1] + (SWORD_ELBOW_SHEET[1] - SWORD_SHOULDER_SHEET[1]),
)
HIP_NEAR_SHEET = (242, 513)
HIP_FAR_SHEET = (408, 530)

# Cut rows, also in sheet space. Both sit inside the painted cuffs.
CUT_SWORD_ELBOW = 352
CUT_KNEE_NEAR = 600
CUT_KNEE_FAR = 570

ELBOW_BLEED = 26
KNEE_BLEED = 30

# The sheet tucks both thighs up behind the skirt, so the visible trouser is
# shorter than a hip needs. Extending it upwards gives each leg a real hip
# joint while the skirt keeps the extension out of sight.
LEG_NEAR_EXTEND = 24
LEG_FAR_EXTEND = 52

Z = {
    "leg-far-upper": 1,
    "leg-far-lower": 2,
    "leg-near-upper": 3,
    "leg-near-lower": 4,
    "torso": 5,
    "head": 6,
    "arm-sword-upper": 7,
    "arm-sword-lower": 8,
    "arm-shield": 9,
}

PARTS: list[dict] = []
OUT.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Mask helpers
# ---------------------------------------------------------------------------


def poly(points: list[tuple[int, int]]) -> np.ndarray:
    """Smooth-edged polygon mask at 4x supersampling."""
    big = Image.new("L", (PIX.shape[1] * 4, PIX.shape[0] * 4), 0)
    ImageDraw.Draw(big).polygon([(x * 4, y * 4) for x, y in points], fill=255)
    return np.array(big.resize((PIX.shape[1], PIX.shape[0]), Image.LANCZOS)) > 96


def rows(max_y: int) -> np.ndarray:
    mask = np.zeros(PIX.shape[:2], dtype=bool)
    mask[: max_y + 1, :] = True
    return mask


def everything() -> np.ndarray:
    return np.ones(PIX.shape[:2], dtype=bool)


def part_component(box, alpha_min: int = 12) -> np.ndarray:
    """Mask of the single painted piece whose bounding box matches `box`.

    The sheet's pieces overlap in space (the far leg is laid out under the
    skirt), so a plain rectangle crop would also carry the neighbour's
    pixels. Labelling the sheet once and keeping only the piece that owns the
    box leaves every stray fragment behind.
    """
    labels, count = ndimage.label(ALPHA > alpha_min)
    slices = ndimage.find_objects(labels)
    x0, y0, x1, y1 = box
    best, best_score = 0, 1e9
    for index in range(1, count + 1):
        sl = slices[index - 1]
        if sl is None:
            continue
        ys, xs = sl
        score = abs(xs.start - x0) + abs(ys.start - y0) + abs(xs.stop - x1) + abs(ys.stop - y1)
        if score < best_score:
            best, best_score = index, score
    mask = labels == best
    print(f"  component for {box}: score {best_score:.0f}")
    return mask


# ---------------------------------------------------------------------------
# Grade
# ---------------------------------------------------------------------------


def grade(piece: Image.Image) -> Image.Image:
    """Cinematic grade, applied identically to every piece.

    Lagertha's reference is lit like a film still: cool shadows, warm amber
    highlights, a little more contrast than the flat drawing. Grading each
    piece (instead of the screen) keeps the seams invisible, because both
    halves of a joint receive exactly the same transform.
    """
    arr = np.array(piece).astype(np.float32) / 255.0
    rgb, alpha = arr[:, :, :3], arr[:, :, 3:]

    # Gentle S-curve around mid grey.
    rgb = 0.5 + (rgb - 0.5) * 1.08
    rgb = np.clip(rgb, 0, 1)

    # Split tone: cold blue shadows, amber highlights.
    luma = (
        rgb[:, :, 0] * 0.299 + rgb[:, :, 1] * 0.587 + rgb[:, :, 2] * 0.114
    )[:, :, None]
    cool = np.array([0.84, 1.0, 1.14], dtype=np.float32)
    warm = np.array([1.09, 1.02, 0.9], dtype=np.float32)
    tint = cool * (1.0 - luma) + warm * luma
    rgb = np.clip(rgb * (1.0 + (tint - 1.0) * 0.6), 0, 1)

    # A touch of desaturation so the leather reads as leather.
    grey = rgb.mean(axis=2, keepdims=True)
    rgb = np.clip(grey + (rgb - grey) * 0.96, 0, 1)

    out = np.concatenate([rgb, alpha], axis=2)
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")


def crop(box, mask, feather=(0, 0), extend_top=0):
    """Cut a piece out of the sheet.

    `feather` fades the alpha at the top and bottom edge of the crop, so the
    straight cut of a rigid limb never draws a hard line once it rotates.
    `extend_top` clones the top rows upwards: the trouser is flat enough that
    the extension is invisible, and it gives a hidden thigh a real hip joint.
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

    alpha_img = Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8), "L")
    piece.putalpha(
        Image.fromarray(np.minimum(np.array(piece)[:, :, 3], np.array(alpha_img)), "L")
    )

    if extend_top > 0:
        piece = extend_upwards(piece, extend_top)

    # Only grade where the piece draws, so faded edges keep the original
    # colour instead of tinting the stage behind them.
    graded = grade(piece)
    visible = np.array(piece)[:, :, 3] > 0
    base = np.array(piece)
    merged = np.where(visible[:, :, None], np.array(graded), base)
    return Image.fromarray(merged.astype(np.uint8), "RGBA")


def extend_upwards(piece: Image.Image, rows_count: int) -> Image.Image:
    """Stretch the top rows of a piece upwards, keeping the alpha edge."""
    w, h = piece.size
    out = Image.new("RGBA", (w, h + rows_count), (0, 0, 0, 0))
    # Blend the first four rows so the extension follows the trousers' shading.
    band = piece.crop((0, 0, w, min(4, h)))
    band = band.resize((w, rows_count), Image.BILINEAR)
    out.paste(band, (0, 0))
    out.paste(piece, (0, rows_count))
    return out


def save(name, image, pivot_canvas, place):
    """Store a piece and its placement.

    `place` is the image's top-left in character space and `pivot_canvas` the
    joint it turns around, also in character space: that is what the renderer
    needs, and it must not be confused with the sheet coordinates the build
    works in.
    """
    image.save(OUT / f"{name}.png")
    PARTS.append(
        {
            "name": name,
            "file": f"{name}.png",
            "x": int(place[0]),
            "y": int(place[1]),
            "width": image.width,
            "height": image.height,
            "pivot": [int(round(pivot_canvas[0])), int(round(pivot_canvas[1]))],
            "z": Z[name],
        }
    )


def place_for(box, pivot_sheet, target, extend_top=0):
    """Top-left so that the painted joint lands on `target`."""
    return (
        target[0] - (pivot_sheet[0] - box[0]),
        target[1] - (pivot_sheet[1] - box[1]) - extend_top,
    )


def to_canvas(box, pivot_sheet, place, extend_top=0):
    """Sheet joint → character-space joint, through the piece's placement."""
    return (
        place[0] + pivot_sheet[0] - box[0],
        place[1] + pivot_sheet[1] - box[1] + extend_top,
    )


# ---------------------------------------------------------------------------
# TORSO + HEAD
# ---------------------------------------------------------------------------

body_place = place_for(BODY_BOX, NECK_SHEET, NECK)
body_piece = crop(BODY_BOX, part_component(BODY_BOX), feather=(0, 6))
save("torso", body_piece, to_canvas(BODY_BOX, NECK_SHEET, body_place), body_place)

head_place = place_for(HEAD_BOX, (1037, 200), (NECK[0] + 2, NECK[1] - 22))
head_piece = crop(HEAD_BOX, part_component(HEAD_BOX), feather=(0, 4))
# The neck stub is painted below the chin; the pivot sits just under it so a
# head turn carries the hair without detaching the neck from the collar.
save("head", head_piece, to_canvas(HEAD_BOX, (1037, 200), head_place), head_place)

# ---------------------------------------------------------------------------
# SWORD ARM
# ---------------------------------------------------------------------------

# A single sheet piece holds the whole arm and the sword. Cutting at the fur
# cuff gives a real elbow; the overlap hides the cut while it bends.
sword_mask = part_component(SWORD_BOX)
sword_upper_mask = sword_mask & rows(CUT_SWORD_ELBOW)
sword_lower_mask = sword_mask & ~rows(CUT_SWORD_ELBOW - ELBOW_BLEED)

sword_upper_place = place_for(SWORD_BOX, SWORD_SHOULDER_SHEET, SWORD_SHOULDER)
sword_lower_place = place_for(SWORD_BOX, SWORD_ELBOW_SHEET, SWORD_ELBOW_TARGET)

save(
    "arm-sword-upper",
    crop(SWORD_BOX, sword_upper_mask, feather=(0, 10)),
    to_canvas(SWORD_BOX, SWORD_SHOULDER_SHEET, sword_upper_place),
    sword_upper_place,
)
save(
    "arm-sword-lower",
    crop(SWORD_BOX, sword_lower_mask, feather=(10, 0)),
    to_canvas(SWORD_BOX, SWORD_ELBOW_SHEET, sword_lower_place),
    sword_lower_place,
)

# ---------------------------------------------------------------------------
# SHIELD ARM
# ---------------------------------------------------------------------------

# The shield is painted on top of the forearm, so the whole piece stays rigid:
# it turns at the shoulder, which is exactly how a strapped shield behaves.
shield_piece = crop(SHIELD_BOX, part_component(SHIELD_BOX), feather=(0, 6))
# Mirror it: the arm is painted entering the shield from the left, and she
# carries it on the near (viewer-left) side.
mirrored = shield_piece.transpose(Image.FLIP_LEFT_RIGHT)
pivot_local = (SHIELD_SHOULDER_SHEET[0] - SHIELD_BOX[0], SHIELD_SHOULDER_SHEET[1] - SHIELD_BOX[1])
mirror_pivot_local = (mirrored.width - 1 - pivot_local[0], pivot_local[1])
shield_place = (
    SHIELD_SHOULDER[0] - mirror_pivot_local[0],
    SHIELD_SHOULDER[1] - mirror_pivot_local[1],
)
save(
    "arm-shield",
    mirrored,
    to_canvas(SHIELD_BOX, (SHIELD_BOX[0] + mirror_pivot_local[0], SHIELD_BOX[1] + mirror_pivot_local[1]), shield_place),
    shield_place,
)

# ---------------------------------------------------------------------------
# LEGS
# ---------------------------------------------------------------------------

# Each leg is anchored by its knee: the three lower pieces are placed from the
# same point, so the upper and lower halves can never drift apart. The hip
# sits above the painted trouser, inside the skirt, where it belongs.
leg_far_mask = part_component(LEG_RIGHT_BOX)
leg_near_mask = part_component(LEG_LEFT_BOX)

leg_far_place = place_for(LEG_RIGHT_BOX, KNEE_FAR_SHEET, KNEE_FAR, LEG_FAR_EXTEND)
leg_near_place = place_for(LEG_LEFT_BOX, KNEE_NEAR_SHEET, KNEE_NEAR, LEG_NEAR_EXTEND)

# Both hips sit at the same height, just inside the skirt: that is the pelvis,
# and it is where a walking leg has to pivot from. Pivoting from the painted
# trouser top instead would make one leg swing from halfway down the thigh.
HIP_Y = 548
HIP_NEAR = (KNEE_NEAR[0] + (HIP_NEAR_SHEET[0] - KNEE_NEAR_SHEET[0]), HIP_Y)
HIP_FAR = (KNEE_FAR[0] + (HIP_FAR_SHEET[0] - KNEE_FAR_SHEET[0]), HIP_Y)

save(
    "leg-far-upper",
    crop(LEG_RIGHT_BOX, leg_far_mask & rows(CUT_KNEE_FAR), feather=(10, 12), extend_top=LEG_FAR_EXTEND),
    HIP_FAR,
    leg_far_place,
)
save(
    "leg-far-lower",
    crop(LEG_RIGHT_BOX, leg_far_mask & ~rows(CUT_KNEE_FAR - KNEE_BLEED), feather=(12, 0)),
    to_canvas(LEG_RIGHT_BOX, KNEE_FAR_SHEET, place_for(LEG_RIGHT_BOX, KNEE_FAR_SHEET, KNEE_FAR)),
    place_for(LEG_RIGHT_BOX, KNEE_FAR_SHEET, KNEE_FAR),
)

save(
    "leg-near-upper",
    crop(LEG_LEFT_BOX, leg_near_mask & rows(CUT_KNEE_NEAR), feather=(0, 12), extend_top=LEG_NEAR_EXTEND),
    HIP_NEAR,
    leg_near_place,
)
save(
    "leg-near-lower",
    crop(LEG_LEFT_BOX, leg_near_mask & ~rows(CUT_KNEE_NEAR - KNEE_BLEED), feather=(12, 0)),
    to_canvas(LEG_LEFT_BOX, KNEE_NEAR_SHEET, place_for(LEG_LEFT_BOX, KNEE_NEAR_SHEET, KNEE_NEAR)),
    place_for(LEG_LEFT_BOX, KNEE_NEAR_SHEET, KNEE_NEAR),
)

# ---------------------------------------------------------------------------

manifest = {
    "source": str(SHEET.relative_to(ROOT)),
    "canvas": {"width": CANVAS[0], "height": CANVAS[1]},
    "groundY": 860,
    "rootPivot": [240, 860],
    "parts": PARTS,
}
(OUT / "kit.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

# The renderer's copy of the manifest, generated so the TS pivots can never
# drift from the pixels they rotate.
TS_PARTS = ROOT / "src/components/characters/Lagertha/lagerthaKitParts.ts"
lines = [
    "/**",
    " * Generated by scripts/build-lagertha-kit.py — do not edit by hand.",
    " *",
    " * `x`/`y` place the crop in the 540 x 900 character, `pivot` is the joint it",
    " * turns around, also in character space.",
    " */",
    'import type { KitPart } from "../shared/skeletalKit";',
    "",
    "export const LAGERTHA_KIT_PARTS = {",
]
for part in PARTS:
    lines.append(
        f'  "{part["name"]}": {{ file: "{part["file"]}", x: {part["x"]}, y: {part["y"]}, '
        f'width: {part["width"]}, height: {part["height"]}, pivot: [{part["pivot"][0]}, {part["pivot"][1]}] }},'
    )
lines += ["} satisfies Record<string, KitPart>;", ""]
TS_PARTS.write_text("\n".join(lines), encoding="utf-8")

composite = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
for part in sorted(PARTS, key=lambda p: p["z"]):
    composite.alpha_composite(Image.open(OUT / part["file"]), (part["x"], part["y"]))
composite.save(QA / "kit-rest.png")

bg = Image.new("RGBA", CANVAS, (226, 224, 220, 255))
# Contact shadow under the boots, so the QA render shows the weight the game
# stage will show.
shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.ellipse([(150, 852), (330, 872)], fill=(0, 0, 0, 90))
bg.alpha_composite(shadow)
bg.alpha_composite(composite)
bg.convert("RGB").resize((CANVAS[0] * 2, CANVAS[1] * 2), Image.LANCZOS).save(
    QA / "kit-rest-2x.png"
)

# Debug overlay: every pivot, so a wrong joint is visible at a glance.
debug = bg.copy()
d = ImageDraw.Draw(debug)
for name, point in {
    "neck": NECK,
    "sword shoulder": SWORD_SHOULDER,
    "sword elbow": SWORD_ELBOW_TARGET,
    "shield shoulder": SHIELD_SHOULDER,
    "knee near": KNEE_NEAR,
    "knee far": KNEE_FAR,
    "hip near": HIP_NEAR,
    "hip far": HIP_FAR,
}.items():
    d.ellipse([point[0] - 5, point[1] - 5, point[0] + 5, point[1] + 5], outline=(255, 0, 0), width=2)
    d.line([point[0] - 12, point[1], point[0] + 12, point[1]], fill=(255, 0, 0), width=1)
    d.line([point[0], point[1] - 12, point[0], point[1] + 12], fill=(255, 0, 0), width=1)
    d.text((point[0] + 8, point[1] - 12), name, fill=(200, 30, 30))
debug.convert("RGB").resize((CANVAS[0] * 2, CANVAS[1] * 2), Image.LANCZOS).save(
    QA / "kit-debug.png"
)

print(f"{len(PARTS)} parts")
for p in PARTS:
    print(
        f"  {p['name']:18s} {p['width']:3d}x{p['height']:3d} at {p['x']:4d},{p['y']:4d}"
        f" pivot {p['pivot']}"
    )
