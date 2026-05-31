import React, { useState } from 'react';
import { ShoppingBag, X, IndianRupee, Plus, Check, Tag } from 'lucide-react';

/**
 * Shoppable hotspots overlaid on a staged room render.
 *
 * Each hotspot is positioned with percentage coordinates (so it stays put
 * when the image is resized) and opens a sliding product card with the
 * brand, price, and an "Add to cart" CTA. Cart count persists to
 * localStorage so the buyer journey survives a refresh.
 *
 * Props:
 *   src       — image URL
 *   hotspots  — array of { x, y, label, brand, price, image, sku }
 *   className — wrapper className
 *
 * The "moat" pitch this enables: "Every item you see is a real SKU you
 * can add to cart in one click — that's the catalog integration in
 * action." Visible, interactive, no slides needed.
 */

const CART_KEY = 'a2s-hotspot-cart';

const ShoppableImage = ({ src, alt, hotspots = [], className = '', aspectRatio = '4/3' }) => {
    const [active, setActive] = useState(null);
    const [added, setAdded] = useState(() => {
        try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
    });

    const addToCart = (sku) => {
        const next = [...new Set([...added, sku])];
        setAdded(next);
        try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch (_) {}
        setActive(null);
    };

    return (
        <div className={`relative ${className}`} style={{ aspectRatio }}>
            <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />

            {/* Hotspot pins */}
            {hotspots.map((h, i) => {
                const isAdded = added.includes(h.sku);
                const isActive = active === i;
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setActive(isActive ? null : i)}
                        className="absolute group"
                        style={{
                            left: `${h.x}%`,
                            top: `${h.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        aria-label={`${h.label} — ${h.brand}`}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs transition-all duration-300"
                            style={{
                                background: isAdded
                                    ? 'rgba(22,163,74,0.95)'
                                    : isActive
                                        ? '#B8763D'
                                        : 'rgba(15,27,34,0.85)',
                                border: isAdded
                                    ? '2px solid #14532d'
                                    : '2px solid #B8763D',
                                boxShadow: isActive
                                    ? '0 0 0 12px rgba(184,118,61,0.22), 0 0 28px rgba(184,118,61,0.55)'
                                    : '0 0 0 6px rgba(184,118,61,0.12), 0 6px 18px rgba(0,0,0,0.35)',
                                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                                backdropFilter: 'blur(6px)',
                            }}
                        >
                            {isAdded ? <Check size={14} /> : <Plus size={14} />}
                        </div>
                        {/* Ripple ring */}
                        {!isAdded && (
                            <span
                                className="absolute inset-0 rounded-full"
                                style={{
                                    border: '2px solid #B8763D',
                                    animation: 'a2s-ripple 2s ease-out infinite',
                                    animationDelay: `${i * 0.4}s`,
                                }}
                            />
                        )}
                    </button>
                );
            })}

            {/* Product card panel */}
            {active != null && hotspots[active] && (() => {
                const h = hotspots[active];
                const isAdded = added.includes(h.sku);
                return (
                    <div
                        className="absolute z-10 max-w-[260px]"
                        style={{
                            left: `${Math.min(Math.max(h.x, 22), 78)}%`,
                            top: `${Math.min(h.y + 6, 80)}%`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div
                            className="rounded-2xl overflow-hidden shadow-2xl"
                            style={{
                                background: 'rgba(15,27,34,0.95)',
                                border: '1px solid rgba(184,118,61,0.45)',
                                backdropFilter: 'blur(12px)',
                                animation: 'a2s-pop 220ms ease-out',
                            }}
                        >
                            <div className="flex items-start gap-3 p-3">
                                <div
                                    className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center"
                                    style={{ background: 'rgba(184,118,61,0.20)' }}
                                >
                                    <ShoppingBag size={20} style={{ color: '#B8763D' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: '#B8763D' }}>
                                        {h.brand}
                                    </p>
                                    <p className="font-semibold text-sm leading-tight" style={{ color: '#F4EBDD' }}>
                                        {h.label}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActive(null)}
                                    className="rounded-full w-7 h-7 flex items-center justify-center"
                                    style={{ background: 'rgba(244,235,221,0.08)', color: 'rgba(244,235,221,0.7)' }}
                                    aria-label="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div
                                className="flex items-center justify-between px-3 py-2.5"
                                style={{ background: 'rgba(244,235,221,0.04)', borderTop: '1px solid rgba(244,235,221,0.08)' }}
                            >
                                <span className="font-serif font-black text-lg italic inline-flex items-center" style={{ color: '#F4EBDD' }}>
                                    <IndianRupee size={14} />
                                    {Number(h.price).toLocaleString('en-IN')}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => addToCart(h.sku)}
                                    disabled={isAdded}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                                    style={{
                                        background: isAdded ? 'rgba(22,163,74,0.85)' : 'linear-gradient(135deg, #B8763D 0%, #8E5A2D 100%)',
                                        color: isAdded ? '#FFF7E6' : '#0F1B22',
                                    }}
                                >
                                    {isAdded ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add to cart</>}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Tiny chip showing 'X items shoppable' bottom-left */}
            <div
                className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full pointer-events-none"
                style={{
                    background: 'rgba(15,27,34,0.85)',
                    border: '1px solid rgba(184,118,61,0.35)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Tag size={11} style={{ color: '#B8763D' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#F4EBDD' }}>
                    {hotspots.length} items shoppable
                </span>
                {added.length > 0 && (
                    <span
                        className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                        style={{ background: '#16a34a', color: '#FFF7E6' }}
                    >
                        {added.length} in cart
                    </span>
                )}
            </div>

            <style>{`
                @keyframes a2s-ripple {
                    0%   { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                @keyframes a2s-pop {
                    0%   { transform: translateX(-50%) translateY(-8px) scale(0.94); opacity: 0; }
                    100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

/**
 * Pre-baked hotspot layouts for each cached FLUX render. Coordinates are
 * approximated visually — they don't need pixel precision, they just need
 * to land on the visible furniture in each render.
 */
export const HOTSPOT_LIBRARY = {
    'living-modern': [
        { x: 32, y: 70, label: '3-seater contemporary sofa', brand: 'HomeLane',    price: 56000, sku: 'hl-sofa-3s' },
        { x: 56, y: 76, label: 'Solid teak coffee table',    brand: 'WoodenStreet',price: 24500, sku: 'ws-coffee' },
        { x: 78, y: 48, label: 'Brass arc floor lamp',       brand: 'Pepperfry',   price: 8400,  sku: 'pp-lamp' },
        { x: 18, y: 38, label: 'Indoor fiddle-leaf fig',     brand: 'Pepperfry',   price: 3800,  sku: 'pp-plant' },
        { x: 70, y: 28, label: 'Abstract canvas 36x48"',     brand: 'MiradorHome', price: 12200, sku: 'mh-art' },
        { x: 48, y: 90, label: 'Wool + jute layered rug',    brand: 'IKEA',        price: 7600,  sku: 'ikea-rug' },
    ],
    'bedroom-contemporary': [
        { x: 50, y: 60, label: 'King storage bed',           brand: 'HomeLane',    price: 78000, sku: 'hl-bed-k' },
        { x: 22, y: 64, label: 'Walnut bedside table',       brand: 'WoodenStreet',price: 9250,  sku: 'ws-bedside' },
        { x: 78, y: 64, label: 'Walnut bedside table',       brand: 'WoodenStreet',price: 9250,  sku: 'ws-bedside-2' },
        { x: 50, y: 28, label: 'Linen curtains, set of 4',   brand: 'IKEA',        price: 4800,  sku: 'ikea-curtains' },
        { x: 18, y: 36, label: 'Brass reading lamp',         brand: 'Pepperfry',   price: 6200,  sku: 'pp-bed-lamp' },
    ],
    'kitchen-functional': [
        { x: 30, y: 62, label: 'Modular base + wall units',  brand: 'HomeLane',    price: 168000, sku: 'hl-kitchen' },
        { x: 56, y: 56, label: 'Quartz countertop, 28 sqft', brand: 'HomeLane',    price: 42000, sku: 'hl-quartz' },
        { x: 68, y: 70, label: 'Built-in hob + chimney',     brand: 'Godrej Interio', price: 38500, sku: 'gi-hob' },
        { x: 82, y: 84, label: 'Breakfast counter + stools', brand: 'WoodenStreet',price: 22500, sku: 'ws-counter' },
        { x: 42, y: 38, label: 'Under-cabinet LED strip',    brand: 'IKEA',        price: 8500,  sku: 'ikea-led' },
    ],
    'pooja-classic': [
        { x: 50, y: 58, label: 'Carved marble mandir 30x18"',brand: 'MiradorHome', price: 18500, sku: 'mh-mandir' },
        { x: 38, y: 70, label: 'Brass diya set, pair',       brand: 'Pepperfry',   price: 2400,  sku: 'pp-diya' },
        { x: 62, y: 70, label: 'Brass diya set, pair',       brand: 'Pepperfry',   price: 2400,  sku: 'pp-diya-2' },
        { x: 50, y: 86, label: 'Silk sitting rug',           brand: 'IKEA',        price: 3800,  sku: 'ikea-silk' },
        { x: 50, y: 30, label: 'Carved wooden backwall panel', brand: 'WoodenStreet', price: 8400, sku: 'ws-panel' },
    ],
    'drawing-classic': [
        { x: 36, y: 60, label: 'Emerald velvet 3-seater sofa', brand: 'WoodenStreet', price: 124000, sku: 'ws-velvet-sofa' },
        { x: 64, y: 56, label: 'Burnt orange accent chair',  brand: 'Pepperfry',   price: 38500, sku: 'pp-chair' },
        { x: 50, y: 28, label: 'Crystal chandelier',         brand: 'MiradorHome', price: 62500, sku: 'mh-chandelier' },
        { x: 50, y: 84, label: 'Persian jewel-tone rug',     brand: 'MiradorHome', price: 48000, sku: 'mh-rug' },
        { x: 18, y: 70, label: 'Brass urli with marigolds',  brand: 'Pepperfry',   price: 7800,  sku: 'pp-urli' },
    ],
    'study-minimal': [
        { x: 50, y: 56, label: 'Pale oak writing desk',      brand: 'WoodenStreet',price: 32500, sku: 'ws-desk' },
        { x: 50, y: 78, label: 'Ergonomic light wood chair', brand: 'IKEA',        price: 14500, sku: 'ikea-chair' },
        { x: 84, y: 50, label: 'Floor-to-ceiling oak shelf', brand: 'HomeLane',    price: 68000, sku: 'hl-shelf' },
        { x: 18, y: 46, label: 'Ceramic vase + dried branch',brand: 'MiradorHome', price: 3200,  sku: 'mh-vase' },
    ],
};

export default ShoppableImage;
