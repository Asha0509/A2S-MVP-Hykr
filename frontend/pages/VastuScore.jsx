import React, { useEffect, useMemo, useState } from 'react';
import { Compass, Upload, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, ExternalLink, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { analyseVastuScore, getVastuScoreStatus, trackVastuCatalogClick } from '../services/api';

const ROOM_TYPES = ['Living Room', 'Bedroom', 'Kitchen', 'Pooja Room', 'Study', 'Dining Room'];
const DIRECTIONS = ['Auto detect', 'North', 'South', 'East', 'West', 'NE', 'NW', 'SE', 'SW'];
const FLOORS = ['Ground', '1-5', '6-10', '10+'];

const STATUS_COPY = [
    'Detecting objects...',
    'Checking Vastu rules...',
    'Calculating score...',
];

const scoreBand = (score) => {
    if (score <= 40) return { label: 'Poor', color: '#dc2626' };
    if (score <= 65) return { label: 'Needs Improvement', color: '#f59e0b' };
    if (score <= 85) return { label: 'Good', color: '#16a34a' };
    return { label: 'Excellent Vastu', color: '#1d6172' };
};

const ringOffset = (score) => {
    const radius = 76;
    const circumference = 2 * Math.PI * radius;
    return circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
};

const formatCountdown = (seconds) => {
    const safe = Math.max(0, Number(seconds || 0));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    return `${h}h ${m}m`;
};

const buildFallbackDetailedReport = (result, roomType) => {
    if (!result) return null;

    const score = Number(result?.score || 0);
    const categoryScores = result?.category_scores || {};
    const diagnostics = result?.diagnostics || { pass: 0, partial: 0, fail: 0, not_detected: 0 };
    const sorted = Object.entries(categoryScores).sort((a, b) => Number(b[1]) - Number(a[1]));
    const weakest = [...sorted].reverse().slice(0, 2);
    const strongest = sorted.slice(0, 2);
    const facing = result?.auto_direction?.direction || 'N';
    const confidence = Math.round((result?.auto_direction?.confidence || 0) * 100);

    const basisByCategory = {
        decor: 'Decor calibration controls visual calm, emotional softness, and symbolic resonance in this room.',
        elements: 'Elemental composition determines whether fire-water-air-earth influences are balanced or competing.',
        entry: 'Entry presentation governs how energy enters, settles, and circulates through daily movement.',
        furniture: 'Furniture mass and orientation decide circulation quality, center stability, and conversation flow.',
        light: 'Light placement shapes alertness, mood, and the energetic rhythm of the space across the day.',
    };

    const riskByCategory = {
        decor: 'visual fatigue, overstimulation, and reduced emotional comfort in daily use',
        elements: 'instability between calm and drive, leading to inconsistent outcomes over weeks',
        entry: 'energy leakage at the threshold, making momentum and opportunity retention weaker',
        furniture: 'blocked circulation and subtle stress from compressed movement corridors',
        light: 'low vitality and reduced optimism due to uneven or underpowered illumination zones',
    };

    const label = (category) => String(category).replace('_', ' ').replace(/\b\w/g, (s) => s.toUpperCase());

    const scoringBasis = Object.entries(categoryScores).map(([category, value]) => ({
        category,
        score: Number(value || 0),
        band: Number(value || 0) >= 80 ? 'strong' : Number(value || 0) >= 60 ? 'moderate' : 'weak',
        why_it_matters: basisByCategory[category] || 'This layer directly impacts directional harmony and energetic stability.',
        assessment_basis: `Derived from visible layout cues, directional suitability, and room-structure signals for ${facing}.`,
    }));

    const potentialRisks = weakest.map(([category, value]) => ({
        category,
        severity: Number(value || 0) < 45 ? 'high' : Number(value || 0) < 65 ? 'medium' : 'low',
        risk: riskByCategory[category] || 'directional inconsistency and reduced room coherence over time',
        if_ignored: `If ${label(category)} remains at ${value}/100, this zone may continue underperforming for the next 6-12 weeks until corrected.`,
    }));

    const concerns = weakest.map(([category, value]) => (
        `${label(category)} is currently at ${value}/100. This is a priority correction zone and should be addressed before cosmetic upgrades.`
    ));

    const strengths = strongest.map(([category, value]) => (
        `${label(category)} is performing at ${value}/100 and is currently supporting room stability and functional harmony.`
    ));

    return {
        consultation_intro: `This consultation is prepared for your ${String(roomType || 'room').toLowerCase()} with primary facing considered as ${facing}. The assessment combines directional suitability, circulation quality, elemental balance, and usable spatial cues from the submitted frame.`,
        confidence_note: `Current directional confidence is ${confidence}%. For a fully locked recommendation set, add 2-3 wider doorway-angle photos in natural light.`,
        directional_snapshot: {
            facing,
            element: 'Directional elemental mix',
            focus: 'stability, prosperity flow, and conflict reduction',
            inference: result?.auto_direction || {},
        },
        diagnostics,
        strengths,
        concerns,
        scoring_basis: scoringBasis,
        potential_risks: potentialRisks,
        conversation: [
            `I assessed this ${String(roomType || 'room').toLowerCase()} with facing ${facing}.`,
            `Current score is ${score}/100, with ${Number(diagnostics.pass || 0)} clear alignments and ${Number(diagnostics.fail || 0)} direct conflicts.`,
            'Most score recovery comes from correcting the two weakest categories first, then balancing light/decor.',
            'If left uncorrected, these imbalances may manifest as delays, friction, or reduced support in the related life domain; this is a risk trend, not fixed fate.',
        ],
        remedies: (result?.suggestions || []).slice(0, 5).map((item, idx) => ({
            priority: idx + 1,
            title: item.issue || 'Directional correction',
            action: item.fix || 'Adjust layout and re-scan.',
            impact: Number(item.score_impact || 0),
            timing: idx < 2 ? 'within 48 hours' : 'this week',
            astro_note: 'This correction reduces directional friction and supports steadier prana flow.',
            catalog_filter: item.catalog_filter || '',
        })),
        correction_protocol: [
            { step: 1, title: 'Capture Better Reference', instruction: 'Upload 2-3 bright doorway-angle photos to improve object and direction certainty.' },
            { step: 2, title: 'Fix Top Two Weak Zones', instruction: 'Address the lowest two category scores first; they create the biggest drag on score.' },
            { step: 3, title: 'Balance Elements', instruction: 'Adjust lighting, materials, and decor so no single element dominates the room field.' },
            { step: 4, title: 'Rescan For Confirmation', instruction: 'Re-run after changes and confirm diagnostics improve before finalizing decisions.' },
        ],
    };
};

const VastuScore = () => {
    const [roomType, setRoomType] = useState('Living Room');
    const [facingDirection, setFacingDirection] = useState('Auto detect');
    const [floor, setFloor] = useState('');
    const [files, setFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);

    const [status, setStatus] = useState({ used: 0, remaining: 3, limit: 3, reset_in_seconds: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('setup');
    const [statusCopyIndex, setStatusCopyIndex] = useState(0);

    const meter = useMemo(() => scoreBand(result?.score || 0), [result]);

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const s = await getVastuScoreStatus();
                setStatus(s);
            } catch (e) {
                setError(typeof e === 'string' ? e : 'Please log in to use Vastu Score.');
            }
        };
        loadStatus();
    }, []);

    useEffect(() => {
        if (status.reset_in_seconds <= 0) return;
        const timer = setInterval(() => {
            setStatus((prev) => ({ ...prev, reset_in_seconds: Math.max(0, prev.reset_in_seconds - 1) }));
        }, 1000);
        return () => clearInterval(timer);
    }, [status.reset_in_seconds]);

    useEffect(() => {
        if (!loading) return;
        const timer = setInterval(() => {
            setStatusCopyIndex((prev) => (prev + 1) % STATUS_COPY.length);
        }, 900);
        return () => clearInterval(timer);
    }, [loading]);

    useEffect(() => {
        const previews = files.map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file),
        }));

        setFilePreviews(previews);

        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [files]);

    const onFileChange = (e) => {
        const selected = Array.from(e.target.files || []).slice(0, 3);
        for (const file of selected) {
            if (file.size > 10 * 1024 * 1024) {
                setError('Please upload a JPG, PNG, or HEIC photo under 10MB.');
                return;
            }
        }
        setError('');
        setFiles(selected);
        setResult(null);
        setStep('upload');
    };

    const runAnalysis = async () => {
        if (!files.length) {
            setError('Please upload at least one room image.');
            return;
        }
        setError('');
        setLoading(true);
        setStatusCopyIndex(0);
        setStep('upload');

        try {
            const formData = new FormData();
            formData.append('room_type', roomType);
            formData.append('facing_direction', facingDirection);
            if (floor) formData.append('floor', floor);
            files.forEach((file) => formData.append('images', file));

            const response = await analyseVastuScore(formData);
            setResult(response);
            setStep('results');
            setStatus((prev) => ({
                ...prev,
                used: response.scans_used_today ?? prev.used,
                remaining: response.scans_remaining ?? prev.remaining,
            }));
        } catch (e) {
            let message = typeof e === 'string'
                ? e
                : e?.message || 'Taking a bit longer than usual. Please try again.';

            if (typeof e === 'object' && e?.error_code === 'LOW_DIRECTION_CONFIDENCE') {
                const confidence = Math.round((e?.auto_direction?.confidence || 0) * 100);
                const needed = Math.round((e?.required_confidence || 0.55) * 100);
                const nimReason = e?.auto_direction?.signals?.nim?.reasoning;
                message = `Auto direction confidence is ${confidence}% (need ${needed}%+). Please set direction manually or retake clearer photos.${nimReason ? ` NIM note: ${nimReason}` : ''}`;
            }

            if (typeof e === 'object' && e?.error_code === 'DIRECTION_INFERENCE_FAILED') {
                const nimReason = e?.auto_direction?.signals?.nim?.reasoning;
                message = `Auto direction could not be resolved reliably. Please set direction manually.${nimReason ? ` NIM note: ${nimReason}` : ''}`;
            }

            setError(message);

            if (typeof e === 'object' && e?.reset_in_seconds !== undefined) {
                setStatus((prev) => ({
                    ...prev,
                    remaining: 0,
                    reset_in_seconds: Number(e.reset_in_seconds || 0),
                }));
            } else if (message.includes('3 Vastu scans')) {
                setStatus((prev) => ({ ...prev, remaining: 0 }));
            }
        } finally {
            setLoading(false);
        }
    };

    const categoryEntries = Object.entries(result?.category_scores || {});
    const detailedReport = useMemo(() => {
        if (result?.detailed_report) return result.detailed_report;
        return buildFallbackDetailedReport(result, roomType);
    }, [result, roomType]);
    const diagnosticsEntries = Object.entries(detailedReport?.diagnostics || result?.diagnostics || {});
    const directionConfidencePct = Math.round((result?.auto_direction?.confidence || 0) * 100);
    const directionTargetPct = Math.round((result?.auto_direction?.target_accuracy || 0.87) * 100);
    const isDirectionPreliminary = directionConfidencePct < directionTargetPct;
    const insufficientEvidence = (result?.report_mode === 'insufficient_evidence')
        || ((Number(result?.parameters_assessed || 0) === 0) && (Number(result?.detection_count || 0) === 0));

    const openCatalog = async (filter) => {
        const url = `/#/gallery?vastu_filter=${encodeURIComponent(filter || '')}&roomType=${encodeURIComponent(roomType)}`;
        await trackVastuCatalogClick({
            catalog_filter: filter || '',
            catalog_url: url,
            cache_key: result?.cache_key_hint || '',
        });
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const rateLimited = Number(status.remaining) <= 0;

    const downloadReport = () => {
        if (!result || !detailedReport) return;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 42;
        const marginTop = 50;
        const marginBottom = 52;
        const contentWidth = pageWidth - (marginX * 2);
        const lineHeight = 15;
        let cursorY = marginTop;

        const addPageIfNeeded = (neededHeight = lineHeight) => {
            if (cursorY + neededHeight > pageHeight - marginBottom) {
                doc.addPage();
                cursorY = marginTop;
            }
        };

        const writeWrapped = (text, fontSize = 10, fontStyle = 'normal') => {
            const lines = doc.splitTextToSize(String(text || ''), contentWidth);
            doc.setFont('helvetica', fontStyle);
            doc.setFontSize(fontSize);
            lines.forEach((line) => {
                addPageIfNeeded(lineHeight);
                doc.text(line, marginX, cursorY);
                cursorY += lineHeight;
            });
        };

        const writeSection = (title, bodyLines = []) => {
            addPageIfNeeded(40);
            doc.setDrawColor(29, 97, 114);
            doc.setLineWidth(1);
            doc.line(marginX, cursorY - 8, pageWidth - marginX, cursorY - 8);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text(title, marginX, cursorY);
            cursorY += 18;
            bodyLines.forEach((entry) => {
                writeWrapped(entry, 10, 'normal');
            });
            cursorY += 6;
        };

        doc.setTextColor(26, 26, 26);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('A2S Vastu Consultation Report', marginX, cursorY);
        cursorY += 24;
        writeWrapped(`Generated: ${new Date().toLocaleString()}`, 10, 'normal');
        writeWrapped(`Room Type: ${roomType} | Floor: ${floor || 'Not specified'} | Facing: ${detailedReport?.directional_snapshot?.facing || result?.auto_direction?.direction || 'N/A'} | Overall Score: ${result?.score ?? 'N/A'}/100`, 10, 'normal');

        writeSection('Executive Summary', [
            detailedReport.consultation_intro || '',
            detailedReport.confidence_note || '',
        ]);

        if ((detailedReport.directional_reasoning || []).length > 0) {
            writeSection('Directional Reasoning', detailedReport.directional_reasoning.map((item, idx) => `${idx + 1}. ${item}`));
        }

        writeSection('Category Scores', Object.entries(result?.category_scores || {}).map(([key, value]) => `- ${key}: ${value}/100`));

        if ((detailedReport.scoring_basis || []).length > 0) {
            const basisLines = [];
            detailedReport.scoring_basis.forEach((item) => {
                basisLines.push(`${String(item.category).replace(/_/g, ' ')} (${item.score}/100, ${item.band})`);
                basisLines.push(`Why: ${item.why_it_matters}`);
                basisLines.push(`Basis: ${item.assessment_basis}`);
                basisLines.push('');
            });
            writeSection('Astrological Basis Of Score', basisLines);
        }

        if ((detailedReport.category_diagnostics || []).length > 0) {
            const diagnosticLines = [];
            detailedReport.category_diagnostics.forEach((item) => {
                diagnosticLines.push(`${String(item.category).replace(/_/g, ' ')} | ${item.score}/100 | ${item.state}`);
                diagnosticLines.push(`Expert Read: ${item.expert_read}`);
                diagnosticLines.push(`Likely Manifestation: ${item.likely_manifestation}`);
                diagnosticLines.push(`Corrective Principle: ${item.corrective_principle}`);
                diagnosticLines.push('');
            });
            writeSection('Expert Category Diagnostics', diagnosticLines);
        }

        if ((detailedReport.potential_risks || []).length > 0) {
            const riskLines = [];
            detailedReport.potential_risks.forEach((item) => {
                riskLines.push(`${String(item.category).replace(/_/g, ' ')} | ${item.severity} risk`);
                riskLines.push(`Risk: ${item.risk}`);
                riskLines.push(`If ignored: ${item.if_ignored}`);
                riskLines.push('');
            });
            writeSection('Risk Outlook If Uncorrected', riskLines);
        }

        if ((detailedReport.placement_plan || []).length > 0) {
            const placementLines = [];
            detailedReport.placement_plan.forEach((item) => {
                placementLines.push(`Priority ${item.priority}: ${String(item.category).replace(/_/g, ' ')} (${item.current_score}/100)`);
                placementLines.push(`What to place: ${item.what_to_place}`);
                placementLines.push(`Where: ${item.where_to_place}`);
                placementLines.push(`How: ${item.placement_instruction}`);
                placementLines.push('');
            });
            writeSection('Placement Plan (Where To Put What)', placementLines);
        }

        if ((detailedReport.remedies || []).length > 0) {
            const remedyLines = [];
            detailedReport.remedies.forEach((item) => {
                remedyLines.push(`Priority ${item.priority}: ${item.title}`);
                remedyLines.push(`Action: ${item.action}`);
                remedyLines.push(`Timing: ${item.timing}`);
                remedyLines.push(`Impact: +${item.impact} points`);
                remedyLines.push(`Astro Note: ${item.astro_note}`);
                remedyLines.push('');
            });
            writeSection('Remedy Roadmap', remedyLines);
        }

        writeSection('Consultation Notes', (detailedReport.conversation || []).map((item, idx) => `${idx + 1}. ${item}`));

        doc.save(`A2S_Vastu_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="min-h-screen bg-main pb-24 transition-all duration-1000 relative overflow-hidden">
            <div className="ambient-orb ambient-orb-1 opacity-60" />
            <div className="ambient-orb ambient-orb-2 opacity-60" />

            <header className="relative overflow-hidden min-h-[78vh] flex items-end group">
                <div className="absolute inset-0">
                    <img
                        src="/gallery.png"
                        alt="Room interior backdrop"
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                    <div className="absolute inset-0 shadow-[inset_0_0_150px_40px_rgba(0,0,0,0.3)]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-[var(--color-main)] via-[var(--color-main)]/70 to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/20 to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-8 pb-24 w-full">
                    <div className="max-w-4xl lg:max-w-none">
                        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
                            <div className="w-16 h-px bg-accent shadow-[0_0_20px_rgba(29,97,114,0.8)]" />
                            <span className="text-[11px] font-black text-accent uppercase tracking-[0.7em] drop-shadow-2xl">The Unspoken</span>
                        </div>

                        <h1 className="font-serif text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-10 animate-fade-in-up drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]" style={{ animationDelay: '0.15s' }}>
                            <span className="font-light italic opacity-90">Where </span>
                            <span className="font-bold">Vastu</span>
                            <br />
                            <span className="text-gradient-gold not-italic drop-shadow-[0_2px_30px_rgba(29,97,114,0.5)] tracking-wide">Meets Precision...</span>
                        </h1>

                        <p className="text-base md:text-lg text-white/80 font-light leading-relaxed max-w-md italic animate-fade-in-up drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]" style={{ animationDelay: '0.35s' }}>
                            Upload your room photos, map the directions, and get a score that turns hidden spatial imbalance into clear next steps.
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 mt-[-4rem]">
                <div className="space-y-8">
                    <section className="rounded-3xl border border-premium bg-surface/95 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-accent font-black">A2S Vastu Score</p>
                                <h2 className="font-serif text-3xl md:text-4xl text-main italic font-black mt-2">Room Compliance Scanner</h2>
                                <p className="text-sm text-muted mt-3">{status.used || 0} of 3 scans used today</p>
                            </div>
                            <div className="flex gap-2 text-[11px] uppercase tracking-widest font-black flex-wrap">
                                <span className={`px-4 py-2 rounded-full border ${step === 'setup' ? 'bg-accent text-white border-accent' : 'border-premium text-muted'}`}>Setup</span>
                                <span className={`px-4 py-2 rounded-full border ${step === 'upload' ? 'bg-accent text-white border-accent' : 'border-premium text-muted'}`}>Upload</span>
                                <span className={`px-4 py-2 rounded-full border ${step === 'results' ? 'bg-accent text-white border-accent' : 'border-premium text-muted'}`}>Results</span>
                            </div>
                        </div>
                    </section>

                    {result?.auto_direction && (
                        <section className="rounded-3xl border border-accent/20 bg-accent/5 p-4 md:p-5">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Compass size={18} className="text-accent" />
                                <p className="text-sm text-main font-semibold">
                                    Directional review: <span className="font-black">{result.auto_direction.direction}</span>
                                </p>
                                {result.auto_direction.method && !isDirectionPreliminary && (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted">
                                        {String(result.auto_direction.method).replace(/-/g, ' ')}
                                    </span>
                                )}
                                {isDirectionPreliminary && (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-2 py-1 rounded-full">
                                        Direction to be confirmed by consultant
                                    </span>
                                )}
                            </div>
                            {result.auto_direction.reasoning && (
                                <p className="mt-2 text-xs text-muted">{result.auto_direction.reasoning}</p>
                            )}
                            {isDirectionPreliminary && !insufficientEvidence && (
                                <p className="mt-2 text-xs text-amber-800 font-semibold">
                                    For a final reading, upload a clearer doorway-angle photo or set the direction manually. The consultation can still continue from the visible layout cues.
                                </p>
                            )}
                        </section>
                    )}

                    {rateLimited ? (
                    <section className="rounded-3xl border border-red-300 bg-red-50 p-8 text-center">
                        <AlertTriangle className="mx-auto text-red-500 mb-4" size={32} />
                        <h2 className="text-2xl font-black text-red-700">Daily scans used</h2>
                        <p className="text-red-700 mt-3">You have used all 3 Vastu scans for today. Your scans refresh in {formatCountdown(status.reset_in_seconds)}.</p>
                    </section>
                ) : (
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-3xl border border-premium bg-surface p-6 space-y-5">
                            <h2 className="text-lg font-black text-main uppercase tracking-widest">1. Setup</h2>
                            <label className="block text-xs uppercase tracking-wider text-muted">Room Type</label>
                            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full p-3 rounded-xl border border-premium bg-white">
                                {ROOM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>

                            <label className="block text-xs uppercase tracking-wider text-muted">Facing Direction</label>
                            <select value={facingDirection} onChange={(e) => setFacingDirection(e.target.value)} className="w-full p-3 rounded-xl border border-premium bg-white">
                                {DIRECTIONS.map((dir) => <option key={dir} value={dir}>{dir}</option>)}
                            </select>

                            <label className="block text-xs uppercase tracking-wider text-muted">Floor Number (optional)</label>
                            <select value={floor} onChange={(e) => setFloor(e.target.value)} className="w-full p-3 rounded-xl border border-premium bg-white">
                                <option value="">Select floor</option>
                                {FLOORS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <p className="text-xs text-muted">Tip: Shoot from the doorway for best results.</p>
                        </div>

                        <div className="rounded-3xl border border-premium bg-surface p-6 space-y-5">
                            <h2 className="text-lg font-black text-main uppercase tracking-widest">2. Upload</h2>
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-accent/40 rounded-2xl p-8 text-center cursor-pointer hover:bg-accent/5 transition">
                                <Upload size={28} className="text-accent mb-3" />
                                <p className="text-sm font-semibold">Upload 1 to 3 room photos</p>
                                <p className="text-xs text-muted mt-1">JPG, PNG, HEIC (max 10MB each)</p>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
                            </label>
                            {filePreviews.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-xs uppercase tracking-wider text-muted font-black">Preview</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {filePreviews.map((preview, index) => (
                                            <figure
                                                key={preview.url}
                                                className={`overflow-hidden rounded-2xl border border-premium bg-white shadow-sm ${index === 0 ? 'sm:col-span-2' : ''}`}
                                            >
                                                <div className={`${index === 0 ? 'h-48' : 'h-32'}`}>
                                                    <img
                                                        src={preview.url}
                                                        alt={`Uploaded room preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <figcaption className="px-3 py-2 text-xs text-main truncate" title={preview.name}>
                                                    {preview.name}
                                                </figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <ul className="text-xs text-main space-y-1">
                                    {files.map((file) => <li key={file.name}>{file.name}</li>)}
                                </ul>
                            )}

                            <button onClick={runAnalysis} disabled={loading || files.length === 0} className="w-full py-3 rounded-xl bg-accent text-white font-black uppercase tracking-widest disabled:opacity-50">
                                {loading ? 'Analyzing...' : '3. Analyse'}
                            </button>

                            {loading && (
                                <div className="rounded-xl bg-main text-white p-4 flex items-center gap-3">
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span className="text-sm">{STATUS_COPY[statusCopyIndex]}</span>
                                </div>
                            )}

                            {error && <p className="text-sm text-red-600">{error}</p>}
                        </div>
                    </section>
                )}

                    {result && (
                    <section className="rounded-3xl border border-premium bg-surface p-6 md:p-8 space-y-8">
                        {/* ACCURACY & ASTROLOGICAL HEADER */}
                        {detailedReport?.directional_snapshot && (
                            <div className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                    <div className="text-center">
                                        <p className="text-xs uppercase tracking-[0.2em] font-black text-accent mb-2">{insufficientEvidence ? 'Evidence Status' : 'Directional Accuracy'}</p>
                                        <div className="text-3xl md:text-5xl font-black text-accent">{insufficientEvidence ? 'Preliminary' : `${Math.round((result.auto_direction?.confidence || 0) * 100)}%`}</div>
                                        <p className="text-xs text-muted mt-1">{insufficientEvidence ? 'Need wider room anchors for final verdict' : 'Confidence Score'}</p>
                                    </div>
                                    <div className="border-l-2 border-r-2 border-accent/20 px-6">
                                        <p className="text-xs uppercase tracking-widest font-black text-main mb-2">Facing Direction</p>
                                        <p className="text-3xl font-black text-accent">{detailedReport.directional_snapshot.facing}</p>
                                        <p className="text-xs text-muted mt-2">Guiding Element</p>
                                        <p className="text-sm font-black text-main capitalize mt-1">{detailedReport.directional_snapshot.element}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs uppercase tracking-widest font-black text-main mb-2">Astrological Focus</p>
                                        <p className="text-sm text-main leading-relaxed font-semibold">{detailedReport.directional_snapshot.focus}</p>
                                        <p className="text-[10px] text-accent uppercase tracking-widest font-black mt-3">Primary Life Domain</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {insufficientEvidence && (
                            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
                                <p className="text-sm font-black uppercase tracking-widest text-amber-800 mb-3">Consultation Mode: Preliminary Evidence</p>
                                <p className="text-sm text-amber-900 leading-relaxed mb-4">
                                    This scan has insufficient spatial anchors for a final-grade Vastu verdict. The notes below are directional guidance, not a locked compliance judgment.
                                </p>
                                <ul className="text-sm text-amber-900 space-y-2 list-disc pl-5">
                                    <li>Upload 2-3 photos from doorway and opposite corner</li>
                                    <li>Keep windows, entry threshold, and major furniture visible</li>
                                    <li>Prefer natural daylight with balanced exposure</li>
                                </ul>
                            </div>
                        )}

                        {/* VASTU SCORE GAUGE */}
                        {!insufficientEvidence && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="relative w-56 h-56">
                                    <svg width="224" height="224" className="-rotate-90">
                                        <circle cx="112" cy="112" r="90" stroke="#e5e7eb" strokeWidth="16" fill="none" />
                                        <circle
                                            cx="112"
                                            cy="112"
                                            r="90"
                                            stroke={meter.color}
                                            strokeWidth="16"
                                            strokeDasharray={2 * Math.PI * 90}
                                            strokeDashoffset={ringOffset(result.score)}
                                            strokeLinecap="round"
                                            fill="none"
                                            className="transition-all duration-[1500ms]"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-6xl font-black font-serif italic">{result.score}</span>
                                        <span className="text-sm uppercase tracking-widest font-black mt-2" style={{ color: meter.color }}>{meter.label}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted text-center max-w-sm">Spatial Harmony Score</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-black uppercase tracking-widest mb-6">Energy Assessment Breakdown</h3>
                                <div className="space-y-4">
                                    {categoryEntries.map(([key, value]) => {
                                        const labels = {
                                            'decor': 'Aesthetic Alignment',
                                            'elements': 'Element Balance',
                                            'entry': 'Entry Point Harmony',
                                            'furniture': 'Furniture Placement',
                                            'light': 'Natural Energy Flow'
                                        };
                                        return (
                                            <div key={key}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-black text-main">{labels[key] || key}</span>
                                                    <span className="text-sm font-black text-accent">{value}/100</span>
                                                </div>
                                                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${value}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>}

                        {/* DETAILED ASTROLOGICAL CONSULTATION */}
                        <div>
                            {detailedReport && (
                                <div className="space-y-6">
                                    {/* CONSULTATION INTRO */}
                                    <div className="rounded-2xl border-2 border-accent bg-accent/5 p-6 md:p-8">
                                        <p className="text-xs uppercase tracking-[0.2em] font-black text-accent mb-3">Vastu Consultation Report</p>
                                        <p className="text-lg text-main leading-relaxed mb-4">{detailedReport.consultation_intro}</p>
                                        <p className="text-xs text-muted italic">{detailedReport.confidence_note}</p>
                                    </div>

                                    {(detailedReport.directional_reasoning || []).length > 0 && (
                                        <div className="rounded-2xl border border-premium p-6 bg-white">
                                            <p className="text-sm font-black uppercase tracking-widest text-main mb-4">🧭 Directional Reasoning</p>
                                            <div className="space-y-2">
                                                {detailedReport.directional_reasoning.map((line, idx) => (
                                                    <p key={`${line}-${idx}`} className="text-sm text-main leading-relaxed">{line}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ASTROLOGICAL SCORING BASIS */}
                                    {(detailedReport.scoring_basis || []).length > 0 && (
                                        <div className="rounded-2xl border border-premium p-6 bg-white">
                                            <p className="text-sm font-black uppercase tracking-widest text-main mb-4">📚 Astrological Basis Of Score</p>
                                            <div className="space-y-4">
                                                {(detailedReport.scoring_basis || []).map((item, idx) => (
                                                    <div key={`${item.category}-${idx}`} className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                                                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                                            <p className="text-sm font-black text-main capitalize">{String(item.category || '').replace('_', ' ')}</p>
                                                            <span className="text-xs font-black uppercase tracking-wider text-accent">{item.score}/100 • {item.band}</span>
                                                        </div>
                                                        <p className="text-sm text-main leading-relaxed">{item.why_it_matters}</p>
                                                        <p className="text-xs text-muted mt-2">{item.assessment_basis}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(detailedReport.category_diagnostics || []).length > 0 && (
                                        <div className="rounded-2xl border border-premium p-6 bg-white">
                                            <p className="text-sm font-black uppercase tracking-widest text-main mb-4">🧠 Expert Category Diagnostics</p>
                                            <div className="space-y-4">
                                                {detailedReport.category_diagnostics.map((item, idx) => (
                                                    <div key={`${item.category}-${idx}`} className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                                            <p className="text-sm font-black text-main capitalize">{String(item.category || '').replace('_', ' ')}</p>
                                                            <span className="text-xs font-black uppercase tracking-wider text-accent">{item.score}/100 • {item.state}</span>
                                                        </div>
                                                        <p className="text-sm text-main leading-relaxed">{item.expert_read}</p>
                                                        <p className="text-xs text-muted mt-2">{item.likely_manifestation}</p>
                                                        <p className="text-xs text-main mt-2 font-semibold">{item.corrective_principle}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* DIRECTIONAL INFERENCE DETAILS */}
                                    {result.auto_direction?.signals && (
                                        <div className="rounded-2xl border border-premium p-6 bg-white space-y-4">
                                            <p className="text-sm font-black uppercase tracking-widest text-main">Direction Inference Analysis</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {result.auto_direction.signals.nim?.confidence > 0 && (
                                                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                        <p className="text-xs font-black uppercase tracking-wider text-blue-700 mb-2">Vision Intelligence (NIM)</p>
                                                        <p className="text-sm text-blue-900">{result.auto_direction.signals.nim.reasoning}</p>
                                                        <p className="text-xs text-blue-700 font-black mt-2">Confidence: {Math.round(result.auto_direction.signals.nim.confidence * 100)}%</p>
                                                    </div>
                                                )}
                                                {result.auto_direction.signals.exif?.confidence > 0 && (
                                                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                                        <p className="text-xs font-black uppercase tracking-wider text-green-700 mb-2">GPS Metadata</p>
                                                        <p className="text-sm text-green-900">{result.auto_direction.signals.exif.reasoning}</p>
                                                        <p className="text-xs text-green-700 font-black mt-2">Direction: {result.auto_direction.signals.exif.direction || 'N/A'}</p>
                                                    </div>
                                                )}
                                                {result.auto_direction.signals.cv?.confidence > 0 && (
                                                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                                                        <p className="text-xs font-black uppercase tracking-wider text-purple-700 mb-2">Visual Analysis</p>
                                                        <p className="text-sm text-purple-900">{result.auto_direction.signals.cv.reasoning}</p>
                                                        <p className="text-xs text-purple-700 font-black mt-2">Direction: {result.auto_direction.signals.cv.direction}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* STRENGTHS & CONCERNS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-white p-6">
                                            <p className="text-sm font-black uppercase tracking-widest text-emerald-700 mb-4">✨ Energetic Strengths</p>
                                            <div className="space-y-3">
                                                {(detailedReport.strengths || []).map((line, idx) => (
                                                    <p key={`${line}-${idx}`} className="text-sm text-emerald-900 leading-relaxed">{line}</p>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-white p-6">
                                            <p className="text-sm font-black uppercase tracking-widest text-amber-700 mb-4">⚠️ Priority Imbalances</p>
                                            <div className="space-y-3">
                                                {(detailedReport.concerns || []).map((line, idx) => (
                                                    <p key={`${line}-${idx}`} className="text-sm text-amber-900 leading-relaxed">{line}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* POTENTIAL RISK OUTLOOK */}
                                    {(detailedReport.potential_risks || []).length > 0 && (
                                        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-6">
                                            <p className="text-sm font-black uppercase tracking-widest text-rose-700 mb-4">⚠️ Risk Outlook If Uncorrected</p>
                                            <div className="space-y-4">
                                                {detailedReport.potential_risks.map((item, idx) => (
                                                    <div key={`${item.category}-${idx}`} className="rounded-xl border border-rose-200 bg-white p-4">
                                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                                            <p className="text-sm font-black text-main capitalize">{String(item.category || '').replace('_', ' ')}</p>
                                                            <span className="text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-black bg-rose-100 text-rose-700 border border-rose-200">{item.severity} risk</span>
                                                        </div>
                                                        <p className="text-sm text-main leading-relaxed">{item.risk}</p>
                                                        <p className="text-xs text-rose-800 mt-2 font-semibold">{item.if_ignored}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(detailedReport.placement_plan || []).length > 0 && (
                                        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6">
                                            <p className="text-sm font-black uppercase tracking-widest text-emerald-800 mb-4">📍 Placement Plan (Where To Put What)</p>
                                            <div className="space-y-4">
                                                {detailedReport.placement_plan.map((item, idx) => (
                                                    <div key={`${item.category}-${idx}`} className="rounded-xl border border-emerald-200 bg-white p-4">
                                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                                            <p className="text-sm font-black text-main capitalize">Priority {item.priority}: {String(item.category || '').replace('_', ' ')}</p>
                                                            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">{item.current_score}/100</span>
                                                        </div>
                                                        <p className="text-sm text-main"><span className="font-black">What:</span> {item.what_to_place}</p>
                                                        <p className="text-sm text-main mt-1"><span className="font-black">Where:</span> {item.where_to_place}</p>
                                                        <p className="text-sm text-main mt-1"><span className="font-black">How:</span> {item.placement_instruction}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* CONSULTANT DIALOGUE */}
                                    <div className="rounded-2xl border border-premium p-6 bg-white">
                                        <p className="text-sm font-black uppercase tracking-widest text-main mb-4">📋 Detailed Consultation Notes</p>
                                        <div className="space-y-3 text-sm text-main leading-relaxed">
                                            {(detailedReport.conversation || []).map((line, idx) => (
                                                <p key={`${line}-${idx}`} className="border-l-4 border-accent pl-4 py-1">{line}</p>
                                            ))}
                                        </div>
                                    </div>

                                    {false && diagnosticsEntries.length > 0 && null}

                                    {/* REMEDY ROADMAP */}
                                    {(detailedReport.remedies || []).length > 0 && (
                                        <div className="rounded-2xl border-2 border-accent/40 bg-white p-6 space-y-4">
                                            <p className="text-sm font-black uppercase tracking-widest text-main mb-4">🎯 Remedy Roadmap & Timeline</p>
                                            <div className="space-y-4">
                                                {detailedReport.remedies.map((item, idx) => (
                                                    <div key={`${item.priority}-${item.title}`} className="rounded-xl border-l-4 border-accent bg-gradient-to-r from-accent/5 to-transparent p-4">
                                                        <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                                                            <div>
                                                                <p className="text-sm font-black text-main">Priority {item.priority}: {item.title}</p>
                                                            </div>
                                                            <span className="text-[10px] uppercase tracking-widest font-black text-accent bg-accent/10 px-2 py-1 rounded">{item.timing}</span>
                                                        </div>
                                                        <p className="text-sm text-main leading-relaxed mb-3">{item.action}</p>
                                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                                            <span className="text-xs text-emerald-700 font-black">📈 +{item.impact} points potential</span>
                                                            <span className="text-xs text-accent italic">{item.astro_note}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {false && (detailedReport.correction_protocol || []).length > 0 && null}
                                </div>
                            )}

                            {!insufficientEvidence && <h3 className="text-lg font-black uppercase tracking-widest mb-4">Suggestions</h3>}
                            {!insufficientEvidence && <div className="space-y-3">
                                {(result.suggestions || []).slice(0, 5).map((s, idx) => (
                                    <details key={`${s.issue}-${idx}`} className="rounded-xl border border-premium p-4 bg-white">
                                        <summary className="cursor-pointer font-semibold text-main flex items-center gap-2">
                                            <CheckCircle2 size={14} className="text-accent" /> {s.issue}
                                        </summary>
                                        <p className="text-sm text-muted mt-2">{s.fix}</p>
                                        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                                            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">+{s.score_impact} points if fixed</span>
                                            <button onClick={() => openCatalog(s.catalog_filter)} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent">
                                                Catalog link <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </details>
                                ))}
                            </div>}
                        </div>

                        {!insufficientEvidence && (
                            <div className="rounded-2xl border border-premium p-4 bg-white/70">
                                <p className="text-sm text-main leading-relaxed">{result.summary}</p>
                            </div>
                        )}

                        <button
                            onClick={downloadReport}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-main text-main font-black uppercase tracking-wider bg-white"
                        >
                            Download Full Report <Download size={16} />
                        </button>

                        {!insufficientEvidence && <button
                            onClick={() => openCatalog((result.suggestions || [])[0]?.catalog_filter || '')}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-main text-white font-black uppercase tracking-wider"
                        >
                            View Catalog Suggestions <ArrowRight size={16} />
                        </button>}
                    </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VastuScore;
