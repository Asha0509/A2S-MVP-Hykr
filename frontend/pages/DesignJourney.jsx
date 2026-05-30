import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2, Circle, Upload, Sparkles, ArrowRight, RefreshCw, AlertTriangle,
    Home, BedDouble, UtensilsCrossed, Flame, ChevronLeft, Award, Layers,
} from 'lucide-react';
import { stageRoom, getSampleBundle, analyseVastuScore } from '../services/api';

const SESSION_KEY = 'a2s-design-journey';
const BUILDER_KEY = 'a2s-builder-account';
const ATTRIBUTED_KEY = 'a2s-attributed-builder';

const ROOMS = [
    { key: 'living_room', label: 'Living Room',  vastuRoom: 'Living Room', icon: Home, blurb: 'The room your guests judge you on.' },
    { key: 'bedroom',     label: 'Master Bedroom', vastuRoom: 'Bedroom',     icon: BedDouble, blurb: 'Where the day actually ends.' },
    { key: 'kitchen',     label: 'Kitchen',      vastuRoom: 'Kitchen',     icon: UtensilsCrossed, blurb: 'The cooking-zone Vastu cares about most.' },
    { key: 'pooja_room',  label: 'Pooja Room',   vastuRoom: 'Pooja Room',  icon: Flame, blurb: 'Compulsory in most Indian homes.' },
];

const STYLES = [
    { value: 'modern',       label: 'Modern',       blurb: 'Teak + neutrals. Clean lines. Statement pendant.' },
    { value: 'minimal',      label: 'Minimal',      blurb: 'Japandi: light wood, linen, near-zero clutter.' },
    { value: 'contemporary', label: 'Contemporary', blurb: 'Warm beige, curved shapes, brass accents.' },
    { value: 'classic',      label: 'Classic',      blurb: 'Dark carved wood, jewel tones, chandelier.' },
    { value: 'ethnic',       label: 'Ethnic',       blurb: 'Block-print textiles, brass, terracotta.' },
    { value: 'functional',   label: 'Functional',   blurb: 'Scandinavian: modular, light wood, accent.' },
];

const vastuBand = (score) => {
    if (score == null) return { label: '—', color: '#9CA3AF' };
    if (score < 50) return { label: 'Poor', color: '#dc2626' };
    if (score < 70) return { label: 'Needs Work', color: '#f59e0b' };
    if (score < 85) return { label: 'Good', color: '#16a34a' };
    return { label: 'Excellent Vastu', color: '#B8763D' };
};

const blobUrlFromDataUrl = (dataUrl) => dataUrl; // already-encoded; <img> handles it

const DesignJourney = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('rooms'); // rooms | style | design | wrapUp
    const [selectedRooms, setSelectedRooms] = useState(['living_room', 'bedroom', 'kitchen', 'pooja_room']);
    const [style, setStyle] = useState('modern');
    const [rooms, setRooms] = useState([]);     // accumulated results
    const [currentIdx, setCurrentIdx] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | staging | scoring | bundling | done | error
    const [error, setError] = useState(null);

    const builderName = useMemo(() => {
        // Prefer the builder workspace this browser created; fall back to the
        // attributed builder id from ?builderId in the URL.
        try {
            const raw = localStorage.getItem(BUILDER_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.companyName) return parsed.companyName;
            }
        } catch (_) {}
        const attributed = localStorage.getItem(ATTRIBUTED_KEY) || '';
        if (attributed) {
            return attributed.split('-').slice(0, -1).join(' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Your Builder';
        }
        return null;
    }, []);

    const builderBrands = useMemo(() => {
        try {
            const raw = localStorage.getItem(BUILDER_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed?.preferredBrands) ? parsed.preferredBrands : [];
            }
        } catch (_) {}
        return [];
    }, []);

    const orderedRooms = useMemo(() => ROOMS.filter((r) => selectedRooms.includes(r.key)), [selectedRooms]);
    const currentRoom = orderedRooms[currentIdx];

    const handlePickRoom = (key) => {
        setSelectedRooms((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please upload a JPG, PNG or WebP image.');
            return;
        }
        setError(null);
        setUploadedFile(file);
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
    };

    const handleStartDesign = () => {
        if (!selectedRooms.length) {
            setError('Pick at least one room to design.');
            return;
        }
        setError(null);
        setStep('style');
    };

    const handleConfirmStyle = () => {
        setStep('design');
        setCurrentIdx(0);
        setRooms([]);
    };

    const runStagingForCurrentRoom = async () => {
        if (!uploadedFile || !currentRoom) {
            setError('Upload a room photo first.');
            return;
        }
        setError(null);
        setStatus('staging');

        try {
            const staged = await stageRoom({
                image: uploadedFile,
                style,
                roomType: currentRoom.key,
                hint: `Indian ${currentRoom.label.toLowerCase()}, ${style} style`,
            });

            setStatus('scoring');
            let vastuScore = null;
            let vastuBandLabel = null;
            try {
                const vForm = new FormData();
                vForm.append('room_type', currentRoom.vastuRoom);
                vForm.append('facing_direction', 'Auto detect');
                vForm.append('floor', 'Ground');
                vForm.append('images', uploadedFile, uploadedFile.name);
                const vastu = await analyseVastuScore(vForm);
                if (vastu && typeof vastu.score === 'number') {
                    vastuScore = Math.round(vastu.score);
                    vastuBandLabel = vastuBand(vastuScore).label;
                }
            } catch (_) {
                // Vastu is non-blocking — fall through with score=null
            }

            setStatus('bundling');
            const catalogBundle = await getSampleBundle({
                roomType: currentRoom.key,
                style,
                brands: builderBrands,
                limit: 6,
            });

            const stagedDataUrl = `data:${staged.image_mime || 'image/png'};base64,${staged.image_base64}`;
            const beforeDataUrl = await fileToDataUrl(uploadedFile);

            const roomResult = {
                roomType: currentRoom.key,
                roomLabel: currentRoom.label,
                beforeDataUrl,
                afterDataUrl: stagedDataUrl,
                vastuScore,
                vastuBand: vastuBandLabel,
                catalogBundle,
            };
            const updatedRooms = [...rooms, roomResult];
            setRooms(updatedRooms);

            // Persist progress to sessionStorage after every room so a refresh recovers
            persistJourney({ updatedRooms });

            setStatus('done');
        } catch (err) {
            console.error('[journey] staging failed', err);
            setError(err?.error || 'AI staging failed for this room. Try a different photo.');
            setStatus('error');
        }
    };

    const persistJourney = ({ updatedRooms }) => {
        const payload = {
            builderId: localStorage.getItem(ATTRIBUTED_KEY) || (() => {
                try { return JSON.parse(localStorage.getItem(BUILDER_KEY) || '{}')?.builderId || null; } catch (_) { return null; }
            })(),
            builderName,
            style,
            rooms: updatedRooms,
            preferredBrands: builderBrands,
            generatedAt: new Date().toISOString(),
        };
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
        } catch (e) {
            // Quota — most likely the base64 images are too big. Strip beforeDataUrl
            // (we only need afterDataUrl for the summary) and try again.
            try {
                const slim = {
                    ...payload,
                    rooms: payload.rooms.map((r) => ({ ...r, beforeDataUrl: null })),
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(slim));
            } catch (_) { /* give up; summary still works in-memory for this tab */ }
        }
    };

    const handleNextRoom = () => {
        setStatus('idle');
        setUploadedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (currentIdx + 1 < orderedRooms.length) {
            setCurrentIdx(currentIdx + 1);
        } else {
            navigate('/design/summary');
        }
    };

    // ────────────────────────────────────────────
    // Render
    // ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-main">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wide uppercase mb-3">
                        <Layers size={14} />
                        Build Your Home {builderName ? `· for ${builderName}` : ''}
                    </div>
                    <h1 className="font-serif text-3xl sm:text-5xl text-main leading-tight font-black italic">
                        {step === 'rooms' && <>Which rooms shall we <span className="text-accent">design today?</span></>}
                        {step === 'style' && <>One <span className="text-accent">style</span>, every room.</>}
                        {step === 'design' && currentRoom && (
                            <>Designing <span className="text-accent">{currentRoom.label}</span>
                                <span className="text-base text-muted font-sans not-italic font-normal block mt-2">
                                    Room {currentIdx + 1} of {orderedRooms.length}
                                </span>
                            </>
                        )}
                    </h1>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-3 mb-8 text-xs">
                    {[
                        { id: 'rooms',  label: 'Pick rooms' },
                        { id: 'style',  label: 'Pick style' },
                        { id: 'design', label: 'Stage each room' },
                    ].map((s, i) => {
                        const active = step === s.id;
                        const done = ['rooms', 'style', 'design'].indexOf(step) > i;
                        return (
                            <div key={s.id} className="inline-flex items-center gap-2">
                                <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        active || done ? 'text-on-accent' : 'text-muted'
                                    }`}
                                    style={{
                                        backgroundColor: active || done ? 'var(--accent)' : 'transparent',
                                        border: active || done ? 'none' : '1px solid var(--glass-border)',
                                    }}
                                >
                                    {done ? '✓' : i + 1}
                                </span>
                                <span className={active ? 'text-main font-semibold' : 'text-muted'}>{s.label}</span>
                                {i < 2 && <span className="text-muted">·</span>}
                            </div>
                        );
                    })}
                </div>

                {/* STEP 1 — Rooms */}
                {step === 'rooms' && (
                    <div className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-3">
                            {ROOMS.map((r) => {
                                const Icon = r.icon;
                                const checked = selectedRooms.includes(r.key);
                                return (
                                    <button
                                        key={r.key}
                                        type="button"
                                        onClick={() => handlePickRoom(r.key)}
                                        className={`text-left rounded-2xl border bg-surface p-4 transition flex items-start gap-3 ${
                                            checked ? 'border-accent ring-2 ring-accent/30' : 'border-premium hover:border-accent'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                            <Icon size={18} className="text-accent" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-main">{r.label}</p>
                                                {checked ? (
                                                    <CheckCircle2 size={18} className="text-accent shrink-0" />
                                                ) : (
                                                    <Circle size={18} className="text-muted shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted mt-0.5">{r.blurb}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {error && (
                            <p className="text-xs text-red-700 inline-flex items-center gap-1.5">
                                <AlertTriangle size={13} /> {error}
                            </p>
                        )}
                        <button
                            onClick={handleStartDesign}
                            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                            className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold px-6 py-3 text-sm hover:opacity-90"
                        >
                            Continue
                            <ArrowRight size={15} />
                        </button>
                    </div>
                )}

                {/* STEP 2 — Style */}
                {step === 'style' && (
                    <div className="space-y-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {STYLES.map((s) => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => setStyle(s.value)}
                                    className={`text-left rounded-2xl border bg-surface p-4 transition ${
                                        style === s.value
                                            ? 'border-accent ring-2 ring-accent/30'
                                            : 'border-premium hover:border-accent'
                                    }`}
                                >
                                    <p className="font-semibold text-main">{s.label}</p>
                                    <p className="text-xs text-muted mt-0.5">{s.blurb}</p>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setStep('rooms')}
                                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-main"
                            >
                                <ChevronLeft size={15} /> Change rooms
                            </button>
                            <button
                                onClick={handleConfirmStyle}
                                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                                className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold px-6 py-3 text-sm hover:opacity-90 ml-auto"
                            >
                                Start staging
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3 — Design each room */}
                {step === 'design' && currentRoom && (
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-surface border border-premium p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                                    Step 3 · {currentRoom.label}
                                </p>
                                <p className="text-xs text-accent font-semibold">
                                    {style.charAt(0).toUpperCase() + style.slice(1)} style
                                </p>
                            </div>

                            {status !== 'done' && (
                                <>
                                    <label
                                        htmlFor="room-upload"
                                        className="block rounded-xl border-2 border-dashed border-accent/40 bg-main p-6 hover:border-accent transition cursor-pointer text-center"
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Your room" className="w-full max-h-64 object-cover rounded-lg" />
                                        ) : (
                                            <div className="py-6">
                                                <Upload size={22} className="text-accent mx-auto mb-3" />
                                                <p className="font-semibold text-main">Drop your {currentRoom.label.toLowerCase()} photo</p>
                                                <p className="text-xs text-muted mt-1">JPG / PNG / WebP · up to 12 MB</p>
                                            </div>
                                        )}
                                        <input
                                            id="room-upload"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => handleFile(e.target.files?.[0])}
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        onClick={runStagingForCurrentRoom}
                                        disabled={!uploadedFile || ['staging', 'scoring', 'bundling'].includes(status)}
                                        style={{
                                            backgroundColor: (!uploadedFile || status !== 'idle' && status !== 'error') ? '#9CA3AF' : 'var(--accent)',
                                            color: '#ffffff',
                                        }}
                                        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold py-3 text-sm hover:opacity-90 disabled:cursor-not-allowed"
                                    >
                                        {status === 'staging' && (<><RefreshCw size={16} className="animate-spin" /> AI staging your room…</>)}
                                        {status === 'scoring' && (<><RefreshCw size={16} className="animate-spin" /> Running Vastu compliance scan…</>)}
                                        {status === 'bundling' && (<><RefreshCw size={16} className="animate-spin" /> Matching catalog products…</>)}
                                        {(status === 'idle' || status === 'error') && (<><Sparkles size={16} /> Stage {currentRoom.label}</>)}
                                    </button>
                                    {error && (
                                        <p className="text-xs text-red-700 mt-2 inline-flex items-center gap-1.5">
                                            <AlertTriangle size={13} /> {error}
                                        </p>
                                    )}
                                </>
                            )}

                            {status === 'done' && (() => {
                                const last = rooms[rooms.length - 1];
                                const band = vastuBand(last?.vastuScore);
                                return (
                                    <div className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <figure>
                                                <img src={last?.beforeDataUrl} alt="Before" className="w-full rounded-xl object-cover aspect-[4/3]" />
                                                <figcaption className="text-[11px] text-muted uppercase tracking-wide text-center mt-1">Before</figcaption>
                                            </figure>
                                            <figure>
                                                <img src={last?.afterDataUrl} alt="Staged" className="w-full rounded-xl object-cover aspect-[4/3] ring-2 ring-accent/40" />
                                                <figcaption className="text-[11px] text-accent uppercase tracking-wide font-semibold text-center mt-1">After · {style}</figcaption>
                                            </figure>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                            {last?.vastuScore != null && (
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white font-semibold"
                                                    style={{ backgroundColor: band.color }}
                                                >
                                                    <Award size={12} /> Vastu {last.vastuScore} · {band.label}
                                                </span>
                                            )}
                                            {last?.catalogBundle?.totalEstimate > 0 && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent font-semibold">
                                                    Catalog · ₹{Math.round(last.catalogBundle.totalEstimate).toLocaleString('en-IN')}
                                                </span>
                                            )}
                                            <span className="text-muted">
                                                {(last?.catalogBundle?.items?.length || 0)} matching products
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleNextRoom}
                                            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold py-3 text-sm hover:opacity-90"
                                        >
                                            {currentIdx + 1 < orderedRooms.length
                                                ? <>Next: {orderedRooms[currentIdx + 1]?.label} <ArrowRight size={15} /></>
                                                : <>See full home summary <ArrowRight size={15} /></>}
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Progress dots */}
                        <div className="flex items-center gap-2 justify-center text-xs text-muted">
                            {orderedRooms.map((r, i) => (
                                <span
                                    key={r.key}
                                    className={`px-3 py-1 rounded-full ${
                                        i < currentIdx ? 'bg-accent/10 text-accent' :
                                        i === currentIdx ? 'border border-accent text-accent' :
                                        'border border-premium'
                                    }`}
                                >
                                    {r.label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
});

export default DesignJourney;
