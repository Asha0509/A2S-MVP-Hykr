

export const INITIAL_FILTER_STATE = {
    minPrice: 0,
    maxPrice: 200000,
    styles: [],
    roomTypes: [],
    productRoomTypes: []
};

// Maps each gallery "Item Type" chip to the raw category strings the scrapers
// produce. Keeps the curated label in the UI while matching the underlying
// data vocabulary. Match is case-insensitive contains.
export const FURNITURE_CATEGORY_GROUPS = {
    'Sofa':           ['sofa', 'loveseat', 'couch'],
    'Bed':            ['bed frame', 'bed', 'mattress'],
    'Dining':         ['dining chair', 'dining table', 'dining set', 'dining'],
    'Tables':         ['coffee table', 'side table', 'console table', 'table'],
    'Storage':        ['storage', 'wardrobe', 'chest of drawers', 'cabinet', 'shelf'],
    'Lighting':       ['lighting', 'floor lamp', 'table lamp', 'pendant', 'lamp'],
    'Decor':          ['decor', 'wall art', 'vase', 'picture frame', 'mirror'],
    'Kitchen':        ['kitchen accessory', 'appliance', 'cookware'],
    'Outdoor':        ['outdoor', 'balcony', 'garden'],
    'Rug & Textile':  ['rug', 'textile', 'curtain', 'cushion'],
};

export const matchesItemTypeGroup = (productCategory, groupLabel) => {
    const cat = String(productCategory || '').toLowerCase();
    const aliases = FURNITURE_CATEGORY_GROUPS[groupLabel] || [];
    return aliases.some(alias => cat.includes(alias));
};
