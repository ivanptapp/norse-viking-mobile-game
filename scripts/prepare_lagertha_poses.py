"""One-time conversion of the existing white-backed pose plates to transparent PNGs.

Python is used only by this offline asset preparation script. The browser app loads
only the exported PNGs and has no Python runtime dependency.
"""
from pathlib import Path
import sys
import cv2
import numpy as np
from PIL import Image

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1] / 'public' / 'characters' / 'lagertha-poses'
OUT.mkdir(parents=True, exist_ok=True)

# Existing generated full-body plates. The original Lagertha reference is already RGBA.
PLATES = {
    'reference': ROOT / 'uploads' / 'figure_lagertha.png',
    'idle': ROOT / 'assets' / 'pose_09_queen_stance.png',
    'crouch': ROOT / 'assets' / 'pose_01_crouch.png',
    'spin': ROOT / 'assets' / 'pose_spin_back.png',
    'slash': ROOT / 'assets' / 'pose_03_spin_slash.png',
    'follow': ROOT / 'assets' / 'pose_04_horiz_follow.png',
    'dash': ROOT / 'assets' / 'pose_05_dash.png',
    'rise': ROOT / 'assets' / 'pose_06_rising_sweep.png',
    'chamber': ROOT / 'assets' / 'pose_07_overhead_chamber.png',
    'impact': ROOT / 'assets' / 'pose_08_final_diagonal.png',
}


def remove_white_background(path: Path) -> np.ndarray:
    rgba = np.array(Image.open(path).convert('RGBA'))
    if np.any(rgba[:, :, 3] < 255):
        return rgba
    rgb = rgba[:, :, :3]
    h, w = rgb.shape[:2]
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]], axis=0)
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(rgb.astype(np.float32) - bg[None, None, :], axis=2)
    near = (dist < 24).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(near, connectivity=8)
    # Label 0 is the non-near-white foreground, not a background component.
    border_labels = (set(np.unique(labels[0])) | set(np.unique(labels[-1])) | set(np.unique(labels[:, 0])) | set(np.unique(labels[:, -1]))) - {0}
    bg_mask = np.isin(labels, list(border_labels))
    # Remove large enclosed near-white pockets (the white studio background between limbs).
    for label in range(1, n):
        if label not in border_labels and stats[label, cv2.CC_STAT_AREA] > 120:
            mask = labels == label
            if float(np.median(dist[mask])) < 12:
                bg_mask |= mask
    fg = (~bg_mask).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    n2, labels2, stats2, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    kept = np.zeros_like(fg)
    for label in range(1, n2):
        if stats2[label, cv2.CC_STAT_AREA] >= 1000:
            kept[labels2 == label] = 1
    eroded = cv2.erode(kept, np.ones((3, 3), np.uint8), iterations=1)
    edge = (kept > 0) & (eroded == 0)
    alpha = kept.astype(np.float32)
    alpha[edge] = np.clip(dist[edge] / 65.0, 0, 1)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.5)
    alpha[eroded > 0] = 1.0
    # Decontaminate white fringe on semitransparent edge pixels.
    color = rgb.astype(np.float32)
    semi = (alpha > .02) & (alpha < .98)
    a = alpha[semi, None]
    color[semi] = np.clip((color[semi] - (1-a)*bg[None, :]) / np.maximum(a, .15), 0, 255)
    return np.dstack([color.astype(np.uint8), np.round(alpha*255).astype(np.uint8)])

for name, source in PLATES.items():
    if not source.exists():
        raise FileNotFoundError(f'Missing expected source artwork: {source}')
    result = remove_white_background(source)
    target = OUT / f'{name}.png'
    Image.fromarray(result, 'RGBA').save(target, optimize=True)
    print(f'{target.name:14s} {Image.open(target).size} alpha={Image.open(target).mode}')
