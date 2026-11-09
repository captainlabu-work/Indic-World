# Source images (not part of the website build)

Full-size originals of the images in `public/`. Nothing in this folder is served to visitors;
only the optimised copies in `public/` are.

| Original | Used for | Optimised copies in `public/` |
|---|---|---|
| `starry-night.jpg` (4032×2496) | Editor background (`TiptapEditor.css`) | `images/editor-bg-{1280,1600}.{avif,webp}` |
| `kyrie-isaac-…jpg` | Homepage "Indic Word" tile | `images/explore-word-{480,800,1200}.{avif,webp}` |
| `saajithan-thayaparan-…jpg` | Homepage "Indic Lens" tile | `images/explore-lens-{480,800,1200}.{avif,webp}` |
| `vasiko-gorkovoy-…jpg` | Homepage "Indic Motion" tile | `images/explore-motion-{480,800,1200}.{avif,webp}` |
| `Indic.png` (512×512) | Logo with wordmark | `Indic.png` resized to 256×256 |
| `Indic 2.png` (256×256) | Lotus logo (navbar) | `Indic 2.png` resized to 192×192 |
| `favicon.ico` (old, 207 KB) | — | `favicon.ico` rebuilt from `Indic.png` at 16/32/48 px |

How the copies were made (with [sharp](https://sharp.pixelplumbing.com/)):
- Tiles: width 480 / 800 / 1200, WebP quality 68, AVIF quality 48.
- Editor background: width 1280 / 1600, WebP quality 50, AVIF quality 40. It is shown blurred
  behind a dark overlay, so the lower quality isn't visible.
- Logos: resized PNG with an 8-bit palette (quality 92).

To replace an image, export new copies with the same names and sizes; keep each under ~300 KB.
