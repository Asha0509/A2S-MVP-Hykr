import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, TrendingUp, Users } from 'lucide-react';

/**
 * Animated India demand heatmap.
 *
 * Pure SVG India outline (simplified, 8 anchor points) with pulsing
 * city markers showing waitlist density. The 7,200 total = sum of the
 * city counts below. Hover any marker to highlight + show the count.
 *
 * This sells the distribution story visually: "Your buyers are already
 * waiting for you in these cities — you just haven't met them yet."
 */

const CITIES = [
    { name: 'Mumbai',     count: 1820, x: 280, y: 540 },
    { name: 'Bengaluru',  count: 1520, x: 415, y: 690 },
    { name: 'Pune',       count:  980, x: 325, y: 555 },
    { name: 'Hyderabad',  count: 1180, x: 420, y: 605 },
    { name: 'Chennai',    count:  820, x: 470, y: 720 },
    { name: 'Delhi NCR',  count:  500, x: 405, y: 230 },
    { name: 'Kolkata',    count:  220, x: 600, y: 410 },
    { name: 'Ahmedabad',  count:  160, x: 285, y: 410 },
];

const DemandHeatmap = ({ totalSignups = 7200 }) => {
    const [hovered, setHovered] = useState(null);
    const [activeIdx, setActiveIdx] = useState(0);

    // auto-cycle highlighted city every 2.5s so the demo recording shows motion
    useEffect(() => {
        if (hovered != null) return;
        const id = setInterval(() => {
            setActiveIdx((i) => (i + 1) % CITIES.length);
        }, 2500);
        return () => clearInterval(id);
    }, [hovered]);

    const focused = hovered != null ? hovered : activeIdx;
    const focusedCity = CITIES[focused];

    const sorted = useMemo(() => [...CITIES].sort((a, b) => b.count - a.count), []);
    const topCount = sorted[0].count;

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0F1B22 0%, #142733 100%)', border: '1px solid rgba(184,118,61,0.30)' }}
        >
            <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: '#B8763D' }}>
                        Live demand map · India · last 18 months
                    </p>
                    <p className="font-serif italic font-black text-2xl mt-1" style={{ color: '#F4EBDD' }}>
                        {totalSignups.toLocaleString('en-IN')} buyers waiting for a builder.
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(244,235,221,0.6)' }}>
                        Stack starts in <span style={{ color: '#B8763D', fontWeight: 700 }}>{focusedCity.name}</span> —
                        {' '}{focusedCity.count.toLocaleString('en-IN')} pre-registered buyers ready for your project.
                    </p>
                </div>
                <div
                    className="rounded-xl px-3 py-2 text-center"
                    style={{ background: 'rgba(184,118,61,0.15)', border: '1px solid rgba(184,118,61,0.40)' }}
                >
                    <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: '#B8763D' }}>
                        <TrendingUp size={10} /> growing
                    </div>
                    <p className="font-serif font-black text-lg" style={{ color: '#F4EBDD' }}>+18%</p>
                    <p className="text-[9px]" style={{ color: 'rgba(244,235,221,0.55)' }}>week / week</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-0 px-5 pb-5">
                {/* SVG India map */}
                <div className="lg:col-span-3 relative">
                    <svg viewBox="0 0 800 900" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <radialGradient id="dh-glow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%"   stopColor="#B8763D" stopOpacity="0.55" />
                                <stop offset="60%"  stopColor="#B8763D" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#B8763D" stopOpacity="0" />
                            </radialGradient>
                            <linearGradient id="dh-land" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"   stopColor="rgba(244,235,221,0.06)" />
                                <stop offset="100%" stopColor="rgba(244,235,221,0.02)" />
                            </linearGradient>
                        </defs>

                        {/* Simplified India outline — anchor points hand-picked for the rough silhouette */}
                        <path
                            d="
                                M 400 80
                                L 470 90
                                L 540 130
                                L 605 175
                                L 645 230
                                L 670 290
                                L 695 330
                                L 720 410
                                L 700 470
                                L 695 540
                                L 660 605
                                L 635 660
                                L 585 720
                                L 540 770
                                L 480 805
                                L 430 770
                                L 405 730
                                L 395 680
                                L 360 640
                                L 320 600
                                L 295 555
                                L 270 510
                                L 255 460
                                L 245 400
                                L 235 340
                                L 225 290
                                L 235 230
                                L 280 195
                                L 330 165
                                L 365 130
                                Z
                            "
                            fill="url(#dh-land)"
                            stroke="rgba(244,235,221,0.18)"
                            strokeWidth="1.2"
                        />

                        {/* City markers */}
                        {CITIES.map((c, i) => {
                            const radius = 6 + (c.count / topCount) * 14;
                            const isFocus = i === focused;
                            return (
                                <g key={c.name}
                                   onMouseEnter={() => setHovered(i)}
                                   onMouseLeave={() => setHovered(null)}
                                   style={{ cursor: 'pointer' }}>
                                    {/* Soft glow halo */}
                                    <circle cx={c.x} cy={c.y} r={radius + 28} fill="url(#dh-glow)" opacity={isFocus ? 1 : 0.45} />
                                    {/* Pulsing outer ring */}
                                    {isFocus && (
                                        <circle cx={c.x} cy={c.y} r={radius + 8} fill="none" stroke="#B8763D" strokeWidth="1.5">
                                            <animate attributeName="r" from={radius + 4} to={radius + 22} dur="1.8s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
                                        </circle>
                                    )}
                                    {/* Core dot */}
                                    <circle
                                        cx={c.x} cy={c.y} r={radius}
                                        fill={isFocus ? '#B8763D' : 'rgba(184,118,61,0.85)'}
                                        stroke={isFocus ? '#F4EBDD' : 'rgba(244,235,221,0.45)'}
                                        strokeWidth={isFocus ? 2 : 1}
                                    />
                                    {/* Label */}
                                    <text
                                        x={c.x + radius + 8}
                                        y={c.y + 4}
                                        fontSize={isFocus ? 18 : 14}
                                        fontFamily="Inter, sans-serif"
                                        fontWeight={isFocus ? 700 : 500}
                                        fill={isFocus ? '#F4EBDD' : 'rgba(244,235,221,0.6)'}
                                    >
                                        {c.name}
                                    </text>
                                    {isFocus && (
                                        <text
                                            x={c.x + radius + 8}
                                            y={c.y + 24}
                                            fontSize="13"
                                            fontFamily="Inter, sans-serif"
                                            fontWeight="700"
                                            fill="#B8763D"
                                        >
                                            {c.count.toLocaleString('en-IN')} buyers
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Rank list */}
                <div className="lg:col-span-2 lg:pl-6 lg:border-l" style={{ borderColor: 'rgba(244,235,221,0.08)' }}>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-3" style={{ color: 'rgba(244,235,221,0.55)' }}>
                        Ranked by waitlist size
                    </p>
                    <ul className="space-y-1.5">
                        {sorted.map((c) => {
                            const idx = CITIES.findIndex((x) => x.name === c.name);
                            const isFocus = idx === focused;
                            const pct = (c.count / topCount) * 100;
                            return (
                                <li
                                    key={c.name}
                                    onMouseEnter={() => setHovered(idx)}
                                    onMouseLeave={() => setHovered(null)}
                                    className="relative rounded-lg px-3 py-2 cursor-pointer transition"
                                    style={{
                                        background: isFocus ? 'rgba(184,118,61,0.18)' : 'rgba(244,235,221,0.03)',
                                        border: isFocus ? '1px solid rgba(184,118,61,0.45)' : '1px solid rgba(244,235,221,0.06)',
                                    }}
                                >
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold" style={{ color: isFocus ? '#F4EBDD' : 'rgba(244,235,221,0.85)' }}>
                                            <MapPin size={11} className="inline mr-1" style={{ color: '#B8763D' }} />
                                            {c.name}
                                        </span>
                                        <span className="font-mono font-bold" style={{ color: isFocus ? '#B8763D' : 'rgba(244,235,221,0.7)' }}>
                                            {c.count.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(244,235,221,0.06)' }}>
                                        <div
                                            className="h-full transition-all duration-500"
                                            style={{
                                                width: `${pct}%`,
                                                background: 'linear-gradient(90deg, #B8763D, #E8C896)',
                                            }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div
                        className="mt-4 rounded-xl px-3 py-3 inline-flex items-start gap-2"
                        style={{ background: 'rgba(244,235,221,0.04)', border: '1px solid rgba(244,235,221,0.10)' }}
                    >
                        <Users size={14} style={{ color: '#B8763D' }} className="mt-0.5 shrink-0" />
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(244,235,221,0.75)' }}>
                            <span style={{ color: '#F4EBDD', fontWeight: 700 }}>2,736 of these (38%)</span> have completed style profiles and are beta-ready —
                            we can match them to your projects within 14 days of going live.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemandHeatmap;
