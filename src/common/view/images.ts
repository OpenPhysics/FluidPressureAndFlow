/**
 * images.ts
 *
 * The sim's bitmaps, preloaded before the sim launches.
 *
 * Vite hands an image import back as a URL string, and a scenery `Image`
 * constructed from a URL has zero bounds until the browser has fetched it. That
 * breaks every layout expressed against a bitmap's bounds — `right:
 * head.left + 30`, `centerX: bulb.centerX`, `handle.localBounds` — because those
 * are read once at construction time and resolve against an empty rectangle. The
 * Flow pipe is built almost entirely that way, so its segments and handles ended
 * up scattered across the screen.
 *
 * Registering a lock with `asyncLoader` for each element is how PhET's own
 * generated `*_png.js` modules solve this: the sim does not launch until every
 * lock is released, so by the time any view code runs, `width`/`height` are
 * known and bounds-relative layout is correct on the first pass.
 *
 * These locks are created at module-evaluation time, which happens while
 * `main.ts` is still being imported — before `onReadyToLaunch` checks the
 * loader — so nothing has to be sequenced by hand.
 */

import { asyncLoader } from "scenerystack/phet-core";
import handleWithBarUrl from "../../../images/handleWithBar.png";
import injectorBulbUrl from "../../../images/injectorBulbCropped.png";
import pipeLeftBackUrl from "../../../images/pipeLeftBack.png";
import pipeLeftFrontUrl from "../../../images/pipeLeftFront.png";
import pipeRightUrl from "../../../images/pipeRight.png";
import pipeSegmentUrl from "../../../images/pipeSegment.png";

function preload(url: string): HTMLImageElement {
  const element = document.createElement("img");
  const unlock = asyncLoader.createLock(element);
  // Released on error as well as on success: a missing bitmap should leave the
  // sim usable with a blank spot, not hang it on the splash screen forever.
  element.onload = unlock;
  element.onerror = unlock;
  element.src = url;
  return element;
}

export const handleWithBarImage = preload(handleWithBarUrl);
export const injectorBulbImage = preload(injectorBulbUrl);
export const pipeLeftBackImage = preload(pipeLeftBackUrl);
export const pipeLeftFrontImage = preload(pipeLeftFrontUrl);
export const pipeRightImage = preload(pipeRightUrl);
export const pipeSegmentImage = preload(pipeSegmentUrl);
