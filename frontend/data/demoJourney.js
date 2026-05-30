/**
 * Pre-fabricated buyer-journey state for the "Take the demo tour" path.
 *
 * The recorded demo video should NOT rely on live Cloudflare Workers AI
 * calls — first-call latency, rate limits, and network jitter all make a
 * scripted recording fragile. Instead, the user clicks "Take the demo tour"
 * on /design and the journey populates instantly with realistic room
 * results, Vastu HUD findings, and catalog bundles.
 *
 * All images are SVG data URIs generated inline. No stock photos, no
 * copyright risk, no external network dependency.
 */

const svgDataUri = (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

const BEFORE_LIVING = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bwall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E8E0D1"/><stop offset="1" stop-color="#C9BFAA"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="#F4EBDD"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="url(#bwall)"/>
  <rect x="245" y="100" width="110" height="140" fill="#FAF6EE" stroke="#A89878" stroke-width="2"/>
  <line x1="300" y1="100" x2="300" y2="240" stroke="#A89878"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="14" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">EMPTY · UNFURNISHED · 14 FT × 16 FT</text>
</svg>`);

const AFTER_LIVING = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="awall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F2EAD7"/><stop offset="1" stop-color="#D4C5A4"/>
    </linearGradient>
    <linearGradient id="afloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7A5E3C"/><stop offset="1" stop-color="#5C4429"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="#F4EBDD"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="url(#awall)"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="url(#afloor)"/>
  <rect x="245" y="90" width="110" height="140" fill="#FFF7E6" stroke="#9C8666" stroke-width="2"/>
  <line x1="300" y1="90" x2="300" y2="230" stroke="#9C8666"/>
  <rect x="105" y="100" width="50" height="80" fill="#3E5E3C" opacity="0.6"/>
  <rect x="445" y="100" width="50" height="80" fill="#3E5E3C" opacity="0.6"/>
  <rect x="130" y="240" width="240" height="55" rx="8" fill="#1D6172"/>
  <rect x="130" y="215" width="240" height="35" rx="6" fill="#23788C"/>
  <rect x="130" y="215" width="30" height="80" rx="6" fill="#1D6172"/>
  <rect x="340" y="215" width="30" height="80" rx="6" fill="#1D6172"/>
  <line x1="430" y1="295" x2="430" y2="180" stroke="#B8763D" stroke-width="3"/>
  <ellipse cx="430" cy="170" rx="28" ry="14" fill="#E8C896"/>
  <circle cx="430" cy="170" r="10" fill="#FFF1D6" opacity="0.7"/>
  <ellipse cx="250" cy="310" rx="170" ry="20" fill="#B8763D" opacity="0.3"/>
  <rect x="480" y="265" width="32" height="34" fill="#5C4429"/>
  <path d="M 496 265 Q 470 230 480 210 Q 510 230 500 265 Z" fill="#3E5E3C"/>
  <path d="M 496 265 Q 522 235 512 215 Q 488 235 496 265 Z" fill="#4A6E4A"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">CONTEMPORARY · 6 FURNITURE ITEMS · ₹1,84,500</text>
</svg>`);

const BEFORE_BEDROOM = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#E8E0D1"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#D4C5A4"/>
  <rect x="170" y="100" width="80" height="120" fill="#FAF6EE" stroke="#A89878" stroke-width="2"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="14" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">EMPTY MASTER BEDROOM · 12 FT × 14 FT</text>
</svg>`);

const AFTER_BEDROOM = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#F2EAD7"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#D4C5A4"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#6B5236"/>
  <rect x="170" y="90" width="80" height="130" fill="#FFF7E6" stroke="#9C8666" stroke-width="2"/>
  <rect x="280" y="180" width="220" height="120" rx="8" fill="#A8956C"/>
  <rect x="280" y="160" width="220" height="35" rx="6" fill="#8B7A55"/>
  <rect x="295" y="195" width="190" height="50" rx="4" fill="#FAF6EE"/>
  <rect x="295" y="195" width="190" height="20" rx="4" fill="#E8DEC5"/>
  <rect x="345" y="280" width="90" height="14" fill="#FAF6EE"/>
  <line x1="265" y1="320" x2="265" y2="240" stroke="#B8763D" stroke-width="2"/>
  <ellipse cx="265" cy="232" rx="18" ry="10" fill="#E8C896"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">CONTEMPORARY · KING BED + DRESSER · ₹1,42,000</text>
</svg>`);

const BEFORE_KITCHEN = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#E8E0D1"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#C9BFAA"/>
  <rect x="250" y="120" width="100" height="100" fill="#FAF6EE" stroke="#A89878" stroke-width="2"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="14" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">UNFINISHED KITCHEN · MODULAR-READY</text>
</svg>`);

const AFTER_KITCHEN = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#F2EAD7"/>
  <polygon points="80,40 520,40 555,350 45,350" fill="#D4C5A4"/>
  <polygon points="45,350 555,350 590,385 10,385" fill="#5C4429"/>
  <rect x="250" y="110" width="100" height="100" fill="#FFF7E6" stroke="#9C8666" stroke-width="2"/>
  <rect x="80" y="220" width="200" height="100" fill="#5C4429"/>
  <rect x="80" y="210" width="200" height="20" fill="#3E2C18"/>
  <rect x="100" y="240" width="30" height="60" fill="#8B7355" opacity="0.4"/>
  <rect x="140" y="240" width="30" height="60" fill="#8B7355" opacity="0.4"/>
  <rect x="180" y="240" width="30" height="60" fill="#8B7355" opacity="0.4"/>
  <rect x="220" y="240" width="50" height="60" fill="#8B7355" opacity="0.4"/>
  <rect x="320" y="220" width="200" height="100" fill="#5C4429"/>
  <rect x="320" y="210" width="200" height="20" fill="#3E2C18"/>
  <rect x="370" y="240" width="100" height="60" fill="#2C2C2C"/>
  <circle cx="395" cy="270" r="8" fill="#B8763D"/>
  <circle cx="425" cy="270" r="8" fill="#B8763D"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">MODULAR · BUILT-IN · ₹2,68,000</text>
</svg>`);

const BEFORE_POOJA = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#E8E0D1"/>
  <polygon points="150,40 450,40 480,350 120,350" fill="#C9BFAA"/>
  <polygon points="120,350 480,350 510,385 90,385" fill="#8B7B5E"/>
  <text x="300" y="375" text-anchor="middle" font-size="14" fill="#6B5E45" font-family="Inter, sans-serif" letter-spacing="3">COMPACT POOJA NICHE · NE CORNER</text>
</svg>`);

const AFTER_POOJA = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1F0F00"/>
  <polygon points="150,40 450,40 480,350 120,350" fill="#3A2010"/>
  <polygon points="120,350 480,350 510,385 90,385" fill="#1F1006"/>
  <rect x="220" y="120" width="160" height="200" fill="#6B3F1F"/>
  <polygon points="220,120 380,120 360,80 240,80" fill="#8B5530"/>
  <rect x="240" y="160" width="120" height="120" fill="#8B5530"/>
  <circle cx="270" cy="220" r="10" fill="#F4A53C"/>
  <circle cx="270" cy="220" r="4" fill="#FFE8B0"/>
  <circle cx="330" cy="220" r="10" fill="#F4A53C"/>
  <circle cx="330" cy="220" r="4" fill="#FFE8B0"/>
  <ellipse cx="300" cy="200" rx="35" ry="15" fill="#FFE8B0" opacity="0.4"/>
  <ellipse cx="270" cy="216" rx="6" ry="20" fill="#FFD060" opacity="0.7"/>
  <ellipse cx="330" cy="216" rx="6" ry="20" fill="#FFD060" opacity="0.7"/>
  <text x="300" y="375" text-anchor="middle" font-size="13" fill="#F4A53C" font-family="Inter, sans-serif" font-weight="700" letter-spacing="2">TRADITIONAL · MARBLE MANDIR · ₹38,500</text>
</svg>`);

const SAMPLE_CATALOG = {
    living_room: [
        { id: 'd1', productName: '3-seater contemporary sofa', brand: 'HomeLane', priceValue: 56000, priceCurrency: 'INR', imageUrl: null },
        { id: 'd2', productName: 'Brass tripod floor lamp',    brand: 'Pepperfry', priceValue: 8400,  priceCurrency: 'INR', imageUrl: null },
        { id: 'd3', productName: 'Solid teak coffee table',    brand: 'WoodenStreet', priceValue: 24500, priceCurrency: 'INR', imageUrl: null },
        { id: 'd4', productName: 'Wool + jute layered rug',    brand: 'IKEA', priceValue: 7600, priceCurrency: 'INR', imageUrl: null },
        { id: 'd5', productName: 'Abstract canvas, 36x48"',    brand: 'MiradorHome', priceValue: 12200, priceCurrency: 'INR', imageUrl: null },
        { id: 'd6', productName: 'Fiddle-leaf fig, planter',   brand: 'Pepperfry', priceValue: 3800, priceCurrency: 'INR', imageUrl: null },
    ],
    bedroom: [
        { id: 'd7',  productName: 'King storage bed',        brand: 'HomeLane', priceValue: 78000, priceCurrency: 'INR', imageUrl: null },
        { id: 'd8',  productName: 'Pair of bedside tables',  brand: 'WoodenStreet', priceValue: 18500, priceCurrency: 'INR', imageUrl: null },
        { id: 'd9',  productName: '6-drawer dresser',        brand: 'IKEA', priceValue: 24500, priceCurrency: 'INR', imageUrl: null },
        { id: 'd10', productName: 'Reading nook armchair',   brand: 'Pepperfry', priceValue: 14000, priceCurrency: 'INR', imageUrl: null },
        { id: 'd11', productName: 'Linen curtains, set of 4', brand: 'IKEA', priceValue: 4800, priceCurrency: 'INR', imageUrl: null },
        { id: 'd12', productName: 'Brass arc floor lamp',    brand: 'Pepperfry', priceValue: 9200, priceCurrency: 'INR', imageUrl: null },
    ],
    kitchen: [
        { id: 'd13', productName: 'Modular base + wall units (10ft)', brand: 'HomeLane', priceValue: 168000, priceCurrency: 'INR', imageUrl: null },
        { id: 'd14', productName: 'Quartz countertop, 28sq ft',       brand: 'HomeLane', priceValue: 42000, priceCurrency: 'INR', imageUrl: null },
        { id: 'd15', productName: 'Built-in hob + chimney',           brand: 'Godrej Interio', priceValue: 38500, priceCurrency: 'INR', imageUrl: null },
        { id: 'd16', productName: 'Under-cabinet LED lighting',       brand: 'IKEA', priceValue: 8500, priceCurrency: 'INR', imageUrl: null },
        { id: 'd17', productName: 'Breakfast counter + stools',       brand: 'WoodenStreet', priceValue: 22500, priceCurrency: 'INR', imageUrl: null },
        { id: 'd18', productName: 'Copper utensil set, 9 piece',      brand: 'MiradorHome', priceValue: 6800, priceCurrency: 'INR', imageUrl: null },
    ],
    pooja_room: [
        { id: 'd19', productName: 'Carved marble mandir, 30x18"', brand: 'MiradorHome', priceValue: 18500, priceCurrency: 'INR', imageUrl: null },
        { id: 'd20', productName: 'Brass diya set, pair',         brand: 'Pepperfry', priceValue: 2400, priceCurrency: 'INR', imageUrl: null },
        { id: 'd21', productName: 'Silk sitting rug',             brand: 'IKEA', priceValue: 3800, priceCurrency: 'INR', imageUrl: null },
        { id: 'd22', productName: 'Carved wooden panel, backwall', brand: 'WoodenStreet', priceValue: 8400, priceCurrency: 'INR', imageUrl: null },
        { id: 'd23', productName: 'Pendant light, warm 2700K',    brand: 'Pepperfry', priceValue: 5400, priceCurrency: 'INR', imageUrl: null },
    ],
};

const SAMPLE_VASTU_OVERLAY = {
    living_room: {
        score: 78,
        band: 'Good',
        facing: 'N',
        summary: 'Strong overall. Two minor placement fixes to bring this to excellent.',
        violations: [
            { severity: 'medium', zone: 'top-right', object: 'sofa', issue: 'TV unit on the south-east wall — competes with fire element.', fix: 'Move TV to the south wall; SE keeps fire (lamp) alone.', direction_hint: 'S' },
            { severity: 'low',    zone: 'bottom-right', object: 'plant', issue: 'Heavy planter in the centre slows energy circulation.', fix: 'Shift the planter to the SW corner; centre stays clear.', direction_hint: 'SW' },
        ],
    },
    bedroom: {
        score: 84,
        band: 'Good',
        facing: 'S',
        summary: 'Sleeping orientation is correct. One mirror placement needs covering at night.',
        violations: [
            { severity: 'high', zone: 'middle-left', object: 'mirror', issue: 'Dresser mirror reflects the bed — disrupts rest in Vastu.', fix: 'Cover the mirror after 10pm or angle the dresser 45° away from the bed.', direction_hint: 'W' },
            { severity: 'low',  zone: 'top-center',  object: 'window', issue: 'Window on the south wall — heat ingress.', fix: 'Layer black-out + sheer curtains to soften the south light.', direction_hint: 'N' },
        ],
    },
    kitchen: {
        score: 71,
        band: 'Good',
        facing: 'E',
        summary: 'Cooking direction is correct. Sink and stove placement need separation.',
        violations: [
            { severity: 'high',   zone: 'middle-left',  object: 'sink',  issue: 'Sink directly adjacent to the stove — water meets fire.', fix: 'Add at least 2 ft buffer between sink and stove; insert a chopping zone.', direction_hint: 'NE' },
            { severity: 'medium', zone: 'top-right',    object: 'storage', issue: 'Heavy storage cabinets on the NE wall block prana flow.', fix: 'Move heavy storage to the SW wall; keep NE light and open.', direction_hint: 'SW' },
            { severity: 'low',    zone: 'bottom-left',  object: 'window', issue: 'No exhaust window on the east wall.', fix: 'Add a small exhaust window or fan on the east wall.', direction_hint: 'E' },
        ],
    },
    pooja_room: {
        score: 92,
        band: 'Excellent Vastu',
        facing: 'NE',
        summary: 'Exemplary — the mandir is placed correctly in the NE zone with east-facing deities.',
        violations: [
            { severity: 'low', zone: 'bottom-right', object: 'storage', issue: 'Storage under the mandir collects clutter.', fix: 'Use the lower compartment for clean Pooja items only; nothing unrelated.', direction_hint: 'NE' },
        ],
    },
};

const calcBundle = (roomKey) => {
    const items = SAMPLE_CATALOG[roomKey] || [];
    const totalEstimate = items.reduce((s, it) => s + (it.priceValue || 0), 0);
    return { roomType: roomKey, style: 'contemporary', items, totalEstimate, currency: 'INR' };
};

export const DEMO_JOURNEY_PAYLOAD = {
    builderId: 'westwood-demo',
    builderName: 'Westwood Realty',
    style: 'contemporary',
    preferredBrands: ['IKEA', 'HomeLane', 'Pepperfry', 'WoodenStreet'],
    generatedAt: new Date().toISOString(),
    rooms: [
        {
            roomType: 'living_room', roomLabel: 'Living Room',
            beforeDataUrl: BEFORE_LIVING, afterDataUrl: AFTER_LIVING,
            vastuScore: 78, vastuBand: 'Good',
            vastuOverlay: SAMPLE_VASTU_OVERLAY.living_room,
            catalogBundle: calcBundle('living_room'),
        },
        {
            roomType: 'bedroom', roomLabel: 'Master Bedroom',
            beforeDataUrl: BEFORE_BEDROOM, afterDataUrl: AFTER_BEDROOM,
            vastuScore: 84, vastuBand: 'Good',
            vastuOverlay: SAMPLE_VASTU_OVERLAY.bedroom,
            catalogBundle: calcBundle('bedroom'),
        },
        {
            roomType: 'kitchen', roomLabel: 'Kitchen',
            beforeDataUrl: BEFORE_KITCHEN, afterDataUrl: AFTER_KITCHEN,
            vastuScore: 71, vastuBand: 'Good',
            vastuOverlay: SAMPLE_VASTU_OVERLAY.kitchen,
            catalogBundle: calcBundle('kitchen'),
        },
        {
            roomType: 'pooja_room', roomLabel: 'Pooja Room',
            beforeDataUrl: BEFORE_POOJA, afterDataUrl: AFTER_POOJA,
            vastuScore: 92, vastuBand: 'Excellent Vastu',
            vastuOverlay: SAMPLE_VASTU_OVERLAY.pooja_room,
            catalogBundle: calcBundle('pooja_room'),
        },
    ],
};
