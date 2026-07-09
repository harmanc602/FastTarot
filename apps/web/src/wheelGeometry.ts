/**
 * Wheel sizing math, shared by the picker layout (`App.tsx`) and the wheel
 * renderer (`CardWheel.tsx`) so they agree on one source of truth.
 *
 * The wheel is width-driven: card size, radius, and the visible arc all scale
 * with the available width. `fanHeight` is the fan's *natural* vertical extent
 * (apex card top → lowest cards + bottom margin) and depends only on width — the
 * picker uses it to cap the wheel's height so the fan sits directly under the
 * instruction instead of floating with a blank gap above it.
 */
export interface WheelMetrics {
  cardWidth: number;
  cardHeight: number;
  radius: number;
  visibleHalfArc: number;
  /** Vertical offset (px) of the hub below the top of the wheel band. Uses `h`. */
  hubTop: number;
  /** Natural fan height (px). Depends on width only; used to cap the wheel band. */
  fanHeight: number;
}

// Tunable factors (kept here so both consumers stay in sync).
const TOP_GAP_FACTOR = 0.3; // clearance above the apex within the wheel band
const BOTTOM_MARGIN_FACTOR = 0.4; // clearance below the lowest cards
const SELECT_LIFT_FACTOR = 0.2; // how far a selected card slides outward

export function wheelMetrics(w: number, h: number): WheelMetrics {
  const cardWidth = Math.max(78, Math.min(138, w / 5.33));
  const cardHeight = cardWidth * 1.5;
  const radius = Math.max(260, Math.min(w * 0.62, 540));

  // Narrow viewports show a slimmer arc (fewer cards at once); wide viewports
  // open up to the full spread. `w === 0` on first paint → treat as wide.
  const visibleHalfArc = w === 0 ? 54 : Math.max(25, Math.min(54, w / 13.33));
  const arcRad = (visibleHalfArc * Math.PI) / 180;

  const bottomMargin = cardHeight * BOTTOM_MARGIN_FACTOR;
  const topGap = cardHeight * TOP_GAP_FACTOR;

  // Fan's natural height: the sagitta of the visible arc, plus a full card (the
  // apex) with room for the selected-card lift, plus the bottom margin.
  const fanHeight =
    radius * (1 - Math.cos(arcRad)) + cardHeight * (1 + SELECT_LIFT_FACTOR) + bottomMargin;

  // Anchor the fan to the bottom of the band; clamp so the apex can't clip off
  // the top on short bands.
  const bottomAnchoredHub = h - bottomMargin + radius * Math.cos(arcRad) - cardHeight / 2;
  const hubTop = Math.max(radius + topGap, bottomAnchoredHub);

  return { cardWidth, cardHeight, radius, visibleHalfArc, hubTop, fanHeight };
}
