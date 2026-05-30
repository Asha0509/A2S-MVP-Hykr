const VENDOR_BASE_URLS = {
    'Pepperfry': 'https://www.pepperfry.com/',
    'Urban Ladder': 'https://www.urbanladder.com/',
    'IKEA': 'https://www.ikea.com/in/en/',
    'Asian Paints': 'https://www.asianpaints.com/',
    'Amazon India': 'https://www.amazon.in/',
    'Jaipur Rugs': 'https://www.jaipurtugs.com/',
    'Kapoor Lights': 'https://www.amazon.in/',
    'Wooden Street': 'https://www.woodenstreet.com/',
    'Fab India': 'https://www.fabindia.com/',
    'Sleek': 'https://www.sleekkitchens.com/',
    'Franke': 'https://www.franke.com/in/en/ks.html',
    'Philips': 'https://www.lighting.philips.co.in/',
};

const NORMALIZED_VENDOR_URLS = {
    pepperfry: 'https://www.pepperfry.com/',
    urbanladder: 'https://www.urbanladder.com/',
    ikea: 'https://www.ikea.com/in/en/',
    amazon: 'https://www.amazon.in/',
    amazonin: 'https://www.amazon.in/',
    flipkart: 'https://www.flipkart.com/',
    woodenstreet: 'https://www.woodenstreet.com/',
    fabindia: 'https://www.fabindia.com/',
};

function sanitizeUrl(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (!raw || raw === '#') return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('//')) return `https:${raw}`;
    return '';
}

function normalizeVendor(vendor) {
    if (!vendor) return '';
    return String(vendor).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getProductShopUrl(product) {
    const directUrl = sanitizeUrl(
        product.affiliateLink ||
        product.affiliate_link ||
        product.source_url ||
        product.sourceUrl ||
        product.description
    );

    if (directUrl) return directUrl;

    const vendor = product.vendor || '';
    const normalizedVendor = normalizeVendor(vendor);
    if (NORMALIZED_VENDOR_URLS[normalizedVendor]) {
        return NORMALIZED_VENDOR_URLS[normalizedVendor];
    }

    return VENDOR_BASE_URLS[vendor] || '#';
}

export function openProductInNewTab(product) {
    const url = getProductShopUrl(product);
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
}
