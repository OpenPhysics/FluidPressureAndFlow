/**
 * pinAccordionBox.ts
 *
 * Keeps an accordion box anchored to a fixed edge as it opens and closes.
 *
 * By default sun's AccordionBox reserves its expanded footprint even while
 * collapsed, so that opening it never moves anything. That is the right default
 * for a box in the middle of a column, but not for one anchored to the bottom of
 * the screen: the reserved space is invisible, so aligning the box's bottom to the
 * bottom margin leaves the visible title bar floating a hundred pixels up, with an
 * unexplained gap beneath it.
 *
 * These boxes therefore shrink to the size they look ({@link ACCORDION_BOX_SHRINK_WHEN_COLLAPSED}),
 * and this re-applies the anchor whenever that size changes, so the box grows
 * away from its anchored edge instead of through it.
 */

import type { AccordionBox } from "scenerystack/sun";

/**
 * Spread into an AccordionBox's options alongside `pinAccordionBox`. Kept next to
 * the function because the two are only correct together: shrinking without
 * re-anchoring makes an opened box overflow the screen edge.
 */
export const ACCORDION_BOX_SHRINK_WHEN_COLLAPSED = {
  useExpandedBoundsWhenCollapsed: false,
} as const;

/**
 * @param box - the box to anchor
 * @param reposition - sets the box's position; called now and on every open/close
 */
export function pinAccordionBox(box: AccordionBox, reposition: () => void): void {
  box.expandedProperty.link(reposition);
}
