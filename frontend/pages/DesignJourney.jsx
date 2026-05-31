import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2, Circle, Upload, Sparkles, ArrowRight, RefreshCw, AlertTriangle,
    Home, BedDouble, UtensilsCrossed, Flame, ChevronLeft, Award, Layers,
    Map, Camera, FileImage,
} from 'lucide-react';
import { stageRoom, stageFromPrompt, getSampleBundle, analyseVastuScore, analyseVastuOverlay } from '../services/api';
import VastuHUD from '../components/VastuHUD';
import SectionBackdrop from '../components/SectionBackdrop';
import CatalogSourceChoice from '../components/CatalogSourceChoice';
import { DEMO_JOURNEY_PAYLOAD } from '../data/demoJourney';

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

// ────────────────────────────────────────────
// Floor-plan mode (pre-possession buyers)
// Three hardcoded "typical Indian flat" plans. Each plan dictates which
// rooms exist — we run text-to-image (no source photo needed) for each.
// ────────────────────────────────────────────
const svgPlanUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const FLOOR_PLANS = [
    {
        key: '1bhk',
        label: '1 BHK · 540 sq ft',
        blurb: 'Compact starter unit. Common in Pune, Hyderabad outskirts.',
        roomKeys: ['living_room', 'bedroom', 'kitchen'],
        svg: svgPlanUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F4EBDD"/><rect x="20" y="20" width="360" height="260" fill="none" stroke="#1D6172" stroke-width="3"/><line x1="220" y1="20" x2="220" y2="170" stroke="#1D6172" stroke-width="2"/><line x1="220" y1="170" x2="380" y2="170" stroke="#1D6172" stroke-width="2"/><text x="120" y="100" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">LIVING</text><text x="120" y="118" text-anchor="middle" font-size="10" fill="#6B5E45">12'×14'</text><text x="300" y="95" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">BEDROOM</text><text x="300" y="113" text-anchor="middle" font-size="10" fill="#6B5E45">10'×11'</text><text x="300" y="225" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">KITCHEN</text><text x="300" y="243" text-anchor="middle" font-size="10" fill="#6B5E45">7'×9'</text><text x="120" y="225" text-anchor="middle" font-size="11" fill="#B8763D" font-family="Inter, sans-serif">DINING NICHE</text></svg>`),
    },
    {
        key: '2bhk',
        label: '2 BHK · 820 sq ft',
        blurb: 'Most-sold Indian configuration. Couple + nursery / WFH.',
        roomKeys: ['living_room', 'bedroom', 'bedroom_2', 'kitchen'],
        svg: svgPlanUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F4EBDD"/><rect x="20" y="20" width="360" height="260" fill="none" stroke="#1D6172" stroke-width="3"/><line x1="200" y1="20" x2="200" y2="160" stroke="#1D6172" stroke-width="2"/><line x1="20" y1="160" x2="380" y2="160" stroke="#1D6172" stroke-width="2"/><line x1="200" y1="160" x2="200" y2="280" stroke="#1D6172" stroke-width="2"/><text x="110" y="90" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">LIVING</text><text x="110" y="108" text-anchor="middle" font-size="10" fill="#6B5E45">13'×14'</text><text x="290" y="90" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">MASTER</text><text x="290" y="108" text-anchor="middle" font-size="10" fill="#6B5E45">11'×12'</text><text x="110" y="220" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">KITCHEN</text><text x="110" y="238" text-anchor="middle" font-size="10" fill="#6B5E45">8'×10'</text><text x="290" y="220" text-anchor="middle" font-size="13" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">BEDROOM 2</text><text x="290" y="238" text-anchor="middle" font-size="10" fill="#6B5E45">10'×11'</text></svg>`),
    },
    {
        key: '3bhk',
        label: '3 BHK · 1,250 sq ft',
        blurb: 'Premium family unit. Includes a dedicated pooja room.',
        roomKeys: ['living_room', 'bedroom', 'bedroom_2', 'bedroom_3', 'kitchen', 'pooja_room'],
        svg: svgPlanUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F4EBDD"/><rect x="20" y="20" width="360" height="260" fill="none" stroke="#1D6172" stroke-width="3"/><line x1="170" y1="20" x2="170" y2="160" stroke="#1D6172" stroke-width="2"/><line x1="270" y1="20" x2="270" y2="160" stroke="#1D6172" stroke-width="2"/><line x1="20" y1="160" x2="380" y2="160" stroke="#1D6172" stroke-width="2"/><line x1="140" y1="160" x2="140" y2="280" stroke="#1D6172" stroke-width="2"/><line x1="270" y1="160" x2="270" y2="280" stroke="#1D6172" stroke-width="2"/><line x1="270" y1="220" x2="380" y2="220" stroke="#1D6172" stroke-width="2"/><text x="95" y="90" text-anchor="middle" font-size="12" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">LIVING</text><text x="220" y="90" text-anchor="middle" font-size="11" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">MASTER</text><text x="325" y="90" text-anchor="middle" font-size="11" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">BED 2</text><text x="80" y="220" text-anchor="middle" font-size="11" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">KITCHEN</text><text x="205" y="220" text-anchor="middle" font-size="11" fill="#1D6172" font-family="Inter, sans-serif" font-weight="700">BED 3</text><text x="325" y="195" text-anchor="middle" font-size="10" fill="#B8763D" font-family="Inter, sans-serif" font-weight="700">POOJA</text><text x="325" y="255" text-anchor="middle" font-size="10" fill="#1D6172" font-family="Inter, sans-serif">DINING</text></svg>`),
    },
];

// Map plan room-keys (which may include numbered bedrooms) to display labels.
const PLAN_ROOM_LABELS = {
    living_room: 'Living Room',
    bedroom: 'Master Bedroom',
    bedroom_2: 'Bedroom 2',
    bedroom_3: 'Bedroom 3',
    kitchen: 'Kitchen',
    pooja_room: 'Pooja Room',
};

// Translate numbered bedroom keys back to the canonical 'bedroom' room-type
// so the staging backend's prompt overlays still match.
const canonicalRoomType = (key) => (key.startsWith('bedroom') ? 'bedroom' : key);

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
    // Step machine — photo flow uses rooms|style|design; floor-plan flow
    // uses plan|plan-style|plan-stage. Both end at /design/summary.
    const [step, setStep] = useState('mode'); // mode | rooms | style | design | plan | plan-style | plan-stage
    const [selectedRooms, setSelectedRooms] = useState(['living_room', 'bedroom', 'kitchen', 'pooja_room']);
    const [style, setStyle] = useState('modern');
    const [catalogSource, setCatalogSource] = useState('builder');
    const [rooms, setRooms] = useState([]);     // accumulated results
    const [currentIdx, setCurrentIdx] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | staging | scoring | bundling | done | error
    const [error, setError] = useState(null);

    // Floor-plan flow state
    const [selectedPlan, setSelectedPlan] = useState(null); // one of FLOOR_PLANS or { custom: true, previewUrl, roomKeys }
    const [planUploadFile, setPlanUploadFile] = useState(null);
    const [planUploadPreview, setPlanUploadPreview] = useState(null);
    const [planProgress, setPlanProgress] = useState({ current: 0, total: 0, label: '' });

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

    const handleTakeDemoTour = () => {
        // Bypass the live FLUX/Vastu/catalog calls and jump straight to the
        // summary with pre-fabricated, realistic state. Used for the
        // recorded demo video — guaranteed to render in <100ms with no
        // network dependency.
        const payload = {
            ...DEMO_JOURNEY_PAYLOAD,
            builderName: builderName || DEMO_JOURNEY_PAYLOAD.builderName,
            builderId: localStorage.getItem(ATTRIBUTED_KEY) || DEMO_JOURNEY_PAYLOAD.builderId,
            generatedAt: new Date().toISOString(),
        };
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
            navigate('/design/summary');
        } catch (_) {
            setError('Could not load demo tour — sessionStorage may be full.');
        }
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
            let vastuOverlay = null;
            // Prefer the new Vastu HUD overlay endpoint (returns specific
            // violations + zone markers); fall back to the legacy /vastu/analyse
            // numeric scoring if the overlay endpoint is unavailable.
            try {
                vastuOverlay = await analyseVastuOverlay({
                    image: uploadedFile,
                    roomType: currentRoom.key,
                    facing: 'N',
                });
                if (vastuOverlay && typeof vastuOverlay.score === 'number') {
                    vastuScore = Math.round(vastuOverlay.score);
                    vastuBandLabel = vastuOverlay.band || vastuBand(vastuScore).label;
                }
            } catch (_) {
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
                    // Both attempts failed; continue without Vastu data
                }
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
                vastuOverlay,
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
    // Floor-plan flow handlers
    // ────────────────────────────────────────────
    const handlePlanFileUpload = (file) => {
        if (!file) return;
        // Accept image + PDF; PDF preview falls back to a generic icon.
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        if (!isImage && !isPdf) {
            setError('Please upload a JPG, PNG or PDF floor plan.');
            return;
        }
        setError(null);
        setPlanUploadFile(file);
        setPlanUploadPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return isImage ? URL.createObjectURL(file) : null;
        });
        // For an uploaded plan we default to a 2-BHK room set — the buyer can
        // still pick a different hardcoded plan if this guess is wrong.
        setSelectedPlan({
            custom: true,
            key: 'custom',
            label: 'Your uploaded plan',
            roomKeys: ['living_room', 'bedroom', 'kitchen'],
            previewUrl: isImage ? URL.createObjectURL(file) : null,
        });
    };

    const handlePickPlan = (plan) => {
        setError(null);
        setSelectedPlan(plan);
    };

    const handleConfirmPlan = () => {
        if (!selectedPlan) {
            setError('Pick a floor plan or upload your own.');
            return;
        }
        setError(null);
        setStep('plan-style');
    };

    const runPlanStaging = async () => {
        if (!selectedPlan) return;
        setError(null);
        setStep('plan-stage');
        const roomKeys = selectedPlan.roomKeys || [];
        const accumulated = [];
        for (let i = 0; i < roomKeys.length; i++) {
            const roomKey = roomKeys[i];
            const roomLabel = PLAN_ROOM_LABELS[roomKey] || roomKey;
            const canonical = canonicalRoomType(roomKey);
            setPlanProgress({ current: i + 1, total: roomKeys.length, label: roomLabel });
            try {
                const staged = await stageFromPrompt({
                    style,
                    roomType: canonical,
                    hint: `Indian ${roomLabel.toLowerCase()}, ${style} style, designed for a ${selectedPlan.label || 'new flat'}`,
                });
                const catalogBundle = await getSampleBundle({
                    roomType: canonical,
                    style,
                    brands: builderBrands,
                    limit: 6,
                }).catch(() => ({ items: [], totalEstimate: 0, currency: 'INR' }));

                const stagedDataUrl = `data:${staged.image_mime || 'image/jpeg'};base64,${staged.image_base64}`;
                accumulated.push({
                    roomType: canonical,
                    roomLabel,
                    beforeDataUrl: null, // pre-possession — no original photo exists
                    afterDataUrl: stagedDataUrl,
                    vastuScore: null,
                    vastuBand: null,
                    vastuOverlay: null,
                    catalogBundle,
                });
            } catch (err) {
                console.error('[journey] plan staging failed for', roomKey, err);
                // Continue with remaining rooms; surface a soft error at the end.
                setError((prev) => prev || `Couldn't stage ${roomLabel}. The rest of the home will still load.`);
            }
        }
        // Persist + jump to summary
        const payload = {
            builderId: localStorage.getItem(ATTRIBUTED_KEY) || (() => {
                try { return JSON.parse(localStorage.getItem(BUILDER_KEY) || '{}')?.builderId || null; } catch (_) { return null; }
            })(),
            builderName,
            style,
            rooms: accumulated,
            preferredBrands: builderBrands,
            generatedAt: new Date().toISOString(),
            source: 'floor-plan',
            planKey: selectedPlan.key,
        };
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
        } catch (_) {
            // quota fallback — drop bundles
            const slim = { ...payload, rooms: accumulated.map((r) => ({ ...r, catalogBundle: { items: [], totalEstimate: 0, currency: 'INR' } })) };
            try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(slim)); } catch (_) { /* give up */ }
        }
        if (accumulated.length === 0) {
            setError('No rooms could be staged. Try the demo tour or switch to photo mode.');
            setStep('plan');
            return;
        }
        navigate('/design/summary');
    };

    // ────────────────────────────────────────────
    // Render
    // ────────────────────────────────────────────
    const cinemaHeading = (() => {
        if (step === 'mode')        return [<>How do you want to <span style={{ background: 'linear-gradient(90deg,#B8763D,#E8C896,#B8763D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite' }} key="x">start?</span></>, null];
        if (step === 'rooms')       return [<>Which rooms shall we <span style={{ background: 'linear-gradient(90deg,#B8763D,#E8C896,#B8763D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite' }} key="x">design today?</span></>, null];
        if (step === 'style')       return [<>One <span style={{ background: 'linear-gradient(90deg,#B8763D,#E8C896,#B8763D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite' }} key="x">style</span>, every room.</>, null];
        if (step === 'design' && currentRoom) return [<>Designing <span style={{ background: 'linear-gradient(90deg,#B8763D,#E8C896,#B8763D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite' }} key="x">{currentRoom.label}</span></>, `Room ${currentIdx + 1} of ${orderedRooms.length}`];
        if (step === 'plan')        return [<>Pick your <span style={{ background: 'linear-gradient(90deg,#B8763D,#E8C896,#B8763D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite' }} key="x">floor plan</span></>, null];
        if (step === 'plan-style')  return [<>One <span style={{ background: 'linear-gradient(90deg,#B8763D,#E8C896,#B8763D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite' }} key="x">style</span> for your future home.</>, null];
        if (step === 'plan-stage')  return [<>Staging your <span style={{ background: 'linear-gradient(90deg,#B8763D,#E8C896,#B8763D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%', animation: 'a2s-shimmer 6s linear infinite' }} key="x">{planProgress.label || 'home'}</span></>, `Room ${planProgress.current} of ${planProgress.total} — no photos needed`];
        return [null, null];
    })();

    return (
        <div className="min-h-screen bg-main">
            <SectionBackdrop variant="dark" minHeight="35vh">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-10">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase mb-5"
                        style={{ color: '#B8763D', background: 'rgba(184,118,61,0.15)', border: '1px solid rgba(184,118,61,0.35)', backdropFilter: 'blur(6px)' }}
                    >
                        <Layers size={14} />
                        Build Your Home{builderName ? ` · for ${builderName}` : ''}
                    </div>
                    <h1 className="font-serif font-black italic leading-[1.05]" style={{ fontSize: 'clamp(2rem, 4.5vw, 4rem)', color: '#F4EBDD' }}>
                        {cinemaHeading[0]}
                    </h1>
                    {cinemaHeading[1] && (
                        <p className="text-sm font-sans mt-3" style={{ color: 'rgba(244,235,221,0.7)' }}>{cinemaHeading[1]}</p>
                    )}
                </div>
                <style>{`@keyframes a2s-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
            </SectionBackdrop>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">

                {/* Stepper — different rail for photo vs floor-plan flow. Hidden on mode select. */}
                {step !== 'mode' && (
                <div className="flex items-center gap-2 sm:gap-3 mb-8 text-[11px] sm:text-xs overflow-x-auto -mx-1 px-1">
                    {(step === 'plan' || step === 'plan-style' || step === 'plan-stage' ? [
                        { id: 'plan',       label: 'Pick plan' },
                        { id: 'plan-style', label: 'Pick style' },
                        { id: 'plan-stage', label: 'Stage rooms' },
                    ] : [
                        { id: 'rooms',  label: 'Pick rooms' },
                        { id: 'style',  label: 'Pick style' },
                        { id: 'design', label: 'Stage each room' },
                    ]).map((s, i, arr) => {
                        const active = step === s.id;
                        const order = arr.map((x) => x.id);
                        const done = order.indexOf(step) > i;
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
                                {i < arr.length - 1 && <span className="text-muted">·</span>}
                            </div>
                        );
                    })}
                </div>
                )}

                {/* STEP 0 — Mode select: photo vs floor plan */}
                {step === 'mode' && (
                    <div className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => { setError(null); setStep('rooms'); }}
                                className="text-left rounded-2xl border border-premium bg-surface p-6 hover:border-accent transition group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition">
                                    <Camera size={22} className="text-accent" />
                                </div>
                                <p className="font-serif text-xl text-main font-bold mb-1">I have my unit photos</p>
                                <p className="text-sm text-muted">You've taken possession (or have site visit photos). We'll restyle every room you upload with geometry-preserving FLUX-dev img2img.</p>
                                <p className="text-xs text-accent font-semibold mt-3 inline-flex items-center gap-1">
                                    Start photo journey <ArrowRight size={13} />
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => { setError(null); setStep('plan'); }}
                                className="text-left rounded-2xl border-2 border-accent bg-surface p-6 hover:opacity-90 transition group relative"
                            >
                                <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide text-on-accent" style={{ backgroundColor: 'var(--accent)' }}>
                                    New
                                </span>
                                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition">
                                    <Map size={22} className="text-accent" />
                                </div>
                                <p className="font-serif text-xl text-main font-bold mb-1">I only have a floor plan</p>
                                <p className="text-sm text-muted">Pre-possession buyers: pick a typical 1/2/3 BHK or upload the builder's plan. We'll generate every room with text-to-image — no unit photos needed.</p>
                                <p className="text-xs text-accent font-semibold mt-3 inline-flex items-center gap-1">
                                    Start floor-plan journey <ArrowRight size={13} />
                                </p>
                            </button>
                        </div>
                        <p className="text-xs text-muted text-center">
                            The point-of-sale demo your builder runs is the <span className="text-accent font-semibold">floor-plan</span> path —
                            buyers see their future home before booking. 6 to 8 seconds per room on fal.ai.
                        </p>
                    </div>
                )}

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

                        {/* Catalog source — builder's catalog vs bring-your-own */}
                        <CatalogSourceChoice value={catalogSource} onChange={setCatalogSource} />

                        {error && (
                            <p className="text-xs text-red-700 inline-flex items-center gap-1.5">
                                <AlertTriangle size={13} /> {error}
                            </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <button
                                onClick={handleStartDesign}
                                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg font-semibold px-6 py-3 text-sm hover:opacity-90"
                            >
                                Continue · upload my own photos
                                <ArrowRight size={15} />
                            </button>
                            <span className="text-xs text-muted text-center sm:text-left">or</span>
                            <button
                                onClick={handleTakeDemoTour}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-accent text-accent font-semibold px-6 py-3 text-sm hover:bg-accent/5"
                            >
                                Take the 1-click demo tour
                            </button>
                        </div>
                        <p className="text-xs text-muted -mt-2">
                            The demo tour pre-loads a sample 3 BHK staged in Contemporary style — no upload needed. Live mode runs FLUX-1-schnell on Cloudflare Workers AI; ~8 sec per room.
                        </p>
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

                                        {last?.vastuOverlay && last?.beforeDataUrl && (
                                            <details className="rounded-2xl bg-main border border-premium p-4">
                                                <summary className="cursor-pointer text-sm font-semibold text-main flex items-center gap-2">
                                                    <span className="text-accent">Show the Vastu HUD on this room</span>
                                                    <span className="text-xs text-muted">— compliance markers drawn on the photo</span>
                                                </summary>
                                                <div className="mt-4">
                                                    <VastuHUD
                                                        imageSrc={last.beforeDataUrl}
                                                        overlay={last.vastuOverlay}
                                                        loading={false}
                                                    />
                                                </div>
                                            </details>
                                        )}

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

                {/* STEP P1 — Floor plan selection */}
                {step === 'plan' && (
                    <div className="space-y-6">
                        <p className="text-sm text-muted -mt-3">
                            Pick a typical Indian flat layout — or upload your builder's plan (PDF or image).
                            The rooms will be detected automatically.
                        </p>

                        <div className="grid sm:grid-cols-3 gap-3">
                            {FLOOR_PLANS.map((plan) => {
                                const isSelected = selectedPlan?.key === plan.key;
                                return (
                                    <button
                                        key={plan.key}
                                        type="button"
                                        onClick={() => handlePickPlan(plan)}
                                        className={`text-left rounded-2xl border bg-surface p-3 transition ${
                                            isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-premium hover:border-accent'
                                        }`}
                                    >
                                        <img src={plan.svg} alt={plan.label} className="w-full rounded-lg aspect-[4/3] object-contain bg-main" />
                                        <p className="font-semibold text-main mt-3 text-sm">{plan.label}</p>
                                        <p className="text-xs text-muted mt-0.5">{plan.blurb}</p>
                                        <p className="text-[11px] text-accent font-semibold mt-2">
                                            {plan.roomKeys.length} rooms · {plan.roomKeys.map((k) => PLAN_ROOM_LABELS[k]).join(', ')}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="rounded-2xl border border-dashed border-accent/40 bg-surface p-4">
                            <label htmlFor="plan-upload" className="cursor-pointer flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                    <FileImage size={18} className="text-accent" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-main text-sm">
                                        {planUploadFile ? `Uploaded: ${planUploadFile.name}` : 'Or upload your own floor plan'}
                                    </p>
                                    <p className="text-xs text-muted">PDF, JPG or PNG · up to 25 MB · we'll default to a 1 BHK room set; switch to a hardcoded plan above if needed</p>
                                </div>
                                {selectedPlan?.custom && (
                                    <CheckCircle2 size={18} className="text-accent" />
                                )}
                                <input
                                    id="plan-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={(e) => handlePlanFileUpload(e.target.files?.[0])}
                                />
                            </label>
                            {planUploadPreview && (
                                <img src={planUploadPreview} alt="Your plan" className="mt-3 w-full max-h-56 object-contain rounded-lg bg-main" />
                            )}
                        </div>

                        {error && (
                            <p className="text-xs text-red-700 inline-flex items-center gap-1.5">
                                <AlertTriangle size={13} /> {error}
                            </p>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <button
                                onClick={() => setStep('mode')}
                                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-main"
                            >
                                <ChevronLeft size={15} /> Back
                            </button>
                            <button
                                onClick={handleConfirmPlan}
                                disabled={!selectedPlan}
                                style={{
                                    backgroundColor: selectedPlan ? 'var(--accent)' : '#9CA3AF',
                                    color: '#ffffff',
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold px-6 py-3 text-sm hover:opacity-90 disabled:cursor-not-allowed ml-auto"
                            >
                                Continue · pick style <ArrowRight size={15} />
                            </button>
                            <button
                                onClick={handleTakeDemoTour}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent text-accent font-semibold px-6 py-3 text-sm hover:bg-accent/5"
                            >
                                Take the demo tour
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP P2 — Style for floor plan */}
                {step === 'plan-style' && selectedPlan && (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-premium bg-surface p-3 inline-flex items-center gap-3">
                            <img
                                src={selectedPlan.svg || selectedPlan.previewUrl}
                                alt="Selected plan"
                                className="w-24 h-20 object-contain bg-main rounded-md"
                            />
                            <div>
                                <p className="text-sm font-semibold text-main">{selectedPlan.label}</p>
                                <p className="text-xs text-muted">{(selectedPlan.roomKeys || []).length} rooms will be staged in your chosen style</p>
                            </div>
                        </div>

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
                                onClick={() => setStep('plan')}
                                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-main"
                            >
                                <ChevronLeft size={15} /> Change plan
                            </button>
                            <button
                                onClick={runPlanStaging}
                                style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
                                className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold px-6 py-3 text-sm hover:opacity-90 ml-auto"
                            >
                                Generate my future home <Sparkles size={15} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP P3 — Live progress while text-to-image staging runs */}
                {step === 'plan-stage' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl bg-surface border border-premium p-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                                <RefreshCw size={24} className="text-accent animate-spin" />
                            </div>
                            <p className="font-serif text-xl text-main font-bold mb-1">
                                Staging {planProgress.label || 'your home'}…
                            </p>
                            <p className="text-sm text-muted">
                                Room {planProgress.current} of {planProgress.total} · text-to-image via fal.ai FLUX-dev
                            </p>
                            <div className="mt-5 h-2 bg-main rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-all"
                                    style={{
                                        width: planProgress.total ? `${(planProgress.current / planProgress.total) * 100}%` : '0%',
                                        backgroundColor: 'var(--accent)',
                                    }}
                                />
                            </div>
                            <p className="text-xs text-muted mt-4">
                                Sit tight — each room takes about 6–8 seconds. We'll jump to the full home summary as soon as everything is staged.
                            </p>
                        </div>
                        {error && (
                            <p className="text-xs text-red-700 inline-flex items-center gap-1.5">
                                <AlertTriangle size={13} /> {error}
                            </p>
                        )}
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
