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
    const [panX, setPanX] = useState(0);            // -180..180 degrees of pan
    const [zoom, setZoom] = useState(1);
    const [lighting, setLighting] = useState('warm');  // warm | day | dusk
    const dragRef = useRef({ active: false, startX: 0, startPan: 0 });

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const onMouseDown = (e) => {
        dragRef.current = { active: true, startX: e.clientX, startPan: panX };
    };
    const onMouseMove = (e) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.startX;
        const newPan = dragRef.current.startPan + dx * 0.4;
        setPanX(Math.max(-90, Math.min(90, newPan)));
    };
    const onMouseUp = () => { dragRef.current.active = false; };
    const onWheel = (e) => {
        e.preventDefault();
        setZoom((z) => Math.max(0.85, Math.min(1.6, z - e.deltaY * 0.0008)));
    };

    const onTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        dragRef.current = { active: true, startX: e.touches[0].clientX, startPan: panX };
    };
    const onTouchMove = (e) => {
        if (!dragRef.current.active || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - dragRef.current.startX;
        setPanX(Math.max(-90, Math.min(90, dragRef.current.startPan + dx * 0.4)));
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
                {/* Cylindrical room — rotates with pan */}
                <div
                    className="absolute inset-0"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `translate3d(${panX * -4}px, 0, ${(zoom - 1) * 200}px) rotateY(${panX * 0.55}deg)`,
                        transition: dragRef.current.active ? 'none' : 'transform 320ms cubic-bezier(.2,.8,.2,1)',
                        willChange: 'transform',
                    }}
                >
                    <img
                        src={imageSrc}
                        alt={label}
                        draggable={false}
                        className="block w-full h-full object-cover"
                        style={{
                            transform: `scale(${zoom * 1.15})`,
                            transformOrigin: `${50 + panX * 0.4}% 50%`,
                            filter: lightingFilter,
                            transition: 'filter 600ms ease',
                        }}
                    />
                    {/* Edge vignettes for depth illusion */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(10,17,22,0.65) 100%)',
                        }}
                    />
                    {/* Floor highlight that pans at 1.2x for parallax */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            bottom: 0, left: 0, right: 0, height: '30%',
                            background: 'linear-gradient(180deg, transparent, rgba(184,118,61,0.18))',
                            transform: `translateX(${panX * -1.2}px)`,
                            transition: dragRef.current.active ? 'none' : 'transform 320ms cubic-bezier(.2,.8,.2,1)',
                        }}
                    />
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
