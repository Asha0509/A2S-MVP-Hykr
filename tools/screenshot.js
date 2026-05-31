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
                        await page.goto(`${baseUrl}/#/design`, { waitUntil: 'domcontentloaded', timeout: 30000 });
                        await page.evaluate(async () => {
                            const mod = await import('/data/demoJourney.js').catch(() => null);
                            if (mod && mod.DEMO_JOURNEY_PAYLOAD) {
                                sessionStorage.setItem('a2s-design-journey', JSON.stringify(mod.DEMO_JOURNEY_PAYLOAD));
                            }
                        }).catch(() => {});
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
