# App Icon Replacement + Module Order Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the app icon with user-supplied artwork (split for Android adaptive icon) and fix a stale-state bug where reordering home-screen tiles does not appear after navigating back.

**Architecture:** Part 1 — a one-shot Python/Pillow script processes a single source PNG into four icon assets (full icon, Android background with ring, Android foreground with "RD" only, Android monochrome). Part 2 — convert `useModuleOrder` from local `useState` + one-shot load into a module-level pub/sub cache so all consumers stay in sync without re-reading AsyncStorage.

**Tech Stack:** Python 3 + Pillow (icon generation, dev only). React Native, React hooks, AsyncStorage (module order).

**Spec:** `docs/superpowers/specs/2026-05-11-app-icon-and-module-order-fix-design.md`

---

## File Structure

**Created:**
- `scripts/process-app-icon.py` — image processing script (committed, kept for future tweaks).

**Replaced (binary assets):**
- `mobile/assets/icon.png`
- `mobile/assets/android-icon-background.png`
- `mobile/assets/android-icon-foreground.png`
- `mobile/assets/android-icon-monochrome.png`

**Modified:**
- `mobile/src/hooks/useModuleOrder.ts`

**Source asset on disk:**
- `mobile/assets/App Icon _ 2000_2000.png` (already in place, supplied by user — note: filename has spaces and underscores; despite the name it is the 6000×6000 source).

**Unchanged:** `mobile/app.json`, `mobile/src/screens/HomeScreen.tsx`, `mobile/src/screens/ModuleOrderScreen.tsx`, splash assets.

---

## Part 1 — App Icon Assets

### Task 1: Add the image processing script

**Files:**
- Create: `scripts/process-app-icon.py`

- [ ] **Step 1: Verify Python + Pillow are available**

Run: `python --version && python -c "import PIL; print(PIL.__version__)"`
Expected: Python 3.x and a Pillow version string. If Pillow is missing, run `python -m pip install Pillow` first.

- [ ] **Step 2: Verify the source image is present and inspect dimensions**

Run: `python -c "from PIL import Image; im = Image.open(r'mobile/assets/App Icon _ 2000_2000.png'); print(im.size, im.mode)"`
Expected: a tuple like `(6000, 6000)` (or `(2000, 2000)` — the script must not assume a specific size) and a mode such as `RGB` / `RGBA`.

- [ ] **Step 3: Create the script**

Create `scripts/process-app-icon.py` with this exact content:

```python
"""Generate Expo app icon assets from a single source PNG.

Inputs:
  SOURCE (constant below) - path to the original square artwork.

Outputs (overwrites if present):
  mobile/assets/icon.png                       - 1024x1024 full image (iOS + fallback)
  mobile/assets/android-icon-background.png    - 1024x1024 gradient + dash ring, no wordmark
  mobile/assets/android-icon-foreground.png    - 1024x1024 transparent canvas with "RD" centered
  mobile/assets/android-icon-monochrome.png    - 1024x1024 white "RD" mask on transparent
"""
from __future__ import annotations

import colorsys
from pathlib import Path
from PIL import Image, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE = REPO_ROOT / "mobile" / "assets" / "App Icon _ 2000_2000.png"
OUT_DIR = REPO_ROOT / "mobile" / "assets"

CANVAS = 1024
SAFE_ZONE_RATIO = 0.66  # Android adaptive icon safe zone is ~66% of canvas

# HSV thresholds for isolating the bright cyan "RD" wordmark.
# The wordmark is high-saturation, high-value cyan; the ring of dashes
# is dimmer (lower value) and the dark background is low-saturation.
WORDMARK_H_MIN = 0.42   # ~150 deg
WORDMARK_H_MAX = 0.55   # ~200 deg
WORDMARK_S_MIN = 0.55
WORDMARK_V_MIN = 0.70


def load_source() -> Image.Image:
    if not SOURCE.exists():
        raise SystemExit(f"Source image not found: {SOURCE}")
    im = Image.open(SOURCE).convert("RGBA")
    if im.width != im.height:
        raise SystemExit(f"Source must be square, got {im.size}")
    return im


def resize_square(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.LANCZOS)


def build_wordmark_mask(im_rgba: Image.Image) -> Image.Image:
    """Return an L-mode mask where the bright cyan 'RD' pixels are white."""
    px = im_rgba.load()
    w, h = im_rgba.size
    mask = Image.new("L", (w, h), 0)
    mpx = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            if (WORDMARK_H_MIN <= hh <= WORDMARK_H_MAX
                    and ss >= WORDMARK_S_MIN
                    and vv >= WORDMARK_V_MIN):
                mpx[x, y] = 255
    # Restrict to the central region so we don't grab any stray bright pixels
    # from the dash ring. The wordmark sits in roughly the inner 50% diameter.
    cx, cy = w / 2, h / 2
    r_max = w * 0.30  # 30% of canvas radius
    for y in range(h):
        for x in range(w):
            if mpx[x, y] == 0:
                continue
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy > r_max * r_max:
                mpx[x, y] = 0
    return mask


def bounding_box(mask: Image.Image) -> tuple[int, int, int, int]:
    bbox = mask.getbbox()
    if bbox is None:
        raise SystemExit("Failed to detect wordmark — mask is empty. Tune HSV thresholds.")
    return bbox


def make_icon_png(source: Image.Image) -> None:
    out = resize_square(source, CANVAS)
    out.save(OUT_DIR / "icon.png", "PNG")
    print(f"  wrote {OUT_DIR / 'icon.png'}")


def make_foreground(source: Image.Image, mask: Image.Image) -> None:
    """RD wordmark centered on transparent 1024x1024, scaled to safe zone."""
    bbox = bounding_box(mask)
    cropped_rgba = source.crop(bbox)
    cropped_mask = mask.crop(bbox)
    # Apply mask as alpha so only wordmark pixels survive.
    r, g, b, _ = cropped_rgba.split()
    wordmark = Image.merge("RGBA", (r, g, b, cropped_mask))
    # Scale so the longer edge fits within the safe zone.
    target = int(CANVAS * SAFE_ZONE_RATIO)
    scale = target / max(wordmark.size)
    new_size = (max(1, int(wordmark.width * scale)), max(1, int(wordmark.height * scale)))
    wordmark = wordmark.resize(new_size, Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    ox = (CANVAS - wordmark.width) // 2
    oy = (CANVAS - wordmark.height) // 2
    canvas.paste(wordmark, (ox, oy), wordmark)
    canvas.save(OUT_DIR / "android-icon-foreground.png", "PNG")
    print(f"  wrote {OUT_DIR / 'android-icon-foreground.png'}")


def make_background(source: Image.Image, mask: Image.Image) -> None:
    """Source with the RD wordmark erased and replaced by surrounding color."""
    work = source.copy().convert("RGBA")
    # Dilate the mask slightly so we cover anti-aliased letter edges too.
    dilated = mask.filter(ImageFilter.MaxFilter(7))
    # Build a fill image: heavy blur of the source, sampled outside the mask.
    blurred = source.filter(ImageFilter.GaussianBlur(radius=40)).convert("RGBA")
    # Composite blurred-fill where mask is set, original elsewhere.
    work = Image.composite(blurred, work, dilated)
    out = resize_square(work, CANVAS)
    out.save(OUT_DIR / "android-icon-background.png", "PNG")
    print(f"  wrote {OUT_DIR / 'android-icon-background.png'}")


def make_monochrome(mask: Image.Image) -> None:
    """White RD on transparent, same position/scale as foreground."""
    bbox = bounding_box(mask)
    cropped_mask = mask.crop(bbox)
    white = Image.new("RGBA", cropped_mask.size, (255, 255, 255, 0))
    white.putalpha(cropped_mask)
    target = int(CANVAS * SAFE_ZONE_RATIO)
    scale = target / max(white.size)
    new_size = (max(1, int(white.width * scale)), max(1, int(white.height * scale)))
    white = white.resize(new_size, Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    ox = (CANVAS - white.width) // 2
    oy = (CANVAS - white.height) // 2
    canvas.paste(white, (ox, oy), white)
    canvas.save(OUT_DIR / "android-icon-monochrome.png", "PNG")
    print(f"  wrote {OUT_DIR / 'android-icon-monochrome.png'}")


def main() -> None:
    print(f"Source: {SOURCE}")
    source = load_source()
    print(f"  size: {source.size}")
    mask = build_wordmark_mask(source)
    make_icon_png(source)
    make_background(source, mask)
    make_foreground(source, mask)
    make_monochrome(mask)
    print("Done.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Commit the script**

```bash
git add scripts/process-app-icon.py
git commit -m "Add app icon processing script"
```

---

### Task 2: Generate and verify the four icon assets

**Files:**
- Modify (overwrite): `mobile/assets/icon.png`, `mobile/assets/android-icon-background.png`, `mobile/assets/android-icon-foreground.png`, `mobile/assets/android-icon-monochrome.png`

- [ ] **Step 1: Run the script**

Run: `python scripts/process-app-icon.py`
Expected output (last 5 lines):
```
  wrote .../mobile/assets/icon.png
  wrote .../mobile/assets/android-icon-background.png
  wrote .../mobile/assets/android-icon-foreground.png
  wrote .../mobile/assets/android-icon-monochrome.png
Done.
```

If the script raises `Failed to detect wordmark — mask is empty`, the HSV thresholds need tuning. Diagnostic:

```bash
python -c "from PIL import Image; from scripts import process_app_icon as p; im=p.load_source(); m=p.build_wordmark_mask(im); m.save('mobile/assets/_debug-mask.png')"
```

Open `_debug-mask.png` — the white area should match the "RD" letters. If it grabs the dash ring, raise `WORDMARK_V_MIN` toward 0.80. If the mask is empty, widen the hue range or lower `WORDMARK_S_MIN`. Re-run, then delete `_debug-mask.png`.

- [ ] **Step 2: Verify each output file by dimensions and mode**

Run:
```bash
python -c "from PIL import Image; \
[print(p, Image.open(p).size, Image.open(p).mode) for p in [\
  'mobile/assets/icon.png', \
  'mobile/assets/android-icon-background.png', \
  'mobile/assets/android-icon-foreground.png', \
  'mobile/assets/android-icon-monochrome.png']]"
```
Expected: every file reports `(1024, 1024)`. `icon.png` and `android-icon-background.png` should be `RGB` or `RGBA`; `android-icon-foreground.png` and `android-icon-monochrome.png` must be `RGBA`.

- [ ] **Step 3: Visual eyeball**

Open the four files in Windows Explorer's preview pane (or any image viewer):
- `icon.png` — full original artwork at 1024×1024.
- `android-icon-background.png` — dark teal gradient with the ring of dashes, **no "RD" letters** (they should be replaced by surrounding blurred color).
- `android-icon-foreground.png` — only the "RD" letters, centered, with transparent margins.
- `android-icon-monochrome.png` — same "RD" silhouette but white, on transparent.

If any output looks wrong, tune the script (see Step 1 diagnostic) and re-run.

- [ ] **Step 4: Commit the new assets**

```bash
git add mobile/assets/icon.png mobile/assets/android-icon-background.png mobile/assets/android-icon-foreground.png mobile/assets/android-icon-monochrome.png
git commit -m "Update app icon assets from new artwork"
```

Note: `mobile/.git/` is a separate repository. Run the commands above from the parent repo root — `mobile/assets/` is tracked there too (verify with `git ls-files mobile/assets/icon.png` before committing). If `git ls-files` returns nothing, switch into `mobile/` and commit from the nested repo instead.

---

## Part 2 — Module Order Persistence Fix

### Task 3: Replace `useModuleOrder` with a module-level pub/sub

**Files:**
- Modify: `mobile/src/hooks/useModuleOrder.ts` (full file replacement, 34 lines → ~65 lines)
- Touched indirectly (no edits needed): `mobile/src/screens/HomeScreen.tsx`, `mobile/src/screens/ModuleOrderScreen.tsx`

- [ ] **Step 1: Confirm the baseline typechecks**

Run from `mobile/`:
```bash
npm run typecheck
```
Expected: exits 0, no errors. If there are pre-existing errors unrelated to this work, note them and continue — the goal is to not introduce new ones.

- [ ] **Step 2: Replace the hook contents**

Replace the entire contents of `mobile/src/hooks/useModuleOrder.ts` with:

```ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../utils/logError';

const MODULE_ORDER_KEY = 'home_module_order';

let cachedOrder: string[] | null = null;
let loadPromise: Promise<void> | null = null;
const subscribers = new Set<(order: string[]) => void>();

function loadOnce(defaults: string[]) {
  if (loadPromise) return loadPromise;
  loadPromise = AsyncStorage.getItem(MODULE_ORDER_KEY).then(val => {
    if (!val) { cachedOrder = defaults; return; }
    try {
      const saved: string[] = JSON.parse(val);
      const valid = saved.filter(k => defaults.includes(k));
      const added = defaults.filter(k => !saved.includes(k));
      cachedOrder = [...valid, ...added];
    } catch {
      cachedOrder = defaults;
    }
  }).catch(e => {
    logError('useModuleOrder:load', e);
    cachedOrder = defaults;
  });
  return loadPromise;
}

function publish(next: string[]) {
  cachedOrder = next;
  subscribers.forEach(fn => fn(next));
}

export function useModuleOrder(defaultKeys: string[]): [string[], (keys: string[]) => void] {
  const [order, setOrder] = useState<string[]>(cachedOrder ?? defaultKeys);

  useEffect(() => {
    subscribers.add(setOrder);
    if (cachedOrder == null) {
      loadOnce(defaultKeys).then(() => {
        if (cachedOrder) setOrder(cachedOrder);
      });
    } else {
      setOrder(cachedOrder);
    }
    return () => { subscribers.delete(setOrder); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((keys: string[]) => {
    publish(keys);
    AsyncStorage.setItem(MODULE_ORDER_KEY, JSON.stringify(keys))
      .catch(e => logError('useModuleOrder:save', e));
  }, []);

  return [order, update];
}
```

- [ ] **Step 3: Typecheck**

Run from `mobile/`:
```bash
npm run typecheck
```
Expected: exits 0. Public signature `[string[], (keys: string[]) => void]` is identical to the previous version, so callers continue to compile.

- [ ] **Step 4: Run the existing test suite**

Run from `mobile/`:
```bash
npm test
```
Expected: all currently-passing tests still pass. There is no existing test for `useModuleOrder`, so nothing in particular needs to be exercised — we are only confirming we did not break unrelated code.

- [ ] **Step 5: Manual smoke test (device or simulator)**

Run from `mobile/`:
```bash
npm start
```
Then in the running app:
1. Open the home screen, note current tile order.
2. Open the settings → "Kolejność sekcji" screen (or however `ModuleOrderScreen` is reached in the UI).
3. Long-press a tile and drag it to a new position. Wait for the drop animation to settle.
4. Press the back arrow to return to the home screen.
5. **Expected:** tiles on home screen reflect the new order immediately, with no app reload.
6. Fully close the app (kill from recents) and re-open it.
7. **Expected:** order persists across cold start.

If step 5 fails, the bug is not fixed — re-read Task 3 Step 2 and confirm the file was saved.

- [ ] **Step 6: Commit**

```bash
git -C mobile add src/hooks/useModuleOrder.ts
git -C mobile commit -m "Fix stale home tile order by sharing state across hook consumers"
```

(`mobile/` is its own git repo per CLAUDE.md — commit from inside it.)

---

## Final Verification

- [ ] **Step 1: Full repo status**

Run: `git -C mobile status && git status`
Expected: both repos clean (or only show unrelated work-in-progress).

- [ ] **Step 2: Confirm the spec and plan are committed in the parent repo**

Run: `git log --oneline -5`
Expected: recent commits include the design spec, the icon script, and the icon assets.

- [ ] **Step 3: Report results**

Summarize to the user:
1. Icon assets regenerated and committed; new icon takes effect on the next EAS build (not visible in Expo Go).
2. Tile reorder now updates the home screen immediately and persists across restarts.

---

## Out of Scope (do not implement here)

- Splash screen updates.
- A `PreferencesContext` for multiple user prefs (premature — only one preference today).
- Unit / integration tests for the reorder flow (manual verification only this iteration).
- Any `app.json` change.
