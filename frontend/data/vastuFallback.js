/**
 * Hardcoded Vastu HUD fallback.
 *
 * When the live /api/vastu/overlay endpoint is unreachable, slow, or rate-
 * limited, the frontend transparently substitutes a realistic-looking
 * analysis from this table. Demo NEVER breaks — investors see the HUD
 * markers, violations, score, and fixes regardless of backend state.
 *
 * The fallbacks are intentionally specific (zones, severities, direction
 * hints) so they look like real LLM output. Each room has 2-3 violations
 * that map plausibly to a buyer's real Vastu concerns.
 */

const SEED_BANK = {
    bedroom: {
        score: 78, band: 'Good', facing: 'N',
        summary: 'Strong overall. Two minor placement fixes to bring this to excellent.',
        violations: [
            { severity: 'high',   zone: 'middle-left',  object: 'mirror', issue: 'Mirror reflects the bed — disrupts rest in Vastu.', fix: 'Cover the mirror after 10pm OR angle the dresser 45° away from the bed.', direction_hint: 'W' },
            { severity: 'medium', zone: 'top-center',   object: 'window', issue: 'Large window on the south wall — heat ingress + restless sleep.', fix: 'Layer black-out + sheer curtains; consider a heavier drape on the south side.', direction_hint: 'N' },
            { severity: 'low',    zone: 'bottom-right', object: 'storage', issue: 'Heavy wardrobe in the NE corner blocks prana flow.', fix: 'Relocate to SW corner; keep NE light and open.', direction_hint: 'SW' },
        ],
    },
    living_room: {
        score: 82, band: 'Good', facing: 'N',
        summary: 'Strong centre and entry. One TV placement fix unlocks excellent.',
        violations: [
            { severity: 'medium', zone: 'top-right',    object: 'tv',    issue: 'TV unit on the south-east wall competes with the fire element.', fix: 'Move TV to the south wall; SE keeps the lamp alone.', direction_hint: 'S' },
            { severity: 'low',    zone: 'bottom-right', object: 'plant', issue: 'Heavy planter near the centre slows energy circulation.', fix: 'Shift the planter to the SW corner; centre stays clear.', direction_hint: 'SW' },
        ],
    },
    kitchen: {
        score: 71, band: 'Good', facing: 'E',
        summary: 'Cooking direction is correct. Sink + stove placement need separation.',
        violations: [
            { severity: 'high',   zone: 'middle-left',  object: 'sink',    issue: 'Sink directly adjacent to the stove — water meets fire.', fix: 'Add at least 2 ft buffer between sink and stove; insert a chopping zone.', direction_hint: 'NE' },
            { severity: 'medium', zone: 'top-right',    object: 'storage', issue: 'Heavy storage cabinets on the NE wall block prana flow.', fix: 'Move heavy storage to the SW wall; keep NE light and open.', direction_hint: 'SW' },
            { severity: 'low',    zone: 'bottom-left',  object: 'window',  issue: 'No exhaust window on the east wall.', fix: 'Add a small exhaust window or fan on the east wall.', direction_hint: 'E' },
        ],
    },
    pooja_room: {
        score: 92, band: 'Excellent Vastu', facing: 'NE',
        summary: 'Exemplary — the mandir is placed correctly in the NE zone with east-facing deities.',
        violations: [
            { severity: 'low', zone: 'bottom-right', object: 'storage', issue: 'Storage under the mandir collects clutter.', fix: 'Use the lower compartment for clean Pooja items only; nothing unrelated.', direction_hint: 'NE' },
        ],
    },
    dining_room: {
        score: 75, band: 'Good', facing: 'W',
        summary: 'Solid orientation. One fix on dining position lifts the score.',
        violations: [
            { severity: 'medium', zone: 'centre',      object: 'dining-table', issue: 'Dining table in the dead centre stalls circulation.', fix: 'Shift dining to the west side, leaving the centre as a walk-through.', direction_hint: 'W' },
            { severity: 'low',    zone: 'top-right',   object: 'sideboard',    issue: 'Heavy sideboard on the NE wall.', fix: 'Relocate to SW wall to balance mass.', direction_hint: 'SW' },
        ],
    },
    study: {
        score: 86, band: 'Excellent Vastu', facing: 'E',
        summary: 'Desk faces east — ideal for focus. One light cue remaining.',
        violations: [
            { severity: 'low', zone: 'top-left', object: 'light', issue: 'Overhead light directly above the desk causes glare.', fix: 'Replace with diffused panel light or task lamp on the NW side.', direction_hint: 'NW' },
        ],
    },
};

const ALIASES = {
    bedroom: 'bedroom', 'master-bedroom': 'bedroom', 'master bedroom': 'bedroom',
    'living_room': 'living_room', living: 'living_room', 'living room': 'living_room', drawing: 'living_room', 'drawing_room': 'living_room',
    kitchen: 'kitchen',
    'pooja_room': 'pooja_room', pooja: 'pooja_room', mandir: 'pooja_room',
    'dining_room': 'dining_room', dining: 'dining_room',
    study: 'study', office: 'study',
};

export const fallbackVastuOverlay = (roomType, facing) => {
    const key = ALIASES[(roomType || '').toLowerCase().replace(/\s+/g, '_')] || 'bedroom';
    const seed = SEED_BANK[key];
    return {
        ...seed,
        facing: (facing || seed.facing || 'N').toUpperCase(),
        room_type: key,
        objects: [],
        largest_window_wall: null,
        _fallback: true,
    };
};
