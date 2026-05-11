# App Icon Replacement + Module Order Persistence Fix

**Date:** 2026-05-11
**Scope:** Two small, independent changes bundled together.

## Background

User supplied a new app icon (6000×6000 PNG: black rounded-corner background, dark teal gradient, ring of ~58 teal dashes, centered "RD" wordmark) and reported that reordering tiles on the home screen does not appear to persist after returning from the reorder screen.

## Part 1 — App Icon

### Goal

Replace the current Expo app icon with the user's artwork. iOS uses the full composition; Android adaptive icon is split so the design survives system masking (circle, squircle, etc.).

### Asset Plan

All files written to `mobile/assets/` at 1024×1024:

| File | Content |
|---|---|
| `icon.png` | Full source artwork. Used by iOS and as web/Expo Go fallback. |
| `android-icon-background.png` | Dark teal gradient **with the ring of dashes** baked in. No wordmark. The dashes live in the background layer so they survive Android's foreground crop. |
| `android-icon-foreground.png` | Only the "RD" wordmark, centered, scaled to fit Android's safe zone (inner ~66% of the canvas). Rest transparent. |
| `android-icon-monochrome.png` | "RD" wordmark in white (alpha mask) on transparent background. Used for Android 13+ themed icons. |

Splash assets (`splash-icon.png`, `splash-screen.png`) are **not** touched.

### `app.json`

No changes. Existing config already points at the four filenames above:

```json
"icon": "./assets/icon.png",
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#E6F4FE",
    "foregroundImage": "./assets/android-icon-foreground.png",
    "backgroundImage": "./assets/android-icon-background.png",
    "monochromeImage": "./assets/android-icon-monochrome.png"
  }
}
```

`backgroundColor` is unused when `backgroundImage` is supplied, so we leave it as-is.

### Image Processing

A one-shot Python script at `scripts/process-app-icon.py` produces all four PNGs from a single source. The script stays in the repo for future tweaks.

**Inputs:**
- `scripts/source-icon.png` — the original 6000×6000 artwork. The user supplied this image in chat; before running the script, the implementer saves it to this path (or asks the user to drop the file into `scripts/`).

**Outputs (overwrites existing files):**
- `mobile/assets/icon.png`
- `mobile/assets/android-icon-background.png`
- `mobile/assets/android-icon-foreground.png`
- `mobile/assets/android-icon-monochrome.png`

**Steps the script performs:**

1. **`icon.png`:** Resize source to 1024×1024 with high-quality Lanczos resampling. Write as PNG.
2. **`android-icon-foreground.png`:**
   - Detect the bright cyan "RD" pixels by HSV thresholding (high saturation, hue around cyan/teal-bright, value above mid).
   - Tighten the mask to letter shapes only (exclude the ring of dashes — those are dimmer / lower saturation).
   - Crop to the bounding box of the wordmark, then place it on a 1024×1024 transparent canvas, scaled to fit within the safe-zone diameter (inner 66% = ~676 px square area), centered.
3. **`android-icon-background.png`:**
   - Start from a resized 1024×1024 copy of the source.
   - Paint over the "RD" pixels with surrounding background color (sample mean color from a ring around each masked pixel, or use a uniform dark-teal fill `#003E4F`-ish — pick whichever produces less visible seam in a smoke test; uniform fill is fallback). Result keeps the gradient + dashes but no letters.
4. **`android-icon-monochrome.png`:**
   - Take the "RD" mask from step 2.
   - Render it as white pixels (`#FFFFFF`) at full opacity on a transparent 1024×1024 canvas, same position/scale as in the foreground file.

**Verification:** After running the script, eyeball the four output PNGs. The user is on Windows — they can open them in Explorer's preview pane.

### Build

The new icon only ships via an EAS build, not Expo Go. After regenerating assets and committing, the next `npm run build:apk` (and equivalent iOS build) will pick up the new icon. No further config needed.

## Part 2 — Module Order Persistence Fix

### Symptom

User reorders tiles in `ModuleOrderScreen`, navigates back to `HomeScreen`, and sees the old order.

### Root Cause

`HomeScreen` is the root of the `HomeStack` tab and stays mounted in the background while the user visits `ModuleOrderScreen`. The current `useModuleOrder` hook reads AsyncStorage exactly once in a `useEffect` with empty deps. When `ModuleOrderScreen` saves a new order to AsyncStorage, `HomeScreen`'s local state copy never refreshes — the read effect doesn't re-run on a screen that was never unmounted.

The data **is** saved correctly; the bug is purely a stale in-memory copy in `HomeScreen`.

### Fix

Convert `useModuleOrder` to a tiny module-level pub/sub: one shared cache + a set of subscribers. All consumers of the hook stay in sync without re-reading from disk and without any focus-effect plaster.

**`mobile/src/hooks/useModuleOrder.ts`** — full replacement:

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

### Behavior

- **First consumer to mount** triggers a single AsyncStorage read; `cachedOrder` populates and any waiting components rerender once the promise resolves.
- **Subsequent consumers** read from `cachedOrder` synchronously — no extra disk reads.
- **`update(keys)`** publishes synchronously to every mounted consumer's `setState`, then persists to disk in the background. `HomeScreen` sees the new order before the user has finished tapping the back button.
- **Unmount** removes the subscriber to prevent leaks.

### Call Sites Unchanged

`HomeScreen.tsx` and `ModuleOrderScreen.tsx` both call `useModuleOrder(DEFAULT_ORDER)` and receive `[order, setOrder]`. The public hook signature is identical, so neither file needs to change.

### Trade-offs

- Module-level mutable state is a code smell in larger systems. For one UI preference shared between two screens it is the minimum mechanism that solves the bug. If more user preferences accumulate, fold them into a dedicated `PreferencesContext` or a TanStack Query entry — out of scope here (YAGNI).
- The cache survives for the lifetime of the JS bundle, which matches user expectation for a "single session" but is fine across cold starts because the next mount re-reads from disk.

### Tests

No new unit tests in this iteration. The hook is exercised through a drag-and-drop UI; a meaningful test needs an integration setup. Manual verification:

1. Open the app, go to home screen, note tile order.
2. Open module reorder screen, drag a tile, return to home.
3. Tile order on home reflects the change immediately (no app restart).
4. Cold-start the app — order persists.

## Out of Scope

- Adding more user preferences to the new pub/sub pattern.
- Splash screen redesign.
- Any change to `app.json` beyond what is described above.
- Integration tests for the reorder flow.

## Files Touched

- **New:** `scripts/process-app-icon.py`, `scripts/source-icon.png` (user provides the source; not committed if user prefers).
- **Replaced:** `mobile/assets/icon.png`, `mobile/assets/android-icon-background.png`, `mobile/assets/android-icon-foreground.png`, `mobile/assets/android-icon-monochrome.png`.
- **Modified:** `mobile/src/hooks/useModuleOrder.ts`.
- **Unchanged:** `mobile/app.json`, `mobile/src/screens/HomeScreen.tsx`, `mobile/src/screens/ModuleOrderScreen.tsx`.
