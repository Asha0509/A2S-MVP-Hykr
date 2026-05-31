import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, CheckCircle2, Copy, Eye, Sparkles, Layers, Users, BarChart3,
    ArrowRight, ExternalLink, RefreshCw, Tag, Save, Calculator, IndianRupee,
} from 'lucide-react';
import SectionBackdrop from '../components/SectionBackdrop';
import DemandHeatmap from '../components/DemandHeatmap';

const STORAGE_KEY = 'a2s-builder-account';

// Brands the buyer flow can preferentially surface in catalog matches.
// Curated from the actual scraper pool (matches `brand` values in the DB).
const AVAILABLE_BRANDS = [
    'IKEA', 'HomeLane', 'Pepperfry', 'WoodenStreet', 'UrbanLadder',
    'Nilkamal', 'Godrej Interio', 'MiradorHome', 'Amazon', 'Flipkart',
];

const generateBuilderId = (name) => {
    const slug = String(name || 'builder')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24) || 'builder';
    const tail = Math.random().toString(36).slice(2, 8);
    return `${slug}-${tail}`;
};

const PROJECT_TYPES = [
    { value: 'apartment', label: 'Apartment Complex' },
    { value: 'villa', label: 'Villa / Plotted Project' },
    { value: 'mixed', label: 'Mixed-Use Township' },
    { value: 'office', label: 'Office / Commercial' },
];

// Honest empty state — populated by real engagement events once the embed is live.
// We deliberately do NOT seed fake numbers; investors inspect the network tab.
const KPI_SLOTS = [
    { label: 'Active homebuyers', icon: Users,     hint: 'Updates daily once your embed goes live' },
    { label: 'Style quizzes',     icon: Sparkles,  hint: 'Tracked per builder workspace' },
    { label: 'AI staging runs',   icon: Layers,    hint: 'Includes Vastu HUD analyses' },
    { label: 'Catalog impressions', icon: BarChart3, hint: 'Surface area across all rooms' },
];

const BuilderPortal = () => {
    const [account, setAccount] = useState(null);
    const [form, setForm] = useState({
        builderName: '',
        companyName: '',
        projectName: '',
        projectType: 'apartment',
        contactEmail: '',
    });
    const [copied, setCopied] = useState('');

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setAccount(JSON.parse(raw));
        } catch (_) {
            /* corrupt JSON — let user re-create */
        }
    }, []);

    const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleCreate = (e) => {
        e.preventDefault();
        const builderId = generateBuilderId(form.companyName || form.projectName || form.builderName);
        const next = {
            ...form,
            builderId,
            preferredBrands: ['IKEA', 'HomeLane', 'Pepperfry'], // sensible default
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setAccount(next);
    };

    const togglePreferredBrand = (brand) => {
        if (!account) return;
        const current = account.preferredBrands || [];
        const next = current.includes(brand)
            ? current.filter((b) => b !== brand)
            : [...current, brand];
        const updated = { ...account, preferredBrands: next };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setAccount(updated);
    };

    const handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        setAccount(null);
        setForm({
            builderName: '',
            companyName: '',
            projectName: '',
            projectType: 'apartment',
            contactEmail: '',
        });
    };

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-site.tld';
    const embedUrl = account ? `${origin}/?builderId=${account.builderId}#/` : '';
    const embedSnippet = account
        ? `<!-- A2S buyer experience for ${account.companyName} -->\n<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="900"\n  style="border:0; border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,0.08);"\n  loading="lazy"\n  allow="camera; clipboard-write"\n  title="Design your home with A2S"\n></iframe>`
        : '';

    const copyTo = (key, text) => {
        if (!navigator?.clipboard) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key);
            setTimeout(() => setCopied(''), 1800);
        });
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-main">
                <SectionBackdrop variant="dark" minHeight="50vh">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-14">
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase mb-5"
                            style={{ color: '#B8763D', background: 'rgba(184,118,61,0.15)', border: '1px solid rgba(184,118,61,0.35)', backdropFilter: 'blur(6px)' }}
                        >
                            <Building2 size={14} /> Builder workspace · 30-second setup
                        </div>
                        <h1 className="font-serif font-black italic leading-[1.05]" style={{ fontSize: 'clamp(2.25rem, 5vw, 4.5rem)', color: '#F4EBDD' }}>
                            Activate the <span style={{
                                background: 'linear-gradient(90deg, #B8763D 0%, #E8C896 50%, #B8763D 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite',
                            }}>AI design layer</span> on your project page.
                        </h1>
                        <p className="mt-5 text-sm sm:text-base max-w-2xl leading-relaxed" style={{ color: 'rgba(244,235,221,0.78)' }}>
                            Create a workspace, pick the brands you have deals with, drop the embed snippet on your project landing page.
                            Your buyers self-serve the design experience — and every catalog click is attributed back to your account.
                        </p>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { icon: Sparkles, title: 'Live the day you embed', body: 'No integration, no SSO, no DNS. Drop a snippet, your buyers are designing within the hour.' },
                                { icon: CheckCircle2, title: 'Vastu sells in India', body: 'Real-time Vastu compliance markers on every buyer\'s room photo — a category-defining differentiator.' },
                                { icon: Layers, title: 'Your brands, surfaced first', body: 'Pick the vendors you have bulk pricing with. Buyers see those SKUs first in every staged room.' },
                            ].map(({ icon: Icon, title, body }) => (
                                <div key={title} className="rounded-2xl p-4" style={{
                                    background: 'rgba(244,235,221,0.04)', border: '1px solid rgba(244,235,221,0.10)', backdropFilter: 'blur(8px)',
                                }}>
                                    <Icon size={20} style={{ color: '#B8763D' }} className="mb-2" />
                                    <p className="font-semibold" style={{ color: '#F4EBDD' }}>{title}</p>
                                    <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(244,235,221,0.6)' }}>{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <style>{`@keyframes a2s-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
                </SectionBackdrop>

                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16 relative" style={{ zIndex: 2 }}>

                    <form onSubmit={handleCreate} className="mt-10 rounded-2xl bg-surface border border-premium p-6 space-y-5">
                        <div>
                            <h2 className="font-serif text-2xl text-main font-black italic">Create your builder workspace</h2>
                            <p className="text-sm text-muted mt-1">Takes 30 seconds. No card required.</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-main mb-1">Your name *</label>
                                <input
                                    required
                                    value={form.builderName}
                                    onChange={handleChange('builderName')}
                                    placeholder="Asha Jyothi"
                                    className="w-full rounded-lg border border-premium bg-main px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-main mb-1">Company *</label>
                                <input
                                    required
                                    value={form.companyName}
                                    onChange={handleChange('companyName')}
                                    placeholder="e.g. Westwood Realty"
                                    className="w-full rounded-lg border border-premium bg-main px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-main mb-1">Project name *</label>
                                <input
                                    required
                                    value={form.projectName}
                                    onChange={handleChange('projectName')}
                                    placeholder="e.g. Westwood Heights, Tower B"
                                    className="w-full rounded-lg border border-premium bg-main px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-main mb-1">Project type</label>
                                <select
                                    value={form.projectType}
                                    onChange={handleChange('projectType')}
                                    className="w-full rounded-lg border border-premium bg-main px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                >
                                    {PROJECT_TYPES.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-main mb-1">Contact email *</label>
                                <input
                                    required
                                    type="email"
                                    value={form.contactEmail}
                                    onChange={handleChange('contactEmail')}
                                    placeholder="you@yourbuildergroup.com"
                                    className="w-full rounded-lg border border-premium bg-main px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold py-3 text-sm hover:opacity-90"
                        >
                            Create workspace & get embed code
                            <ArrowRight size={16} />
                        </button>
                        <p className="text-[11px] text-muted text-center">
                            By creating a workspace you accept the A2S Builder Terms. No payment until your first 100 buyers convert.
                        </p>
                    </form>
                </div>
            </div>
        );
    }

    // Authenticated builder dashboard
    return (
        <div className="min-h-screen bg-main">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] sm:text-xs font-semibold tracking-wide uppercase mb-3">
                            <Building2 size={14} />
                            Builder workspace
                        </div>
                        <h1 className="font-serif text-2xl sm:text-4xl text-main font-black italic break-words">
                            {account.companyName}
                        </h1>
                        <p className="text-muted mt-1">
                            {account.projectName} · ID <span className="font-mono text-main">{account.builderId}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main"
                    >
                        <RefreshCw size={13} /> Reset workspace
                    </button>
                </div>

                {/* KPI strip — empty state, populated by real engagement events */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {KPI_SLOTS.map(({ icon: Icon, label, hint }) => (
                        <div key={label} className="rounded-2xl bg-surface border border-premium p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Icon size={18} className="text-accent" />
                                <span className="text-[10px] text-muted uppercase tracking-wide">No data yet</span>
                            </div>
                            <p className="font-serif text-3xl font-black text-main">—</p>
                            <p className="text-xs text-muted">{label}</p>
                            <p className="text-[10px] text-muted/70 mt-1 leading-snug">{hint}</p>
                        </div>
                    ))}
                </div>
                <div className="rounded-xl bg-accent/5 border border-accent/20 px-4 py-3 -mt-4 text-xs text-muted">
                    <span className="text-accent font-semibold">Workspace just created.</span> Your dashboard fills in as buyers engage with your embed — no fake numbers shown.
                </div>

                {/* Demand heatmap — shows pre-existing 7,200 waitlist by city */}
                <DemandHeatmap totalSignups={7200} />

                {/* Embed block */}
                <div className="rounded-2xl bg-surface border border-premium p-6 space-y-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-serif text-2xl text-main font-black italic">Embed in your site</h2>
                            <p className="text-sm text-muted mt-1">
                                Drop this snippet on your project's landing page. Every buyer interaction (style quiz, AI
                                staging, Vastu scan, saved products) is automatically attributed to <span className="font-semibold text-main">{account.companyName}</span>.
                            </p>
                        </div>
                        <Link
                            to="/embed-demo"
                            target="_blank"
                            rel="noopener"
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-accent text-accent text-xs font-semibold px-3 py-2 hover:bg-accent/5 shrink-0"
                        >
                            <Eye size={13} /> Preview embed
                            <ExternalLink size={11} />
                        </Link>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Embed URL</label>
                            <button
                                onClick={() => copyTo('url', embedUrl)}
                                className="inline-flex items-center gap-1 text-xs text-accent hover:opacity-80"
                            >
                                {copied === 'url' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                                {copied === 'url' ? 'Copied' : 'Copy URL'}
                            </button>
                        </div>
                        <code className="block bg-main border border-premium rounded-lg px-3 py-2 text-xs font-mono text-main break-all">
                            {embedUrl}
                        </code>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide">HTML embed snippet</label>
                            <button
                                onClick={() => copyTo('html', embedSnippet)}
                                className="inline-flex items-center gap-1 text-xs text-accent hover:opacity-80"
                            >
                                {copied === 'html' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                                {copied === 'html' ? 'Copied' : 'Copy snippet'}
                            </button>
                        </div>
                        <pre className="bg-main border border-premium rounded-lg p-3 text-[11px] font-mono text-main overflow-x-auto leading-relaxed whitespace-pre">
{embedSnippet}
                        </pre>
                    </div>

                    <div className="sm:hidden">
                        <Link
                            to="/embed-demo"
                            target="_blank"
                            rel="noopener"
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent text-accent text-xs font-semibold px-3 py-2 hover:bg-accent/5"
                        >
                            <Eye size={13} /> Preview how this embeds on your site
                            <ExternalLink size={11} />
                        </Link>
                    </div>
                </div>

                {/* Preferred Brands curation — the real B2B differentiator */}
                <div className="rounded-2xl bg-surface border border-premium p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-2 mb-2">
                                <Tag size={16} className="text-accent" />
                                <h2 className="font-serif text-2xl text-main font-black italic">Curated catalog tiers</h2>
                            </div>
                            <p className="text-sm text-muted max-w-2xl">
                                Pick the brands you've negotiated bulk pricing with. Every buyer who designs their home
                                through your embed sees these brands surface first in their AI-staged renders and shopping
                                lists. Every conversion through these brands is attributed and commissioned back to you.
                            </p>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-accent/10 text-accent shrink-0">
                            <Save size={11} /> Auto-saved
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {AVAILABLE_BRANDS.map((brand) => {
                            const checked = (account.preferredBrands || []).includes(brand);
                            return (
                                <button
                                    key={brand}
                                    type="button"
                                    onClick={() => togglePreferredBrand(brand)}
                                    className={`text-left rounded-lg border px-3 py-2.5 text-xs font-semibold transition ${
                                        checked
                                            ? 'border-accent bg-accent/10 text-accent ring-1 ring-accent/30'
                                            : 'border-premium text-main hover:border-accent'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {checked ? <CheckCircle2 size={13} /> : <Tag size={13} className="opacity-40" />}
                                        {brand}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <p className="text-[11px] text-muted">
                        Selected: <span className="font-semibold text-main">{(account.preferredBrands || []).length} of {AVAILABLE_BRANDS.length} brands</span> —{' '}
                        leave empty to show buyers all available brands without preference.
                    </p>
                </div>

                <BuilderRoi />

                {/* Plan tile */}
                <div className="rounded-2xl bg-accent/5 border border-accent/30 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Current plan</p>
                        <p className="font-serif text-xl text-main font-black italic mt-0.5">Pilot · No charge during MVP</p>
                        <p className="text-xs text-muted mt-1">
                            Pricing will be set during pilot conversations. The product is open to builder feedback before commercial launch.
                        </p>
                    </div>
                    <Link
                        to="/design"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent text-accent font-semibold text-sm px-4 py-2 hover:bg-accent/10"
                    >
                        Try the buyer journey
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

// ── ROI calculator ──────────────────────────────────────────────────────────
// Concrete unit economics for the builder. Honest, conservative defaults:
//   - average buyer journey home cost: ₹6.5L (matches summary demo numbers)
//   - 12% commission on referred buyer purchases (industry-standard furniture)
//   - 38% of buyers who complete journey actually purchase via embed
//   - A2S keeps 25% of the commission as platform fee; builder keeps 75%
// Numbers are configurable so a builder can plug in their own conversion data.
const RoiInput = ({ label, value, onChange, prefix, min, max, step = 1 }) => (
    <label className="block">
        <span className="block text-[10px] uppercase tracking-wider text-muted font-bold mb-1">{label}</span>
        <div className="flex items-center gap-2 rounded-lg border border-premium bg-main px-3 py-2">
            {prefix && <span className="text-xs text-muted">{prefix}</span>}
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className="w-full bg-transparent text-sm text-main focus:outline-none"
            />
        </div>
    </label>
);

const BuilderRoi = () => {
    const [units, setUnits] = useState(200);
    const [embedViewsPct, setEmbedViewsPct] = useState(60);
    const [journeyComplPct, setJourneyComplPct] = useState(40);
    const [convertPct, setConvertPct] = useState(38);
    const [avgHome, setAvgHome] = useState(650000);
    const [commissionPct, setCommissionPct] = useState(12);
    const [builderShare] = useState(75);

    const viewers     = Math.round(units * embedViewsPct / 100);
    const completes   = Math.round(viewers * journeyComplPct / 100);
    const purchasers  = Math.round(completes * convertPct / 100);
    const gmv         = purchasers * avgHome;
    const commission  = Math.round(gmv * commissionPct / 100);
    const builderCut  = Math.round(commission * builderShare / 100);
    const fmt = (n) => `₹${(n / 100000).toFixed(2)}L`;
    const fmtRupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

    return (
        <div className="rounded-2xl bg-surface border border-premium p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-2 mb-2">
                        <Calculator size={16} className="text-accent" />
                        <h2 className="font-serif text-2xl text-main font-black italic">Project ROI calculator</h2>
                    </div>
                    <p className="text-sm text-muted max-w-2xl">
                        Plug in your project size and conversion assumptions. Numbers reflect industry-standard furniture commission (12%)
                        with a 75/25 builder/platform split. Live calculation, no API call.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <RoiInput label="Project units"        value={units}           onChange={setUnits}           min={1}   max={5000} />
                <RoiInput label="Embed view rate %"    value={embedViewsPct}   onChange={setEmbedViewsPct}   min={0}   max={100}  />
                <RoiInput label="Journey completion %" value={journeyComplPct} onChange={setJourneyComplPct} min={0}   max={100}  />
                <RoiInput label="Buy conversion %"     value={convertPct}      onChange={setConvertPct}      min={0}   max={100}  />
                <RoiInput label="Avg home spend"       value={avgHome}         onChange={setAvgHome}         min={50000} max={5000000} step={10000} prefix="₹" />
                <RoiInput label="Commission %"         value={commissionPct}   onChange={setCommissionPct}   min={0}   max={30}   />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl bg-main border border-premium p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Buyers engaged</p>
                    <p className="font-serif text-2xl text-main font-black mt-1">{viewers.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-muted">{embedViewsPct}% of {units}</p>
                </div>
                <div className="rounded-xl bg-main border border-premium p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Journeys completed</p>
                    <p className="font-serif text-2xl text-main font-black mt-1">{completes.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-muted">{journeyComplPct}% of viewers</p>
                </div>
                <div className="rounded-xl bg-main border border-premium p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Conversions</p>
                    <p className="font-serif text-2xl text-main font-black mt-1">{purchasers.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-muted">{convertPct}% of completers</p>
                </div>
                <div className="rounded-xl bg-accent/10 border border-accent/40 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-accent font-bold">Furniture GMV</p>
                    <p className="font-serif text-2xl text-accent font-black mt-1">{fmt(gmv)}</p>
                    <p className="text-[10px] text-muted">{purchasers} × {fmt(avgHome)}</p>
                </div>
            </div>

            <div className="rounded-xl bg-accent/5 border border-accent/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-accent">Builder's share (75% of commission)</p>
                    <p className="font-serif text-3xl sm:text-5xl text-main font-black italic leading-none mt-2 flex items-baseline gap-1">
                        <IndianRupee size={28} className="text-accent" />
                        <span>{(builderCut / 100000).toFixed(2)}L</span>
                    </p>
                </div>
                <div className="text-xs text-muted leading-relaxed sm:text-right">
                    <p>From <span className="text-main font-semibold">{fmt(commission)}</span> total commission on <span className="text-main font-semibold">{fmt(gmv)}</span> GMV.</p>
                    <p>Platform fee (25%): {fmt(commission - builderCut)} — covers AI compute, hosting, brand-API integrations.</p>
                    <p className="mt-1 text-main">Avg builder cut per unit: <span className="font-semibold text-accent">{fmtRupees(units > 0 ? builderCut / units : 0)}</span></p>
                </div>
            </div>
        </div>
    );
};

export default BuilderPortal;
