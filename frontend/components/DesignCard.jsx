import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, IndianRupee, Eye, ArrowUpRight, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { saveDesign as saveToBackend } from '../services/api';

const DesignCard = ({ design, onQuickPreview }) => {
    const saved = useStore(state => state.savedDesigns.includes(design.id));
    const toggleSaved = useStore(state => state.toggleSavedDesign);
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * 10;
        const rotateY = ((centerX - x) / centerX) * 10;
        setTilt({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    const handleSaveClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Optimistically toggle in store
        toggleSaved(design.id);

        const token = localStorage.getItem('token');
        if (token) {
            try {
                await saveToBackend(design.id);
            } catch (err) {
                console.error("Failed to save to backend:", err);
                // Revert if failed? (Implementing simple toggle for now)
            }
        }
    };

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
                transition: tilt.x === 0 && tilt.y === 0 ? 'all 0.5s ease' : 'none'
            }}
            className="group relative overflow-hidden flex flex-col h-full bg-white rounded-[32px] border border-premium shadow-premium hover:shadow-2xl transition-all duration-300 animate-fade-in-up" 
            tabIndex="0" 
            role="article" 
            aria-label={`Design: ${design.title}`}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden">
                <img
                    src={design.image}
                    alt={design.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />

                {/* Immersive Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Floating Meta: Quick Preview and Save */}
                <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
                    <button
                        type="button"
                        onClick={handleSaveClick}
                        className={`p-3 rounded-full backdrop-blur-xl border border-white/20 transition-all duration-300 ${saved ? 'bg-red-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white hover:text-red-500'}`}
                        aria-label={saved ? 'Unsave design' : 'Save design'}
                    >
                        <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
                    </button>
                    {onQuickPreview && (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickPreview(design); }}
                            className="p-3 rounded-full backdrop-blur-xl bg-white/10 text-white border border-white/20 hover:bg-accent hover:border-accent transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0"
                            aria-label="Quick View"
                        >
                            <Eye size={18} />
                        </button>
                    )}
                </div>

                {/* Top Left Badge */}
                <div className="absolute top-6 left-6 z-20">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30 text-accent font-black text-[9px] uppercase tracking-[0.2em]">
                        <Sparkles size={10} className="animate-pulse" />
                        {design.style}
                    </div>
                </div>

                {/* Bottom Overlay Details */}
                <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 z-10">
                    <h3 className="font-serif text-2xl md:text-3xl font-black text-white mb-4 leading-tight italic drop-shadow-lg">
                        {design.title}
                    </h3>

                    {/* Tags */}
                    {design.tags && design.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                            {design.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/10 text-[8px] font-bold text-white/80 uppercase tracking-widest">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                        <div className="flex items-center gap-2 text-white">
                            <IndianRupee size={14} className="text-accent" />
                            <span className="text-sm font-black tracking-tight">
                                {design.totalCost?.toLocaleString('en-IN') || '0'}
                            </span>
                        </div>
                        <Link
                            to={`/design/${design.id}`}
                            className="flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-[0.3em] border-b border-white/30 pb-1 hover:border-accent hover:text-accent transition-colors group/link"
                        >
                            <span>Explore</span>
                            <ArrowUpRight size={12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content for Non-Hover State (Subtle) */}
            <div className="p-6 bg-surface flex flex-col border-t border-gray-50 group-hover:bg-main group-hover:border-main transition-colors duration-500">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-accent/80 transition-colors">
                        {design.roomType}
                    </span>
                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-white/30">
                        {design.products?.length || 0} Pieces
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DesignCard;
