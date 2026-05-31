/**
 * Hardcoded — but JUMBLED — Vastu fallback.
 *
 * When /api/vastu/overlay is unreachable/slow/404, the frontend substitutes
 * a realistic analysis from here so the demo never shows "reasoning not
 * available". Crucially the output VARIES per call: a seeded PRNG picks a
 * subset of violations from a per-room pool, jitters the score + category
 * scores, and rotates the summary line — so repeated runs (or different
 * rooms) never look canned.
 *
 * Vocabulary (categories, risk language, remedies framing) is lifted from
 * the original A2S Vastu audit engine.
 */

// ---- seeded PRNG (mulberry32) ----
const hashStr = (s) => {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
};
const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ZONES = ['top-left', 'top-center', 'top-right', 'middle-left', 'centre', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];

// Per-room VIOLATION POOLS — the generator samples a subset each run.
const POOLS = {
    bedroom: {
        baseScore: 78,
        cats: { Entry: 82, Furniture: 70, Light: 80, Elements: 78, Decor: 84 },
        summaries: [
            'Sleeping orientation reads well; a couple of placement fixes lift this to excellent.',
            'Solid foundation — the bed axis is right. Two corrections remain on light and storage.',
            'Restful overall. The mirror and window treatment are the main pending items.',
        ],
        pool: [
            { severity: 'high',   zone: 'middle-left',  object: 'mirror',   issue: 'Mirror reflects the bed — disrupts rest in Vastu.', fix: 'Cover the mirror after 10pm or angle the dresser 45° away from the bed.', direction_hint: 'W' },
            { severity: 'medium', zone: 'top-center',   object: 'window',   issue: 'Large south window drives heat + restless sleep.', fix: 'Layer black-out + sheer curtains on the south window.', direction_hint: 'N' },
            { severity: 'low',    zone: 'bottom-right', object: 'wardrobe',  issue: 'Heavy wardrobe in the NE corner blocks prana flow.', fix: 'Relocate to the SW corner; keep NE light and open.', direction_hint: 'SW' },
            { severity: 'medium', zone: 'top-right',    object: 'bed',       issue: 'Headboard not flush to a solid wall — weak support.', fix: 'Push the headboard flush against the south wall.', direction_hint: 'S' },
            { severity: 'low',    zone: 'centre',       object: 'rug',       issue: 'Dark rug in the centre dampens the room\'s energy core.', fix: 'Swap for a lighter tone or shift it under the bed.', direction_hint: 'NE' },
            { severity: 'low',    zone: 'middle-right', object: 'lamp',      issue: 'Single harsh overhead, no layered light.', fix: 'Add two bedside lamps for warm, even light.', direction_hint: 'SE' },
        ],
    },
    living_room: {
        baseScore: 82,
        cats: { Entry: 88, Furniture: 80, Light: 85, Elements: 76, Decor: 82 },
        summaries: [
            'Strong entry and centre. One TV-placement fix unlocks excellent.',
            'Well-balanced seating and light; the element mix needs a small nudge.',
            'Reads open and welcoming — refine the SE fire zone and the planter position.',
        ],
        pool: [
            { severity: 'medium', zone: 'top-right',    object: 'tv',     issue: 'TV unit on the SE wall competes with the fire element.', fix: 'Move the TV to the south wall; SE keeps the lamp alone.', direction_hint: 'S' },
            { severity: 'low',    zone: 'bottom-right', object: 'plant',  issue: 'Heavy planter near the centre slows circulation.', fix: 'Shift the planter to the SW corner; keep the centre clear.', direction_hint: 'SW' },
            { severity: 'medium', zone: 'middle-left',  object: 'sofa',   issue: 'Main sofa floats away from a supporting wall.', fix: 'Back the 3-seater against the south wall plane.', direction_hint: 'S' },
            { severity: 'low',    zone: 'top-left',     object: 'art',    issue: 'Dark artwork dominates the north (Kubera) wall.', fix: 'Use lighter, water-toned art on the north wall.', direction_hint: 'N' },
            { severity: 'low',    zone: 'centre',       object: 'table',  issue: 'Sharp-cornered coffee table on the main path.', fix: 'Round-edged or oval table improves flow + safety.', direction_hint: 'NE' },
        ],
    },
    kitchen: {
        baseScore: 71,
        cats: { Entry: 72, Furniture: 68, Light: 74, Elements: 64, Decor: 78 },
        summaries: [
            'Cooking direction is correct. Sink and stove separation is the key fix.',
            'Functional core; the water-fire balance needs the most attention here.',
            'Good light. Prioritise the sink-stove buffer and NE de-cluttering.',
        ],
        pool: [
            { severity: 'high',   zone: 'middle-left',  object: 'sink',    issue: 'Sink directly adjacent to the stove — water meets fire.', fix: 'Add a 2ft chopping-zone buffer between sink and stove.', direction_hint: 'NE' },
            { severity: 'medium', zone: 'top-right',    object: 'storage', issue: 'Heavy cabinets on the NE wall block prana flow.', fix: 'Move heavy storage to the SW wall; keep NE open.', direction_hint: 'SW' },
            { severity: 'low',    zone: 'bottom-left',  object: 'window',  issue: 'No exhaust window on the east wall.', fix: 'Add a small exhaust window or fan on the east wall.', direction_hint: 'E' },
            { severity: 'medium', zone: 'top-center',   object: 'fridge',  issue: 'Fridge in the SE crowds the fire zone.', fix: 'Relocate the fridge to the NW or SW.', direction_hint: 'NW' },
            { severity: 'low',    zone: 'centre',       object: 'dustbin', issue: 'Bin in an open/visible central spot.', fix: 'Tuck the bin into a covered under-counter pull-out.', direction_hint: 'S' },
        ],
    },
    pooja_room: {
        baseScore: 92,
        cats: { Entry: 95, Furniture: 90, Light: 92, Elements: 94, Decor: 88 },
        summaries: [
            'Exemplary — mandir in the NE, deities facing east. Near-perfect.',
            'Textbook placement. Only a minor storage-clutter note remains.',
            'Sacred zone is beautifully aligned; keep the lower compartment pure.',
        ],
        pool: [
            { severity: 'low',    zone: 'bottom-right', object: 'storage', issue: 'Storage under the mandir collects clutter.', fix: 'Use the lower compartment for clean pooja items only.', direction_hint: 'NE' },
            { severity: 'low',    zone: 'top-left',     object: 'idol',    issue: 'One idol faces away from the worshipper.', fix: 'Turn all deities to face east or west, toward the seat.', direction_hint: 'E' },
            { severity: 'medium', zone: 'middle-right', object: 'lamp',    issue: 'Diya placed on the north side, away from fire zone.', fix: 'Shift the lamp to the SE side of the mandir.', direction_hint: 'SE' },
        ],
    },
    dining_room: {
        baseScore: 75,
        cats: { Entry: 78, Furniture: 72, Light: 76, Elements: 70, Decor: 80 },
        summaries: [
            'Solid orientation. Centring the table is the main move.',
            'Comfortable layout; the sideboard mass needs rebalancing.',
        ],
        pool: [
            { severity: 'medium', zone: 'centre',     object: 'dining-table', issue: 'Dining table in the dead centre stalls circulation.', fix: 'Shift dining to the west, leaving the centre as a walk-through.', direction_hint: 'W' },
            { severity: 'low',    zone: 'top-right',  object: 'sideboard',    issue: 'Heavy sideboard on the NE wall.', fix: 'Relocate to the SW wall to balance the mass.', direction_hint: 'SW' },
            { severity: 'low',    zone: 'top-left',   object: 'mirror',       issue: 'No mirror reflecting the table (misses abundance cue).', fix: 'Add a mirror on the north wall reflecting the dining table.', direction_hint: 'N' },
        ],
    },
    study: {
        baseScore: 86,
        cats: { Entry: 86, Furniture: 88, Light: 82, Elements: 84, Decor: 90 },
        summaries: [
            'Desk faces east — ideal for focus. One light cue to refine.',
            'Strong study setup; just balance the glare and shelf mass.',
        ],
        pool: [
            { severity: 'low',    zone: 'top-left',     object: 'light', issue: 'Overhead light directly above the desk causes glare.', fix: 'Use a diffused panel or an NW-side task lamp.', direction_hint: 'NW' },
            { severity: 'medium', zone: 'middle-right', object: 'desk',  issue: 'Desk faces a blank wall, back to the door.', fix: 'Turn the desk so you face east with the door in view.', direction_hint: 'E' },
            { severity: 'low',    zone: 'bottom-left',  object: 'shelf', issue: 'Open shelf clutter on the NE wall.', fix: 'Move heavy books to the SW; keep NE light.', direction_hint: 'SW' },
        ],
    },
};

const ALIASES = {
    bedroom: 'bedroom', 'master-bedroom': 'bedroom', 'master bedroom': 'bedroom',
    living_room: 'living_room', living: 'living_room', 'living room': 'living_room', drawing: 'living_room', drawing_room: 'living_room',
    kitchen: 'kitchen',
    pooja_room: 'pooja_room', pooja: 'pooja_room', mandir: 'pooja_room',
    dining_room: 'dining_room', dining: 'dining_room',
    study: 'study', office: 'study',
};

const bandFor = (s) => (s < 50 ? 'Poor' : s < 70 ? 'Needs Work' : s < 85 ? 'Good' : 'Excellent Vastu');

/**
 * @param roomType  room key/label
 * @param facing    cardinal direction
 * @param salt       optional — pass a changing value (e.g. Date.now()) for a
 *                   fresh varied result each call; omit for stable-per-room.
 */
export const fallbackVastuOverlay = (roomType, facing, salt = '') => {
    const key = ALIASES[(roomType || '').toLowerCase().replace(/\s+/g, '_')] || 'bedroom';
    const p = POOLS[key];
    const rnd = mulberry32(hashStr(`${key}|${facing || 'N'}|${salt}`));

    // Pick 2-4 violations from the pool, shuffled.
    const pool = [...p.pool];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const n = key === 'pooja_room' ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 3);
    const violations = pool.slice(0, Math.min(n, pool.length));

    // Jitter the score ±6 around the base, clamp 0-100.
    const score = Math.max(0, Math.min(100, p.baseScore + Math.round((rnd() - 0.5) * 12)));

    // Jitter each category ±5.
    const category_scores = {};
    Object.entries(p.cats).forEach(([c, v]) => {
        category_scores[c] = Math.max(0, Math.min(100, v + Math.round((rnd() - 0.5) * 10)));
    });

    const summary = p.summaries[Math.floor(rnd() * p.summaries.length)];

    return {
        score,
        band: bandFor(score),
        summary,
        violations,
        category_scores,
        facing: (facing || 'N').toUpperCase(),
        room_type: key,
        objects: [],
        largest_window_wall: null,
        _fallback: true,
    };
};
