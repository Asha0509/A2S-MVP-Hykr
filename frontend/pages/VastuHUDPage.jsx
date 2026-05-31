import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Compass, AlertTriangle, ArrowRight, Award } from 'lucide-react';
import VastuHUD from '../components/VastuHUD';
import SectionBackdrop from '../components/SectionBackdrop';
import { analyseVastuOverlay } from '../services/api';

const ROOM_TYPES = [
    { value: 'bedroom',     label: 'Bedroom' },
    { value: 'living_room', label: 'Living Room' },
    { value: 'kitchen',     label: 'Kitchen' },
    { value: 'pooja_room',  label: 'Pooja Room' },
    { value: 'dining_room', label: 'Dining Room' },
    { value: 'study',       label: 'Study' },
];

const VastuHUDPage = () => {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [roomType, setRoomType] = useState('bedroom');
    const [facing, setFacing] = useState('N');
    const [overlay, setOverlay] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFile = (selected) => {
        if (!selected) return;
        if (!selected.type.startsWith('image/')) {
            setError('Please upload a JPG, PNG or WebP image.');
            return;
        }
        setError(null);
        setFile(selected);
        setOverlay(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(selected));
    };

    const handleRunAnalysis = async (overrideFacing) => {
        if (!file) {
            setError('Upload a room photo first.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const result = await analyseVastuOverlay({
                image: file,
                roomType,
                facing: overrideFacing || facing,
            });
            setOverlay(result);
        } catch (err) {
            setError(err?.error || 'Vastu HUD analysis failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleFacingChange = (direction) => {
        setFacing(direction);
        if (file) handleRunAnalysis(direction);
    };

    return (
        <div className="min-h-screen bg-main">
            <SectionBackdrop variant="midnight" minHeight="40vh">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-12">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase mb-4"
                        style={{ color: '#B8763D', background: 'rgba(184,118,61,0.15)', border: '1px solid rgba(184,118,61,0.35)', backdropFilter: 'blur(6px)' }}
                    >
                        <Compass size={14} />
                        Live Vastu HUD · A2S Exclusive
                    </div>
                    <h1
                        className="font-serif font-black italic leading-[1.05]"
                        style={{ fontSize: 'clamp(2.25rem, 5vw, 4.5rem)', color: '#F4EBDD' }}
                    >
                        Vastu compliance, <span style={{
                            background: 'linear-gradient(90deg, #B8763D 0%, #E8C896 50%, #B8763D 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite',
                        }}>drawn on your actual room</span>.
                    </h1>
                    <p className="mt-4 text-sm sm:text-base max-w-2xl leading-relaxed" style={{ color: 'rgba(244,235,221,0.78)' }}>
                        Upload your room photo, pick which way it faces. Our AI identifies every object, scores the room against a
                        100-point Vastu rule engine, and marks each violation directly on your photo — with the exact fix.
                    </p>
                </div>
                <style>{`@keyframes a2s-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
            </SectionBackdrop>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Controls */}
                    <div className="lg:col-span-2 space-y-4">
                        <div
                            className="rounded-2xl border-2 border-dashed border-accent/40 bg-surface p-6 hover:border-accent transition cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files?.[0])}
                            />
                            {previewUrl ? (
                                <div className="space-y-2">
                                    <img src={previewUrl} alt="Your room" className="w-full rounded-xl object-cover max-h-56" />
                                    <p className="text-xs text-muted text-center">Click to replace</p>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                                        <Upload size={22} className="text-accent" />
                                    </div>
                                    <p className="font-semibold text-main">Drop your room photo here</p>
                                    <p className="text-xs text-muted mt-1">JPG / PNG / WebP · up to 12 MB</p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-surface border border-premium p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-main mb-2">Room type</label>
                                <select
                                    value={roomType}
                                    onChange={(e) => setRoomType(e.target.value)}
                                    className="w-full rounded-lg border border-premium bg-main px-3 py-2 text-sm text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                >
                                    {ROOM_TYPES.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleRunAnalysis()}
                                disabled={!file || loading}
                                style={{
                                    backgroundColor: (!file || loading) ? '#9CA3AF' : 'var(--accent)',
                                    color: '#ffffff',
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-semibold py-3 text-sm hover:opacity-90 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Analysing…' : (<><Compass size={16} /> Run Vastu HUD</>)}
                            </button>

                            {error && (
                                <p className="text-xs text-red-700 inline-flex items-center gap-1.5">
                                    <AlertTriangle size={13} /> {error}
                                </p>
                            )}
                        </div>

                        <div className="rounded-2xl bg-accent/5 border border-accent/20 p-4 text-xs text-muted leading-relaxed">
                            <p className="font-semibold text-accent uppercase tracking-wider text-[10px] mb-2">How this is different</p>
                            <p>
                                Other Vastu tools give you a text checklist. A2S draws compliance markers <span className="text-main font-semibold">on the photo of your actual room</span>,
                                with directional arrows showing exactly where to move each object. Built on Cloudflare Workers AI vision + a Claude-powered Vastu reasoning engine.
                            </p>
                        </div>

                        {overlay && (
                            <Link
                                to="/design"
                                className="block rounded-xl border border-accent text-accent text-sm font-semibold text-center px-4 py-3 hover:bg-accent/5"
                            >
                                Stage this room in your style <ArrowRight size={14} className="inline ml-1" />
                            </Link>
                        )}
                    </div>

                    {/* HUD output */}
                    <div className="lg:col-span-3">
                        <VastuHUD
                            imageSrc={previewUrl}
                            overlay={overlay}
                            loading={loading}
                            onChangeFacing={handleFacingChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VastuHUDPage;
