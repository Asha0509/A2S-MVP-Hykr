import React, { useRef, useState } from 'react';
import { Store, Upload, Check, Percent, Link2, Sparkles, X } from 'lucide-react';

/**
 * Catalog-source selector for the buyer journey.
 *
 * Two paths:
 *   1. Builder's curated catalog — buyer gets the builder-negotiated bulk
 *      discount; SKUs surface first in every staged room.
 *   2. Bring your own — connect Amazon / Pepperfry / Flipkart OR upload a
 *      furniture photo. A2S ingests it, filters it, and converts selected
 *      items into the 3D-staged scene.
 *
 * Pure-frontend demo: the connect buttons + upload dropzone capture intent
 * to localStorage; no real marketplace OAuth. Sells the "we build YOUR
 * catalog into the render" capability without the integration lift.
 *
 * Props:
 *   value     — 'builder' | 'byo'
 *   onChange  — (next) => void
 */

const MARKETPLACES = [
    { id: 'amazon',    label: 'Amazon',     color: '#FF9900' },
    { id: 'pepperfry', label: 'Pepperfry',  color: '#FB6100' },
    { id: 'flipkart',  label: 'Flipkart',   color: '#2874F0' },
];

const CatalogSourceChoice = ({ value = 'builder', onChange }) => {
    const fileRef = useRef(null);
    const [connected, setConnected] = useState([]);   // marketplace ids
    const [uploads, setUploads] = useState([]);        // {name, url}

    const toggleConnect = (id) => {
        setConnected((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);
        onChange && onChange('byo');
        try {
            const prior = JSON.parse(localStorage.getItem('a2s-catalog-source') || '{}');
            localStorage.setItem('a2s-catalog-source', JSON.stringify({ ...prior, mode: 'byo', connected: [...new Set([...(prior.connected || []), id])] }));
        } catch (_) {}
    };

    const handleFiles = (files) => {
        const added = Array.from(files).slice(0, 4).map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
        setUploads((u) => [...u, ...added].slice(0, 6));
        onChange && onChange('byo');
    };

    return (
        <div className="rounded-2xl bg-surface border border-premium p-5 space-y-4">
            <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-accent mb-1">Where should we source furniture?</p>
                <p className="text-sm text-muted">Pick a catalog source — you can change it per room later.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
                {/* Option 1 — Builder catalog */}
                <button
                    type="button"
                    onClick={() => onChange && onChange('builder')}
                    className="text-left rounded-2xl border p-4 transition relative"
                    style={{
                        borderColor: value === 'builder' ? 'var(--accent)' : 'var(--glass-border)',
                        background: value === 'builder' ? 'rgba(184,118,61,0.06)' : 'transparent',
                        boxShadow: value === 'builder' ? '0 0 0 2px rgba(184,118,61,0.25)' : 'none',
                    }}
                >
                    {value === 'builder' && <Check size={16} className="absolute top-3 right-3 text-accent" />}
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                        <Store size={20} className="text-accent" />
                    </div>
                    <p className="font-semibold text-main">Use the builder's catalog</p>
                    <p className="text-xs text-muted mt-1 leading-snug">
                        Curated brands your builder negotiated bulk pricing with.
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>
                        <Percent size={10} /> Up to 18% builder discount
                    </span>
                </button>

                {/* Option 2 — Bring your own */}
                <button
                    type="button"
                    onClick={() => onChange && onChange('byo')}
                    className="text-left rounded-2xl border p-4 transition relative"
                    style={{
                        borderColor: value === 'byo' ? 'var(--accent)' : 'var(--glass-border)',
                        background: value === 'byo' ? 'rgba(184,118,61,0.06)' : 'transparent',
                        boxShadow: value === 'byo' ? '0 0 0 2px rgba(184,118,61,0.25)' : 'none',
                    }}
                >
                    {value === 'byo' && <Check size={16} className="absolute top-3 right-3 text-accent" />}
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                        <Upload size={20} className="text-accent" />
                    </div>
                    <p className="font-semibold text-main">Bring your own furniture</p>
                    <p className="text-xs text-muted mt-1 leading-snug">
                        Connect a marketplace or upload pieces — we convert them to 3D and stage them in.
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: 'rgba(29,97,114,0.12)', color: 'var(--accent)' }}>
                        <Sparkles size={10} /> Auto-3D conversion
                    </span>
                </button>
            </div>

            {/* BYO expanded controls */}
            {value === 'byo' && (
                <div className="rounded-xl border border-premium bg-main p-4 space-y-4">
                    <div>
                        <p className="text-xs font-semibold text-main mb-2">Connect a marketplace</p>
                        <div className="flex flex-wrap gap-2">
                            {MARKETPLACES.map((m) => {
                                const on = connected.includes(m.id);
                                return (
                                    <button key={m.id} type="button" onClick={() => toggleConnect(m.id)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition"
                                            style={{
                                                borderColor: on ? m.color : 'var(--glass-border)',
                                                background: on ? `${m.color}1A` : 'transparent',
                                                color: on ? m.color : 'var(--text-main)',
                                            }}>
                                        <Link2 size={14} /> {m.label}
                                        {on && <Check size={13} />}
                                    </button>
                                );
                            })}
                        </div>
                        {connected.length > 0 && (
                            <p className="text-[11px] text-muted mt-2">
                                <span className="text-accent font-semibold">{connected.length} connected.</span> We'll import your wishlist + order history, filter for this room, and stage matching pieces.
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-main mb-2">Or upload your own pieces</p>
                        <div
                            onClick={() => fileRef.current?.click()}
                            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                            onDragOver={(e) => e.preventDefault()}
                            className="rounded-lg border-2 border-dashed border-accent/40 hover:border-accent transition cursor-pointer p-4 text-center"
                        >
                            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                                   onChange={(e) => handleFiles(e.target.files)} />
                            <Upload size={18} className="text-accent mx-auto mb-1.5" />
                            <p className="text-xs text-main font-medium">Drop furniture photos here</p>
                            <p className="text-[10px] text-muted mt-0.5">We auto-extract the object + convert to a 3D-stageable asset</p>
                        </div>
                        {uploads.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {uploads.map((u, i) => (
                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-premium">
                                        <img src={u.url} alt={u.name} className="w-full h-full object-cover" />
                                        <button type="button"
                                                onClick={() => setUploads((arr) => arr.filter((_, idx) => idx !== i))}
                                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center">
                                            <X size={9} />
                                        </button>
                                        <div className="absolute bottom-0 inset-x-0 text-[8px] text-center text-white py-0.5"
                                             style={{ background: 'rgba(29,97,114,0.85)' }}>
                                            3D ✓
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogSourceChoice;
