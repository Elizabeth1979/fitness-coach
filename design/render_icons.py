"""Render the Move With Elli app icons (no dependencies — standard library only).

The icon is the green "Start" play button: a white rounded play triangle on the
app's brand green (#15803d). Geometry matches public/favicon.svg and
design/app-icon-fullbleed.svg (a 512×512 canvas):

  triangle  A(206,158) B(370,256) C(206,354), corners rounded by 20px
            (the SVG's 40px round-joined stroke = every point within 20px of the triangle)
  rounded   rx 115 — browser / desktop icons (transparent corners)
  fullbleed no rounding — phones round the corners themselves

Run from the repo root:  python3 design/render_icons.py
"""
import struct
import zlib
from pathlib import Path

GREEN = (21, 128, 61)
WHITE = (255, 255, 255)
TRI = ((206.0, 158.0), (370.0, 256.0), (206.0, 354.0))
TRI_R = 20.0
RX = 115.0
SS = 4  # 4×4 supersampling for smooth edges


def _seg_dist2(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    qx, qy = ax + t * dx - px, ay + t * dy - py
    return qx * qx + qy * qy


def _in_triangle(px, py):
    (ax, ay), (bx, by), (cx, cy) = TRI
    def side(x1, y1, x2, y2):
        return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
    d1, d2, d3 = side(ax, ay, bx, by), side(bx, by, cx, cy), side(cx, cy, ax, ay)
    neg = d1 < 0 or d2 < 0 or d3 < 0
    pos = d1 > 0 or d2 > 0 or d3 > 0
    if not (neg and pos):
        return True
    r2 = TRI_R * TRI_R
    (ax, ay), (bx, by), (cx, cy) = TRI
    return (_seg_dist2(px, py, ax, ay, bx, by) <= r2 or _seg_dist2(px, py, bx, by, cx, cy) <= r2
            or _seg_dist2(px, py, cx, cy, ax, ay) <= r2)


def _in_background(px, py, rounded):
    if not rounded:
        return 0 <= px <= 512 and 0 <= py <= 512
    cx = min(max(px, RX), 512 - RX)
    cy = min(max(py, RX), 512 - RX)
    return (px - cx) ** 2 + (py - cy) ** 2 <= RX * RX


def render(size, rounded):
    scale = 512.0 / size
    tri_box = (186, 138, 390, 374)  # triangle + rounding, in 512 space
    rows = bytearray()
    n = SS * SS
    for y in range(size):
        rows.append(0)  # PNG filter: none
        for x in range(size):
            bg = fg = 0
            for sy in range(SS):
                py = (y + (sy + 0.5) / SS) * scale
                for sx in range(SS):
                    px = (x + (sx + 0.5) / SS) * scale
                    if _in_background(px, py, rounded):
                        bg += 1
                        if tri_box[0] <= px <= tri_box[2] and tri_box[1] <= py <= tri_box[3] and _in_triangle(px, py):
                            fg += 1
            if bg == 0:
                rows += bytes((0, 0, 0, 0))
                continue
            f = fg / bg  # white share of the visible area
            rgb = tuple(round(GREEN[i] * (1 - f) + WHITE[i] * f) for i in range(3))
            rows += bytes((*rgb, round(255 * bg / n)))
    return _png(size, size, bytes(rows))


def _png(w, h, raw):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)  # 8-bit RGBA
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')


if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    targets = [
        (root / 'public/icons/icon-192.png', 192, True),        # manifest, purpose "any"
        (root / 'public/icons/icon-512.png', 512, True),        # manifest, purpose "any"
        (root / 'public/icons/maskable-512.png', 512, False),   # manifest, purpose "maskable" (Android)
        (root / 'public/apple-touch-icon.png', 180, False),     # iPhone / iPad home screen
    ]
    for path, size, rounded in targets:
        path.write_bytes(render(size, rounded))
        print(f'wrote {path.relative_to(root)} ({size}×{size}, {"rounded" if rounded else "full-bleed"})')
