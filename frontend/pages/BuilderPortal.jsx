import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2, CheckCircle2, Copy, Eye, Sparkles, Layers, Users, BarChart3,
    ArrowRight, ExternalLink, RefreshCw,
} from 'lucide-react';

const STORAGE_KEY = 'a2s-builder-account';

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

const SAMPLE_KPIS = [
    { label: 'Active homebuyers', value: 248, icon: Users, hint: 'Last 30 days' },
    { label: 'Style quizzes',     value: 412, icon: Sparkles, hint: '+18% week-over-week' },
    { label: 'AI staging runs',   value:  87, icon: Layers, hint: '6.4 min avg session' },
    { label: 'Catalog impressions', value: '14.2k', icon: BarChart3, hint: 'Across 1,230 SKUs' },
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
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setAccount(next);
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
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide uppercase mb-3">
                        <Building2 size={14} />
                        For Builders & Developers
                    </div>
                    <h1 className="font-serif text-4xl sm:text-5xl text-main leading-tight font-black italic">
                        Give every homebuyer an <span className="text-accent">AI interior designer</span>.
                    </h1>
                    <p className="mt-4 text-muted max-w-2xl">
                        Embed A2S in your project's landing page. Your buyers upload their unit's layout, get AI-staged
                        renders, run Vastu compliance scans, and walk away with a furnished home — all on your domain,
                        all under your brand.
                    </p>

                    <div className="mt-8 grid sm:grid-cols-3 gap-3">
                        {[
                            { icon: Sparkles, title: 'AI staging', body: 'Empty-room photo → magazine-cover render in 8 seconds.' },
                            { icon: CheckCircle2, title: 'Vastu Score', body: '100-point room compliance audit with one-click fixes.' },
                            { icon: Layers, title: 'Curated catalog', body: '1,230 SKUs from IKEA, Pepperfry, HomeLane and more.' },
                        ].map(({ icon: Icon, title, body }) => (
                            <div key={title} className="rounded-2xl bg-surface border border-premium p-4">
                                <Icon size={20} className="text-accent mb-2" />
                                <p className="font-semibold text-main">{title}</p>
                                <p className="text-xs text-muted mt-1 leading-snug">{body}</p>
                            </div>
                        ))}
                    </div>

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
                                    placeholder="Lodha Group"
                                    className="w-full rounded-lg border border-premium bg-main px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-main mb-1">Project name *</label>
                                <input
                                    required
                                    value={form.projectName}
                                    onChange={handleChange('projectName')}
                                    placeholder="Lodha Greens, Wing C"
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
                                    placeholder="asha@lodhagroup.com"
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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide uppercase mb-3">
                            <Building2 size={14} />
                            Builder workspace
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl text-main font-black italic">
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

                {/* KPI strip */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {SAMPLE_KPIS.map(({ icon: Icon, label, value, hint }) => (
                        <div key={label} className="rounded-2xl bg-surface border border-premium p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Icon size={18} className="text-accent" />
                                <span className="text-[10px] text-muted uppercase tracking-wide">{hint}</span>
                            </div>
                            <p className="font-serif text-3xl font-black text-main">{value}</p>
                            <p className="text-xs text-muted">{label}</p>
                        </div>
                    ))}
                </div>

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

                {/* Plan tile */}
                <div className="rounded-2xl bg-accent/5 border border-accent/30 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Current plan</p>
                        <p className="font-serif text-xl text-main font-black italic mt-0.5">HyKr Launch · Free</p>
                        <p className="text-xs text-muted mt-1">
                            First 100 buyer conversions are free. ₹2,500/conversion thereafter. Transparent, per-unit.
                        </p>
                    </div>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent text-accent font-semibold text-sm px-4 py-2 hover:bg-accent/10"
                    >
                        Open buyer view (you = test buyer)
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BuilderPortal;
