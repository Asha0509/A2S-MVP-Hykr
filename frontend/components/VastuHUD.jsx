import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, AlertTriangle, ChevronRight, Award, RefreshCw, Sparkles } from 'lucide-react';

/**
 * Live Vastu HUD overlay component.
 *
 * Renders the user's room photo into a Canvas and draws compass + per-object
 * Vastu violation markers DIRECTLY on the photo. This is the A2S USP no other
 * Indian PropTech tool ships — Magicbricks does Vastu quizzes, pure Vastu apps
 * are text-only, A2S annotates the buyer's actual room.
 *
 * Props:
 *   image: File | string (data URL or blob URL)
 *   overlay: result from /api/vastu/overlay (see vastu_overlay.py docstring)
 *   onChangeFacing(direction): callback when buyer rotates the compass
 *   loading: bool
 *
 * The overlay is a pure client-side Canvas render — no server-side image
 * manipulation, no extra Cloudflare neuron cost beyond the initial analysis.
 */

const ZONE_COORDS = {
    'top-left':       { x: 0.18, y: 0.20 },
    'top-center':     { x: 0.50, y: 0.18 },
    'top-right':      { x: 0.82, y: 0.20 },
    'middle-left':    { x: 0.18, y: 0.50 },
    'centre':         { x: 0.50, y: 0.50 },
    'middle-right':   { x: 0.82, y: 0.50 },
    'bottom-left':    { x: 0.18, y: 0.82 },
    'bottom-center':  { x: 0.50, y: 0.85 },
    'bottom-right':   { x: 0.82, y: 0.82 },
};

const SEVERITY_COLOR = {
    high:   { fill: '#dc2626', stroke: '#7f1d1d', glow: 'rgba(220,38,38,0.5)'  },
    medium: { fill: '#f59e0b', stroke: '#92400e', glow: 'rgba(245,158,11,0.5)' },
    low:    { fill: '#16a34a', stroke: '#14532d', glow: 'rgba(22,163,74,0.4)'  },
};

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const DIRECTION_ANGLE = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

const bandColor = (band) => {
    switch ((band || '').toLowerCase()) {
        case 'excellent vastu':  return '#B8763D';
        case 'good':             return '#16a34a';
        case 'needs work':       return '#f59e0b';
        case 'poor':             return '#dc2626';
        default:                 return '#9CA3AF';
    }
};

const VastuHUD = ({ imageSrc, overlay, loading, onChangeFacing }) => {
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const [hoveredViolation, setHoveredViolation] = useState(null);
    const [imgEl, setImgEl] = useState(null);
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
    const [resizeTick, setResizeTick] = useState(0);

    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => setImgEl(img);
        img.src = imageSrc;
    }, [imageSrc]);

    // Re-render the canvas when the container width changes (rotate, resize,
    // mobile orientation flip). Throttled via requestAnimationFrame.
    useEffect(() => {
        let raf = null;
        const handle = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setResizeTick((t) => t + 1));
        };
        window.addEventListener('resize', handle);
        return () => {
            window.removeEventListener('resize', handle);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    useEffect(() => {
        if (!imgEl || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const containerWidth = wrapRef.current?.clientWidth || imgEl.width;
        const scale = containerWidth / imgEl.width;
        const w = imgEl.width * scale;
        const h = imgEl.height * scale;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        setDimensions({ w, h });

        // 1. base photo with subtle dim
        ctx.drawImage(imgEl, 0, 0, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, w, h);

        if (!overlay?.violations?.length) return;

        // 2. violation markers
        overlay.violations.forEach((v, i) => {
            const zoneKey = (v.zone || 'centre').toLowerCase().replace('center', 'centre');
            const z = ZONE_COORDS[zoneKey] || ZONE_COORDS.centre;
            const cx = z.x * w;
            const cy = z.y * h;
            const color = SEVERITY_COLOR[v.severity] || SEVERITY_COLOR.medium;

            // glow
            ctx.beginPath();
            ctx.arc(cx, cy, 38, 0, Math.PI * 2);
            ctx.fillStyle = color.glow;
            ctx.fill();

            // pin circle
            ctx.beginPath();
            ctx.arc(cx, cy, 22, 0, Math.PI * 2);
            ctx.fillStyle = color.fill;
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();

            // pin number
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), cx, cy);

            // direction hint arrow (if present)
            if (v.direction_hint && DIRECTION_ANGLE[v.direction_hint] != null) {
                const angle = (DIRECTION_ANGLE[v.direction_hint] - 90) * (Math.PI / 180);
                const ax = cx + Math.cos(angle) * 50;
                const ay = cy + Math.sin(angle) * 50;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(ax, ay);
                ctx.lineWidth = 3;
                ctx.strokeStyle = color.fill;
                ctx.stroke();
                // arrowhead
                const a1 = angle + 2.5;
                const a2 = angle - 2.5;
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax - Math.cos(a1) * 10, ay - Math.sin(a1) * 10);
                ctx.lineTo(ax - Math.cos(a2) * 10, ay - Math.sin(a2) * 10);
                ctx.closePath();
                ctx.fillStyle = color.fill;
                ctx.fill();
                // direction letter
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = color.stroke;
                ctx.lineWidth = 2;
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.strokeText(v.direction_hint, ax + 8, ay + 5);
                ctx.fillText(v.direction_hint, ax + 8, ay + 5);
            }
        });

        // 3. compass top-right
        drawCompass(ctx, w - 70, 70, overlay.facing || 'N');
    }, [imgEl, overlay, dimensions.w, resizeTick]);

    const drawCompass = (ctx, cx, cy, facing) => {
        const radius = 40;
        // base
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15,27,34,0.85)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#B8763D';
        ctx.lineWidth = 2;
        ctx.stroke();
        // N marker
        ctx.fillStyle = '#B8763D';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('N', cx, cy - radius + 12);
        ctx.fillStyle = 'rgba(244,235,221,0.6)';
        ctx.fillText('S', cx, cy + radius - 4);
        ctx.fillText('W', cx - radius + 8, cy + 4);
        ctx.fillText('E', cx + radius - 8, cy + 4);
        // facing arrow
        const angle = (DIRECTION_ANGLE[facing] - 90) * (Math.PI / 180);
        const tipX = cx + Math.cos(angle) * (radius - 8);
        const tipY = cy + Math.sin(angle) * (radius - 8);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tipX, tipY);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#B8763D';
        ctx.stroke();
        // tip
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#B8763D';
        ctx.fill();
        // label
        ctx.fillStyle = '#F4EBDD';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`FACES ${facing}`, cx, cy + radius + 16);
    };

    const violations = overlay?.violations || [];
    const score = overlay?.score ?? null;
    const band = overlay?.band || '';

    const ScoreBadge = useMemo(() => () => (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white font-semibold text-xs shadow-md"
            style={{ backgroundColor: bandColor(band) }}
        >
            <Award size={13} />
            Vastu {score ?? '—'} · {band || 'Analysing…'}
        </div>
    ), [score, band]);

    return (
        <div className="space-y-4">
            {/* Top bar: score + facing selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ScoreBadge />
                <div className="flex items-center gap-1 rounded-lg bg-surface border border-premium p-1 w-full sm:w-auto overflow-x-auto">
                    <span className="text-[10px] text-muted uppercase tracking-wider px-2 font-semibold shrink-0">Faces</span>
                    {DIRECTIONS.map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => onChangeFacing && onChangeFacing(d)}
                            className={`text-[11px] font-bold px-2 py-1 rounded transition shrink-0 ${
                                overlay?.facing === d ? 'text-on-accent' : 'text-muted hover:text-main'
                            }`}
                            style={{
                                backgroundColor: overlay?.facing === d ? 'var(--accent)' : 'transparent',
                            }}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* Canvas-rendered photo with overlays */}
            <div ref={wrapRef} className="relative rounded-2xl overflow-hidden bg-black min-h-[220px] sm:min-h-[320px]">
                <canvas ref={canvasRef} className="block w-full" />
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-white">
                        <RefreshCw size={28} className="animate-spin mb-3" />
                        <p className="font-semibold">Running Vastu analysis…</p>
                        <p className="text-xs opacity-70 mt-1">Identifying objects · scoring against 100-point Vastu rule engine</p>
                    </div>
                )}
                {!loading && !overlay && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm italic">
                        Upload a room photo and pick a facing direction to start.
                    </div>
                )}
            </div>

            {/* Summary + violations list */}
            {overlay && (
                <div className="space-y-3">
                    {overlay.summary && (
                        <div className="rounded-xl bg-surface border border-premium p-4 flex items-start gap-3">
                            <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
                            <p className="text-sm text-main leading-relaxed">{overlay.summary}</p>
                        </div>
                    )}

                    {violations.length > 0 && (
                        <div className="space-y-2">
                            {violations.map((v, i) => {
                                const color = SEVERITY_COLOR[v.severity] || SEVERITY_COLOR.medium;
                                const expanded = hoveredViolation === i;
                                return (
                                    <button
                                        key={i}
                                        onMouseEnter={() => setHoveredViolation(i)}
                                        onMouseLeave={() => setHoveredViolation(null)}
                                        onClick={() => setHoveredViolation(expanded ? null : i)}
                                        className="w-full text-left rounded-xl bg-surface border border-premium p-3 hover:border-accent transition flex items-start gap-3"
                                    >
                                        <span
                                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                            style={{ backgroundColor: color.fill }}
                                        >
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: color.fill }}>
                                                    {v.severity}
                                                </span>
                                                <span className="text-xs text-muted">·</span>
                                                <span className="text-xs text-muted">{v.zone}</span>
                                                {v.direction_hint && (
                                                    <>
                                                        <span className="text-xs text-muted">·</span>
                                                        <span className="text-xs text-accent font-semibold">{v.direction_hint}</span>
                                                    </>
                                                )}
                                            </div>
                                            <p className="font-semibold text-main text-sm mt-0.5">{v.issue}</p>
                                            <p className="text-xs text-muted mt-1 leading-relaxed">
                                                <span className="text-accent font-semibold">Fix:</span> {v.fix}
                                            </p>
                                        </div>
                                        <ChevronRight
                                            size={16}
                                            className="text-muted shrink-0 mt-1 transition"
                                            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VastuHUD;
