#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render the 1200x630 Open Graph PNGs from the SVG sources' design.

Requires Pillow (pip install pillow). The SVG files in /assets/img/og/ are the
editable sources; this script produces the PNG raster each social platform
needs. Run after scripts/build.py.
"""
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: pip install pillow")

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OG = os.path.join(ROOT, "assets", "img", "og")

W, H = 1200, 630
BG = (12, 18, 34)
TEXT = (234, 240, 255)
MUTED = (154, 166, 204)
MINT = (46, 230, 166)
A1 = (61, 123, 255)
A2 = (34, 211, 238)

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

TITLES = {
    "home": ("Kitbox", "Free online tools that never see your files"),
    "tools": ("All tools", "Twelve browser utilities, grouped by what they do"),
    "about": ("About Kitbox", "Privacy-first tools with no backend"),
    "contact": ("Contact", "Questions, bug reports and tool suggestions"),
    "privacy": ("Privacy Policy", "How Kitbox handles data"),
    "terms": ("Terms of Use", "Plain terms for a free static site"),
    "cookies": ("Cookie Policy", "Storage, consent and how to change it"),
    "404": ("Page not found", "Browse the twelve Kitbox tools instead"),
    "image-compressor": ("Image Compressor", "Shrink JPG, PNG and WebP locally"),
    "image-resizer": ("Image Resizer", "Exact pixel sizes and social presets"),
    "image-converter": ("Image Converter", "JPG, PNG and WebP in any direction"),
    "pdf-merge": ("PDF Merge", "Combine PDFs with drag-and-drop ordering"),
    "pdf-split": ("PDF Split", "Page ranges, groups or single pages"),
    "images-to-pdf": ("Images to PDF", "JPG and PNG into one paginated PDF"),
    "word-counter": ("Word Counter", "Live counts, reading time and density"),
    "case-converter": ("Case Converter", "Nine case styles in one click"),
    "lorem-ipsum-generator": ("Lorem Ipsum", "Placeholder paragraphs, sentences, words"),
    "json-formatter": ("JSON Formatter", "Validate, pretty-print, minify and browse"),
    "qr-code-generator": ("QR Code Generator", "Links, Wi-Fi, vCard and email"),
    "password-generator": ("Password Generator", "Secure randomness, real entropy"),
}


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def shield(draw, cx, cy, scale):
    pts = [
        (0, -1.05), (0.72, -0.72), (0.72, 0.1),
        (0.0, 1.05), (-0.72, 0.1), (-0.72, -0.72),
    ]
    poly = [(cx + x * scale, cy + y * scale) for x, y in pts]
    draw.polygon(poly, fill=(19, 27, 51), outline=A2, width=max(2, int(scale * 0.09)))
    w = max(3, int(scale * 0.13))
    draw.line([(cx - scale * 0.34, cy + scale * 0.02),
               (cx - scale * 0.08, cy + scale * 0.3),
               (cx + scale * 0.38, cy - scale * 0.34)],
              fill=MINT, width=w, joint="curve")


def render(slug, title, subtitle):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Subtle diagonal accent glow in the top-right corner.
    for i in range(240):
        t = i / 240.0
        r = 420 - i
        if r <= 0:
            break
        col = lerp(BG, lerp(A1, A2, t), 0.10 * (1 - t))
        d.ellipse([980 - r, 60 - r, 980 + r, 60 + r], fill=col)

    # Brand bar
    for x in range(W):
        d.line([(x, 0), (x, 8)], fill=lerp(A1, A2, x / float(W)))

    shield(d, 170, 300, 105)

    f_title = ImageFont.truetype(FONT_BOLD, 76 if len(title) < 20 else 60)
    f_sub = ImageFont.truetype(FONT_REG, 36)
    f_brand = ImageFont.truetype(FONT_BOLD, 30)
    f_note = ImageFont.truetype(FONT_REG, 28)

    d.text((320, 196), "KITBOX", font=f_brand, fill=MUTED)
    d.text((320, 240), title, font=f_title, fill=TEXT)

    # Wrap the subtitle to two lines at most.
    words = subtitle.split()
    lines, cur = [], ""
    for w_ in words:
        probe = (cur + " " + w_).strip()
        if d.textlength(probe, font=f_sub) > 790 and cur:
            lines.append(cur)
            cur = w_
        else:
            cur = probe
    if cur:
        lines.append(cur)
    y = 350
    for line in lines[:2]:
        d.text((320, y), line, font=f_sub, fill=MUTED)
        y += 48

    d.rounded_rectangle([320, 470, 900, 536], radius=33, fill=(19, 27, 51), outline=(46, 230, 166, 120))
    d.ellipse([348, 496, 364, 512], fill=MINT)
    d.text((380, 490), "0 bytes uploaded — processed in your browser",
           font=f_note, fill=MINT)

    img.save(os.path.join(OG, slug + ".png"), "PNG", optimize=True)


def main():
    os.makedirs(OG, exist_ok=True)
    for slug, (title, sub) in TITLES.items():
        render(slug, title, sub)
    print("Rendered %d Open Graph images." % len(TITLES))


if __name__ == "__main__":
    main()
