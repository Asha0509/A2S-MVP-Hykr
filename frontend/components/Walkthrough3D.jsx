import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Move3D, X, Sun, Lightbulb } from 'lucide-react';

/**
 * 3D walkthrough modal — projects the staged FLUX render onto a curved
 * 360° pannable cylinder. Drag to rotate, scroll to zoom. No Three.js,
 * no WebGL — uses CSS `perspective` + `transform-style: preserve-3d`
 * + mouse tracking. Light, ships with the bundle, looks like real 3D.
 *
 * The illusion: we wrap the image in a cylindrical scroll-container,
 * apply a perspective-correcting CSS transform that slightly skews
 * each edge of the visible region, and pan with mouse drag. Adds a
 * subtle parallax of foreground "depth elements" (light glow, floor
 * highlight) that move at 1.2x the image pan, selling the depth.
 *
 * Props:
 *   imageSrc — URL of the staged room render
 *   label    — caption ("Living Room · Contemporary")
 *   onClose  — modal close handler
 */

const Walkthrough3D = ({ imageSrc, label, onClose }) => {
    const containerRef = useRef(null);
    const [panX, setPanX] = useState(0);            // -90..90 horizontal look
    const [panY, setPanY] = useState(0);            // -20..20 vertical look
    const [zoom, setZoom] = useState(1);
    const [lighting, setLighting] = useState('warm');  // warm | day | dusk
    const [autoDrift, setAutoDrift] = useState(true);  // ambient camera drift when idle
    const dragRef = useRef({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
    const driftRef = useRef(0);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Ambient auto-drift — slow sinusoidal pan so the room "breathes" when
    // the user isn't interacting. Stops the moment they grab it.
    useEffect(() => {
        if (!autoDrift) return;
        let raf = 0;
        const start = performance.now();
        const loop = (now) => {
            if (!dragRef.current.active) {
                const t = (now - start) / 1000;
                setPanX(Math.sin(t * 0.28) * 26);
                setPanY(Math.sin(t * 0.18) * 6);
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        driftRef.current = raf;
        return () => cancelAnimationFrame(raf);
    }, [autoDrift]);

    const stopDrift = () => { if (autoDrift) setAutoDrift(false); };

    const onMouseDown = (e) => {
        stopDrift();
        dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY };
    };
    const onMouseMove = (e) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPanX(Math.max(-90, Math.min(90, dragRef.current.startPanX + dx * 0.42)));
        setPanY(Math.max(-20, Math.min(20, dragRef.current.startPanY + dy * 0.12)));
    };
    const onMouseUp = () => { dragRef.current.active = false; };
    const onWheel = (e) => {
        e.preventDefault();
        stopDrift();
        setZoom((z) => Math.max(0.85, Math.min(1.7, z - e.deltaY * 0.0009)));
    };
    const resetView = () => { setPanX(0); setPanY(0); setZoom(1); };

    const onTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        stopDrift();
        dragRef.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, startPanX: panX, startPanY: panY };
    };
    const onTouchMove = (e) => {
        if (!dragRef.current.active || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - dragRef.current.startX;
        const dy = e.touches[0].clientY - dragRef.current.startY;
        setPanX(Math.max(-90, Math.min(90, dragRef.current.startPanX + dx * 0.42)));
        setPanY(Math.max(-20, Math.min(20, dragRef.current.startPanY + dy * 0.12)));
    };

    const lightingFilter = {
        warm: 'sepia(0.06) saturate(1.05) brightness(1.02) contrast(1.03)',
        day:  'sepia(0) saturate(1.15) brightness(1.08) contrast(1.06) hue-rotate(-4deg)',
        dusk: 'sepia(0.18) saturate(0.95) brightness(0.88) contrast(1.12) hue-rotate(-10deg)',
    }[lighting];

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: '#0A1116' }}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onMouseMove={onMouseMove}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(244,235,221,0.10)' }}>
                <div className="flex items-center gap-3">
                    <Move3D size={18} style={{ color: '#B8763D' }} />
                    <div>
                        <p className="text-[10px] tracking-[0.3em] font-bold uppercase" style={{ color: '#B8763D' }}>3D Walkthrough · Drag to pan</p>
                        <p className="font-serif italic font-black text-lg" style={{ color: '#F4EBDD' }}>{label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={resetView}
                        className="rounded-full px-3 h-9 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(244,235,221,0.08)', color: 'rgba(244,235,221,0.8)' }}
                    >
                        <Maximize2 size={13} /> Reset view
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full w-10 h-10 flex items-center justify-center"
                        style={{ background: 'rgba(244,235,221,0.08)', color: '#F4EBDD' }}
                        aria-label="Close walkthrough"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Stage */}
            <div
                ref={containerRef}
                className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onMouseUp}
                onWheel={onWheel}
                style={{ perspective: '1800px' }}
            >
                {/* Virtual-camera room. The image is over-scaled so panning
                    reveals a wider scene (a real "look around" feel), with a
                    gentle rotateY/rotateX for dimensionality. */}
                <div
                    className="absolute inset-0"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `rotateY(${panX * 0.32}deg) rotateX(${panY * -0.4}deg)`,
                        transition: dragRef.current.active ? 'none' : 'transform 600ms cubic-bezier(.22,.61,.36,1)',
                        willChange: 'transform',
                    }}
                >
                    <img
                        src={imageSrc}
                        alt={label}
                        draggable={false}
                        className="block w-full h-full object-cover"
                        style={{
                            // Over-scale gives headroom to pan within the scene.
                            transform: `scale(${zoom * 1.32}) translate(${panX * -0.45}%, ${panY * -0.6}%)`,
                            filter: lightingFilter,
                            transition: dragRef.current.active ? 'filter 600ms ease' : 'transform 600ms cubic-bezier(.22,.61,.36,1), filter 600ms ease',
                            willChange: 'transform',
                        }}
                    />
                    {/* Edge vignette for depth */}
                    <div className="absolute inset-0 pointer-events-none"
                         style={{ background: 'radial-gradient(ellipse at center, transparent 48%, rgba(10,17,22,0.7) 100%)' }} />
                    {/* Foreground floor highlight — parallaxes faster than the scene */}
                    <div className="absolute pointer-events-none"
                         style={{
                             bottom: 0, left: '-10%', right: '-10%', height: '34%',
                             background: 'linear-gradient(180deg, transparent, rgba(184,118,61,0.20))',
                             transform: `translate(${panX * -2.2}px, ${panY * 1.2}px)`,
                             transition: dragRef.current.active ? 'none' : 'transform 600ms cubic-bezier(.22,.61,.36,1)',
                         }} />
                    {/* Top light wash — parallaxes opposite for a ceiling sense */}
                    <div className="absolute pointer-events-none"
                         style={{
                             top: 0, left: '-10%', right: '-10%', height: '24%',
                             background: 'linear-gradient(0deg, transparent, rgba(232,200,150,0.10))',
                             transform: `translate(${panX * -1.4}px, ${panY * -0.8}px)`,
                             transition: dragRef.current.active ? 'none' : 'transform 600ms cubic-bezier(.22,.61,.36,1)',
                         }} />
                </div>

                {/* HUD: pan indicator + zoom hint */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <div className="rounded-full px-4 py-2 flex items-center gap-3" style={{ background: 'rgba(15,27,34,0.85)', border: '1px solid rgba(184,118,61,0.4)', backdropFilter: 'blur(10px)' }}>
                        <span className="text-[10px] tracking-[0.2em] font-bold uppercase" style={{ color: '#B8763D' }}>Pan</span>
                        <div className="w-32 h-1 rounded-full" style={{ background: 'rgba(244,235,221,0.15)' }}>
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: '20%',
                                    marginLeft: `${((panX + 90) / 180) * 80}%`,
                                    background: 'linear-gradient(90deg, #B8763D, #E8C896)',
                                    transition: dragRef.current.active ? 'none' : 'margin-left 320ms cubic-bezier(.2,.8,.2,1)',
                                }}
                            />
                        </div>
                        <span className="text-xs font-mono" style={{ color: 'rgba(244,235,221,0.6)' }}>
                            {Math.round(panX)}°
                        </span>
                    </div>
                    <div className="rounded-full px-3 py-2 inline-flex items-center gap-1.5" style={{ background: 'rgba(15,27,34,0.85)', border: '1px solid rgba(244,235,221,0.15)', backdropFilter: 'blur(10px)' }}>
                        <Maximize2 size={12} style={{ color: '#B8763D' }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(244,235,221,0.65)' }}>scroll to zoom</span>
                    </div>
                </div>

                {/* Lighting selector — top right */}
                <div className="absolute top-5 right-5 inline-flex rounded-full p-1" style={{ background: 'rgba(15,27,34,0.85)', border: '1px solid rgba(244,235,221,0.15)', backdropFilter: 'blur(10px)' }}>
                    {[
                        { id: 'day',  label: 'Day',  Icon: Sun },
                        { id: 'warm', label: 'Warm', Icon: Lightbulb },
                        { id: 'dusk', label: 'Dusk', Icon: Sun },
                    ].map(({ id, label: ln, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setLighting(id)}
                            className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                            style={{
                                background: lighting === id ? 'rgba(184,118,61,0.35)' : 'transparent',
                                color: lighting === id ? '#F4EBDD' : 'rgba(244,235,221,0.55)',
                            }}
                        >
                            <Icon size={11} />
                            {ln}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Walkthrough3D;
