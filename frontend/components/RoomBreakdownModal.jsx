import React, { useMemo, useState } from 'react';
import {
    X, IndianRupee, Award, Check, Repeat, Sparkles, Tag, Info, Palette,
} from 'lucide-react';
import { ROOM_BREAKDOWN, COLOR_PRESETS } from '../data/roomBreakdown';

/**
 * Room drill-down modal — the on-screen proof that an A2S render is a
 * structured, priced, swappable bill-of-materials, not a flat JPEG.
 *
 * Left: the room render with a live colour-wash preview + shoppable feel.
 * Right: itemised furniture list. Click an item → expands to show brand,
 * why-the-AI-picked-it, Vastu note, and two swap alternates that re-price
 * the whole room live. Footer shows the running total that updates as the
 * buyer swaps pieces in and out.
 *
 * Props:
 *   roomKey  — key into ROOM_BREAKDOWN (e.g. 'kitchen')
 *   onClose  — close handler
 */

const RoomBreakdownModal = ({ roomKey, onClose }) => {
    const room = ROOM_BREAKDOWN[roomKey];
    // Per-item chosen price override (when a swap is picked). null = original.
    const [swapped, setSwapped] = useState({}); // { itemId: { name, brand, price } }
    const [openItem, setOpenItem] = useState(room?.items?.[0]?.id || null);
    const [color, setColor] = useState('none');

    if (!room) return null;

    const effective = (it) => swapped[it.id] || { name: it.name, brand: it.brand, price: it.price };
    const total = useMemo(
        () => room.items.reduce((s, it) => s + effective(it).price, 0),
        [room, swapped]
    );
    const baseTotal = useMemo(() => room.items.reduce((s, it) => s + it.price, 0), [room]);
    const delta = total - baseTotal;
    const colorHex = COLOR_PRESETS.find((c) => c.id === color)?.hex;

    const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

    return (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-6"
             style={{ background: 'rgba(10,17,22,0.82)', backdropFilter: 'blur(6px)' }}
             onClick={onClose}>
            <div
                className="relative w-full sm:max-w-5xl sm:rounded-3xl overflow-hidden flex flex-col lg:flex-row max-h-screen sm:max-h-[88vh]"
                style={{ background: '#0F1B22', border: '1px solid rgba(184,118,61,0.35)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* LEFT — render + colour preview */}
                <div className="lg:w-1/2 relative bg-black shrink-0">
                    <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full">
                        <img src={room.img} alt={room.label} className="w-full h-full object-cover" />
                        {colorHex && (
                            <div className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-500"
                                 style={{ background: colorHex, opacity: 0.55 }} />
                        )}
                        {colorHex && (
                            <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                                 style={{ background: `linear-gradient(180deg, transparent 40%, ${colorHex}33)` }} />
                        )}
                        {/* Vastu badge */}
                        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-xs"
                             style={{ background: room.vastu >= 85 ? '#B8763D' : '#16a34a', backdropFilter: 'blur(6px)' }}>
                            <Award size={12} /> Vastu {room.vastu}
                        </div>
                    </div>

                    {/* Colour preview rail */}
                    <div className="absolute bottom-3 left-3 right-3 rounded-xl px-3 py-2.5"
                         style={{ background: 'rgba(15,27,34,0.88)', border: '1px solid rgba(244,235,221,0.12)', backdropFilter: 'blur(8px)' }}>
                        <p className="text-[9px] uppercase tracking-[0.25em] font-bold mb-2 inline-flex items-center gap-1.5" style={{ color: '#B8763D' }}>
                            <Palette size={11} /> Preview an accent wash
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setColor(c.id)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                                    style={{
                                        background: color === c.id ? 'rgba(184,118,61,0.3)' : 'rgba(244,235,221,0.06)',
                                        border: color === c.id ? '1px solid #B8763D' : '1px solid rgba(244,235,221,0.12)',
                                        color: '#F4EBDD',
                                    }}
                                >
                                    {c.hex && <span className="w-3 h-3 rounded-full" style={{ background: c.hex }} />}
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT — itemised breakdown */}
                <div className="lg:w-1/2 flex flex-col min-h-0">
                    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: '#B8763D' }}>
                                Room bill-of-materials
                            </p>
                            <h3 className="font-serif italic font-black text-2xl" style={{ color: '#F4EBDD' }}>{room.label}</h3>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(244,235,221,0.55)' }}>
                                {room.items.length} items · tap any line for the why, the Vastu note + swaps
                            </p>
                        </div>
                        <button type="button" onClick={onClose}
                                className="rounded-full w-9 h-9 flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(244,235,221,0.08)', color: '#F4EBDD' }} aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
                        {room.items.map((it) => {
                            const eff = effective(it);
                            const isOpen = openItem === it.id;
                            const isSwapped = !!swapped[it.id];
                            return (
                                <div key={it.id} className="rounded-xl overflow-hidden"
                                     style={{ background: 'rgba(244,235,221,0.04)', border: isOpen ? '1px solid rgba(184,118,61,0.45)' : '1px solid rgba(244,235,221,0.08)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenItem(isOpen ? null : it.id)}
                                        className="w-full text-left px-3.5 py-3 flex items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate" style={{ color: '#F4EBDD' }}>{eff.name}</p>
                                            <p className="text-[11px] inline-flex items-center gap-1.5 mt-0.5" style={{ color: 'rgba(244,235,221,0.55)' }}>
                                                <Tag size={10} style={{ color: '#B8763D' }} /> {eff.brand}
                                                {isSwapped && <span className="text-[9px] uppercase tracking-wide" style={{ color: '#7FB069' }}>· swapped</span>}
                                            </p>
                                        </div>
                                        <span className="font-serif font-black text-base inline-flex items-center shrink-0" style={{ color: '#F4EBDD' }}>
                                            <IndianRupee size={12} />{Number(eff.price).toLocaleString('en-IN')}
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className="px-3.5 pb-3.5 space-y-3" style={{ borderTop: '1px solid rgba(244,235,221,0.08)' }}>
                                            <div className="pt-3 flex items-start gap-2">
                                                <Sparkles size={13} className="mt-0.5 shrink-0" style={{ color: '#B8763D' }} />
                                                <p className="text-xs leading-relaxed" style={{ color: 'rgba(244,235,221,0.8)' }}>
                                                    <span className="font-semibold" style={{ color: '#F4EBDD' }}>Why this: </span>{it.why}
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Award size={13} className="mt-0.5 shrink-0" style={{ color: '#7FB069' }} />
                                                <p className="text-xs leading-relaxed" style={{ color: 'rgba(244,235,221,0.8)' }}>
                                                    <span className="font-semibold" style={{ color: '#F4EBDD' }}>Vastu: </span>{it.vastu}
                                                </p>
                                            </div>
                                            {it.swaps?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2 inline-flex items-center gap-1.5" style={{ color: '#B8763D' }}>
                                                        <Repeat size={11} /> Swap this piece
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {/* original */}
                                                        <button type="button" onClick={() => setSwapped((s) => { const n = { ...s }; delete n[it.id]; return n; })}
                                                                className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left"
                                                                style={{ background: !isSwapped ? 'rgba(184,118,61,0.18)' : 'rgba(244,235,221,0.04)', border: !isSwapped ? '1px solid #B8763D' : '1px solid rgba(244,235,221,0.08)' }}>
                                                            <span className="text-xs" style={{ color: '#F4EBDD' }}>
                                                                {!isSwapped && <Check size={11} className="inline mr-1" style={{ color: '#B8763D' }} />}
                                                                {it.name} · <span style={{ color: 'rgba(244,235,221,0.55)' }}>{it.brand}</span>
                                                            </span>
                                                            <span className="text-xs font-bold" style={{ color: '#F4EBDD' }}>{fmt(it.price)}</span>
                                                        </button>
                                                        {it.swaps.map((sw, idx) => {
                                                            const active = isSwapped && eff.name === sw.name;
                                                            return (
                                                                <button key={idx} type="button"
                                                                        onClick={() => setSwapped((s) => ({ ...s, [it.id]: sw }))}
                                                                        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left"
                                                                        style={{ background: active ? 'rgba(184,118,61,0.18)' : 'rgba(244,235,221,0.04)', border: active ? '1px solid #B8763D' : '1px solid rgba(244,235,221,0.08)' }}>
                                                                    <span className="text-xs" style={{ color: '#F4EBDD' }}>
                                                                        {active && <Check size={11} className="inline mr-1" style={{ color: '#B8763D' }} />}
                                                                        {sw.name} · <span style={{ color: 'rgba(244,235,221,0.55)' }}>{sw.brand}</span>
                                                                    </span>
                                                                    <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: sw.price > it.price ? '#D98880' : '#7FB069' }}>
                                                                        {fmt(sw.price)}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer total */}
                    <div className="shrink-0 px-5 py-4" style={{ borderTop: '1px solid rgba(244,235,221,0.10)', background: 'rgba(184,118,61,0.10)' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: '#B8763D' }}>Room total</p>
                                <p className="font-serif font-black text-2xl inline-flex items-baseline" style={{ color: '#F4EBDD' }}>
                                    <IndianRupee size={16} />{Number(total).toLocaleString('en-IN')}
                                    {delta !== 0 && (
                                        <span className="ml-2 text-xs font-bold" style={{ color: delta > 0 ? '#D98880' : '#7FB069' }}>
                                            {delta > 0 ? '+' : ''}{fmt(delta)} vs staged
                                        </span>
                                    )}
                                </p>
                            </div>
                            <button type="button" onClick={onClose}
                                    className="rounded-lg px-4 py-2.5 text-sm font-bold"
                                    style={{ background: 'linear-gradient(135deg, #B8763D, #8E5A2D)', color: '#0F1B22' }}>
                                Looks good
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomBreakdownModal;
