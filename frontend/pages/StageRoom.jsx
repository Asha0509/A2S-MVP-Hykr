import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Upload, RefreshCw, Download, AlertTriangle, ArrowRight, ImagePlus } from 'lucide-react';
import { stageRoom } from '../services/api';

const ROOM_TYPES = [
    { value: 'living_room', label: 'Living Room' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'dining_room', label: 'Dining Room' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'study', label: 'Study / Office' },
    { value: 'pooja_room', label: 'Pooja Room' },
    { value: 'balcony', label: 'Balcony' },
    { value: 'drawing_room', label: 'Drawing Room' },
];

const STYLES = [
    { value: 'modern',       label: 'Modern',       blurb: 'Clean lines, teak + neutrals, statement pendant' },
    { value: 'minimal',      label: 'Minimal',      blurb: 'Japandi: light wood, linen, near-zero clutter' },
    { value: 'contemporary', label: 'Contemporary', blurb: 'Warm beige + terracotta, curved shapes, brass' },
    { value: 'classic',      label: 'Classic',      blurb: 'Dark carved wood, jewel tones, chandelier' },
    { value: 'ethnic',       label: 'Ethnic',       blurb: 'Block-print textiles, brass, charpai, terracotta' },
    { value: 'functional',   label: 'Functional',   blurb: 'Scandinavian modular, light wood, single accent' },
];

const MAX_FILE_BYTES = 12 * 1024 * 1024;

const StageRoom = () => {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [roomType, setRoomType] = useState('living_room');
    const [style, setStyle] = useState('modern');
    const [hint, setHint] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const stagedDataUrl = useMemo(() => {
        if (!result?.image_base64) return null;
        const mime = result.image_mime || 'image/png';
        return `data:${mime};base64,${result.image_base64}`;
    }, [result]);

    const handleFile = (selected) => {
        if (!selected) return;
        if (!selected.type.startsWith('image/')) {
            setError('Please upload a JPG, PNG or WebP image.');
            return;
        }
        if (selected.size > MAX_FILE_BYTES) {
            setError('Image is over 12 MB. Try a smaller photo.');
            return;
        }
        setError(null);
        setResult(null);
        setFile(selected);
        const url = URL.createObjectURL(selected);
        setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Upload a room photo first.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await stageRoom({ image: file, style, roomType, hint });
            setResult(data);
        } catch (err) {
            setError(err?.error || 'AI staging failed. Try a clearer photo or a different style.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-base">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-3">
                        <Sparkles size={14} />
                        AI Room Staging · Gemini 2.5
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight">
                        Empty room in. <span className="text-primary">Magazine cover out.</span>
                    </h1>
                    <p className="mt-3 text-ink/70 max-w-2xl">
                        Upload a photo of your empty (or messy) room. Pick a style. We restage it in seconds — same walls, windows and floor, fully furnished.
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Left — controls */}
                    <div className="lg:col-span-2 space-y-5">
                        <div
                            className="rounded-2xl border-2 border-dashed border-primary/30 bg-white p-6 hover:border-primary/60 transition cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handleFile(e.target.files?.[0])}
                                className="hidden"
                            />
                            {previewUrl ? (
                                <div className="space-y-3">
                                    <img src={previewUrl} alt="Your room" className="w-full rounded-xl object-cover max-h-64" />
                                    <p className="text-xs text-ink/60 text-center">Click or drop another file to replace</p>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                        <Upload size={22} className="text-primary" />
                                    </div>
                                    <p className="font-semibold text-ink">Drop your room photo here</p>
                                    <p className="text-xs text-ink/60 mt-1">or click to choose · JPG / PNG / WebP · up to 12 MB</p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-white border border-ink/10 p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-ink mb-2">Room type</label>
                                <select
                                    value={roomType}
                                    onChange={(e) => setRoomType(e.target.value)}
                                    className="w-full rounded-lg border border-ink/15 bg-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {ROOM_TYPES.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-ink mb-2">Style</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {STYLES.map((s) => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => setStyle(s.value)}
                                            className={`text-left rounded-lg border p-2.5 transition ${
                                                style === s.value
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                                                    : 'border-ink/10 hover:border-primary/40'
                                            }`}
                                        >
                                            <p className="text-sm font-semibold text-ink">{s.label}</p>
                                            <p className="text-[11px] text-ink/55 leading-snug mt-0.5">{s.blurb}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-ink mb-2">
                                    Anything specific? <span className="text-ink/40 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={hint}
                                    onChange={(e) => setHint(e.target.value.slice(0, 400))}
                                    placeholder="e.g. add a study nook, keep it kid-friendly, prefer dark wood"
                                    rows={2}
                                    className="w-full rounded-lg border border-ink/15 bg-base px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-[11px] text-ink/45 text-right mt-1">{hint.length}/400</p>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || !file}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white font-semibold py-3 text-sm hover:bg-primary/90 disabled:bg-ink/20 disabled:cursor-not-allowed transition"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Staging your room…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Stage this room
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-ink/55 leading-relaxed">
                            We use Google Gemini 2.5 Flash Image to restage your room.
                            Walls, windows and floor are preserved — only the furniture and decor change.
                            Each render takes about 8–20 seconds.
                        </div>
                    </div>

                    {/* Right — output */}
                    <div className="lg:col-span-3">
                        <div className="rounded-2xl bg-white border border-ink/10 p-5 min-h-[420px] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-display text-xl text-ink">Staged result</h2>
                                {result && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleReset}
                                            className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-ink"
                                        >
                                            <RefreshCw size={13} /> Try another style
                                        </button>
                                        <a
                                            href={stagedDataUrl}
                                            download={`a2s-staged-${result.style || 'room'}.png`}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-white text-xs font-semibold px-3 py-1.5 hover:bg-accent/90"
                                        >
                                            <Download size={13} /> Download
                                        </a>
                                    </div>
                                )}
                            </div>

                            {!result && !loading && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 border-2 border-dashed border-ink/10 rounded-xl">
                                    <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                        <ImagePlus size={26} className="text-primary/60" />
                                    </div>
                                    <p className="text-ink/70 max-w-sm">
                                        Your AI-staged room will appear here. Pick a photo, choose a style, then hit&nbsp;<span className="font-semibold text-primary">Stage this room</span>.
                                    </p>
                                </div>
                            )}

                            {loading && (
                                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
                                    <RefreshCw size={28} className="text-primary animate-spin mb-4" />
                                    <p className="text-ink font-semibold">Restaging in {STYLES.find(s => s.value === style)?.label || style} style…</p>
                                    <p className="text-xs text-ink/55 mt-2">This usually takes 8–20 seconds. Don't refresh.</p>
                                </div>
                            )}

                            {result && stagedDataUrl && (
                                <div className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <figure className="space-y-1">
                                            <img src={previewUrl} alt="Before" className="w-full rounded-xl object-cover aspect-[4/3]" />
                                            <figcaption className="text-[11px] text-ink/55 uppercase tracking-wide font-semibold text-center">Before</figcaption>
                                        </figure>
                                        <figure className="space-y-1">
                                            <img src={stagedDataUrl} alt="Staged" className="w-full rounded-xl object-cover aspect-[4/3] ring-2 ring-primary/30" />
                                            <figcaption className="text-[11px] text-primary uppercase tracking-wide font-semibold text-center">After · {result.style}</figcaption>
                                        </figure>
                                    </div>

                                    {result.caption && (
                                        <p className="text-sm text-ink/70 italic border-l-2 border-primary/40 pl-3">
                                            {result.caption}
                                        </p>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                        <Link
                                            to="/gallery"
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white font-semibold py-2.5 text-sm hover:bg-primary/90"
                                        >
                                            Find matching products
                                            <ArrowRight size={15} />
                                        </Link>
                                        <Link
                                            to="/vastu-score"
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 text-primary font-semibold py-2.5 text-sm hover:bg-primary/5"
                                        >
                                            Check Vastu score
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StageRoom;
