import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * One room, three styles, side-by-side.
 *
 * Shows the same room staged in three different styles so the buyer can
 * pick at a glance. Uses cached FLUX renders — Modern / Classic / Minimal —
 * presented as "the same living room, three ways". Selecting a style
 * highlights it; a sticky footer shows the choice + a CTA to continue.
 *
 * This sells the "we don't make you guess — we show you" UX angle, and
 * makes the 6 design styles tangible instead of a text list.
 */

const OPTIONS = [
    { id: 'modern',  label: 'Modern',  img: '/showcase/living-modern.jpg',  blurb: 'Teak, neutrals, statement pendant', vastu: 84, cost: '₹1.84L' },
    { id: 'classic', label: 'Classic', img: '/showcase/drawing-classic.jpg', blurb: 'Carved wood, jewel velvets, chandelier', vastu: 78, cost: '₹4.25L' },
    { id: 'minimal', label: 'Minimal', img: '/showcase/study-minimal.jpg',   blurb: 'Japandi, light oak, near-zero clutter', vastu: 88, cost: '₹1.25L' },
];

const StyleCompare = () => {
    const [selected, setSelected] = useState('modern');
    const chosen = OPTIONS.find((o) => o.id === selected);

    return (
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(160deg, #0F1B22 0%, #142733 100%)', border: '1px solid rgba(184,118,61,0.30)' }}>
            <div className="px-5 sm:px-7 pt-6 pb-4">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: '#B8763D' }}>
                    Same room · three styles · pick at a glance
                </p>
                <h3 className="font-serif italic font-black text-2xl sm:text-3xl mt-1" style={{ color: '#F4EBDD' }}>
                    Don't describe your taste. <span style={{ color: '#B8763D' }}>Point at it.</span>
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 sm:px-7">
                {OPTIONS.map((o) => {
                    const isSel = selected === o.id;
                    return (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => setSelected(o.id)}
                            className="text-left rounded-2xl overflow-hidden transition-all duration-300 relative"
                            style={{
                                border: isSel ? '2px solid #B8763D' : '2px solid rgba(244,235,221,0.10)',
                                transform: isSel ? 'translateY(-4px)' : 'translateY(0)',
                                boxShadow: isSel ? '0 16px 40px rgba(184,118,61,0.35)' : 'none',
                            }}
                        >
                            <div className="relative aspect-[4/3]">
                                <img src={o.img} alt={`${o.label} living room`} className="w-full h-full object-cover"
                                     style={{ filter: isSel ? 'none' : 'saturate(0.85) brightness(0.78)' }} />
                                {isSel && (
                                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                                         style={{ background: '#B8763D', color: '#0F1B22' }}>
                                        <Check size={15} strokeWidth={3} />
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full"
                                     style={{ background: 'rgba(15,27,34,0.85)', backdropFilter: 'blur(6px)' }}>
                                    <span className="text-[10px] font-bold" style={{ color: o.vastu >= 85 ? '#B8763D' : '#16a34a' }}>
                                        Vastu {o.vastu}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="font-semibold" style={{ color: isSel ? '#F4EBDD' : 'rgba(244,235,221,0.7)' }}>{o.label}</p>
                                <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'rgba(244,235,221,0.5)' }}>{o.blurb}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 mx-5 sm:mx-7 mb-6 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                 style={{ background: 'rgba(184,118,61,0.12)', border: '1px solid rgba(184,118,61,0.35)' }}>
                <p className="text-sm" style={{ color: 'rgba(244,235,221,0.85)' }}>
                    You picked <span className="font-bold" style={{ color: '#B8763D' }}>{chosen.label}</span> ·
                    {' '}Vastu {chosen.vastu} · est. {chosen.cost} for the room
                </p>
                <Link
                    to="/design"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #B8763D, #8E5A2D)', color: '#0F1B22' }}
                >
                    Design my whole home in {chosen.label} <ArrowRight size={15} />
                </Link>
            </div>
        </div>
    );
};

export default StyleCompare;
