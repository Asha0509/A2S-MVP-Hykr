// Headless screenshot tool. Usage: node tools/screenshot.js <baseUrl> <outDir>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PAGES = [
    { route: '#/',              file: 'home.png',              wait: 1500 },
    { route: '#/builder',       file: 'builder-signup.png',    wait: 1200 },
    { route: '#/embed-demo',    file: 'embed-demo.png',        wait: 2000 },
    { route: '#/design',        file: 'design-step1.png',      wait: 1200 },
    { route: '#/design/summary',file: 'design-summary.png',    wait: 1500, seedDemo: true },
    { route: '#/vastu-hud',     file: 'vastu-hud.png',         wait: 1200 },
    { route: '#/showcase',      file: 'showcase.png',          wait: 2000 },
    { route: '#/pricing',       file: 'pricing.png',           wait: 1200 },
    { route: '#/methodology',   file: 'methodology.png',       wait: 1200 },
    { route: '#/about',         file: 'about.png',             wait: 1200 },
];

const VIEWPORTS = [
    { name: 'desktop', width: 1440, height: 900 },
];

(async () => {
    const baseUrl = process.argv[2] || 'http://localhost:8000';
    const outDir = process.argv[3] || path.resolve(__dirname, 'screenshots');
    fs.mkdirSync(outDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    try {
        for (const vp of VIEWPORTS) {
            const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
            const page = await ctx.newPage();
            page.on('pageerror', (err) => console.warn(`[${vp.name}] pageerror:`, err.message));
            page.on('console', (msg) => {
                if (msg.type() === 'error') console.warn(`[${vp.name}] console.error:`, msg.text().slice(0, 200));
            });

            for (const spec of PAGES) {
                const url = `${baseUrl}/${spec.route}`;
                process.stdout.write(`[${vp.name}] ${spec.file.padEnd(28)} ${url} … `);
                try {
                    if (spec.seedDemo) {
                        await page.goto(`${baseUrl}/#/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
                        // Inline the demo payload directly — production build bundles
                        // source modules so a dynamic import of /data/demoJourney.js 404s.
                        await page.evaluate(() => {
                            const payload = {
                                builderId: 'westwood-demo',
                                builderName: 'Westwood Realty',
                                style: 'contemporary',
                                preferredBrands: ['IKEA', 'HomeLane', 'Pepperfry', 'WoodenStreet'],
                                generatedAt: new Date().toISOString(),
                                rooms: [
                                    { roomType: 'living_room', roomLabel: 'Living Room', beforeDataUrl: '/showcase/empty-living.jpg', afterDataUrl: '/showcase/living-modern.jpg', vastuScore: 78, vastuBand: 'Good',
                                      vastuOverlay: { score: 78, band: 'Good', facing: 'N', summary: 'Strong overall.', violations: [{ severity: 'medium', zone: 'top-right', object: 'tv', issue: 'TV unit on south-east wall.', fix: 'Move TV to south wall.', direction_hint: 'S' }] },
                                      catalogBundle: { items: [{ id: 'd1', name: '3-seater sofa', brand: 'HomeLane', price: 56000, imageUrl: null }, { id: 'd2', name: 'Brass floor lamp', brand: 'Pepperfry', price: 8400, imageUrl: null }, { id: 'd3', name: 'Teak coffee table', brand: 'WoodenStreet', price: 24500, imageUrl: null }], totalEstimate: 184500 } },
                                    { roomType: 'bedroom', roomLabel: 'Master Bedroom', beforeDataUrl: '/showcase/empty-bedroom.jpg', afterDataUrl: '/showcase/bedroom-contemporary.jpg', vastuScore: 84, vastuBand: 'Good',
                                      catalogBundle: { items: [{ id: 'd7', name: 'King storage bed', brand: 'HomeLane', price: 78000, imageUrl: null }, { id: 'd8', name: 'Pair of bedsides', brand: 'WoodenStreet', price: 18500, imageUrl: null }], totalEstimate: 142000 } },
                                    { roomType: 'kitchen', roomLabel: 'Kitchen', beforeDataUrl: '/showcase/empty-kitchen.jpg', afterDataUrl: '/showcase/kitchen-functional.jpg', vastuScore: 71, vastuBand: 'Good',
                                      catalogBundle: { items: [{ id: 'd13', name: 'Modular kitchen 10ft', brand: 'HomeLane', price: 168000, imageUrl: null }], totalEstimate: 268000 } },
                                    { roomType: 'pooja_room', roomLabel: 'Pooja Room', beforeDataUrl: '/showcase/empty-pooja.jpg', afterDataUrl: '/showcase/pooja-classic.jpg', vastuScore: 92, vastuBand: 'Excellent Vastu',
                                      catalogBundle: { items: [{ id: 'd19', name: 'Marble mandir', brand: 'MiradorHome', price: 18500, imageUrl: null }], totalEstimate: 38500 } },
                                ],
                            };
                            sessionStorage.setItem('a2s-design-journey', JSON.stringify(payload));
                        });
                    }
                    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
                    await page.waitForTimeout(spec.wait || 1000);
                    const outPath = path.join(outDir, `${vp.name}-${spec.file}`);
                    await page.screenshot({ path: outPath, fullPage: true });
                    process.stdout.write(`OK (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)\n`);
                } catch (err) {
                    process.stdout.write(`FAIL: ${err.message.slice(0, 100)}\n`);
                }
            }

            await ctx.close();
        }
    } finally {
        await browser.close();
    }
})();
