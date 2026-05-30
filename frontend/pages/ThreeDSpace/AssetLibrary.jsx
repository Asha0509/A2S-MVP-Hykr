import React, { useState } from 'react';
import { Box, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AVAILABLE_CATEGORIES } from './constants';

const AssetLibrary = ({
    activeCategory,
    setActiveCategory,
    activeSurface,
    addItem,
    filteredCatalog
}) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            {/* Floating Toggle Button (visible when closed) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed right-6 top-1/2 -translate-y-1/2 z-[90] w-12 h-12 bg-accent text-on-accent rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all animate-fade-in"
                >
                    <Box size={24} />
                </button>
            )}

            <div className={`
                fixed top-24 bottom-24 right-6 z-[90] w-80 flex flex-col 
                bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] 
                shadow-2xl overflow-hidden transition-all duration-700 ease-premium
                ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}
            `}>
                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-serif text-2xl font-black text-white">Atelier</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Select Elements</p>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* Category Pills - Horizontal Scroll */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {AVAILABLE_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                                    ${activeCategory === cat ? 'bg-accent text-on-accent' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'}
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hint Box */}
                {activeSurface === '3d' && (
                    <div className="mx-8 mb-4 p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                        <p className="text-[9px] text-accent font-black uppercase tracking-wider leading-relaxed text-center">
                            Context: Interactive Surface Enabled
                        </p>
                    </div>
                )}

                {/* Grid */}
                <div className="flex-grow min-h-0 overflow-y-auto p-8 pt-0 grid grid-cols-2 gap-4 content-start custom-scrollbar">
                    {filteredCatalog.map(item => (
                        <button
                            key={item.id}
                            onClick={() => addItem(item)}
                            className="group flex flex-col items-center justify-center p-5 rounded-3xl border border-white/5 hover:border-accent/50 hover:bg-accent/5 transition-all duration-500 bg-white/5 relative overflow-hidden active:scale-95"
                        >
                            <div className="mb-4 p-4 bg-white/5 rounded-2xl group-hover:bg-accent group-hover:shadow-xl group-hover:shadow-accent/40 transition-all duration-500 relative z-10">
                                {item.icon ? React.cloneElement(item.icon, { size: 28, className: 'text-white group-hover:text-on-accent transition-colors' }) : <Box size={28} className="text-white" />}
                            </div>

                            <span className="text-[10px] font-black text-white text-center leading-tight mb-2 tracking-wide uppercase opacity-70 group-hover:opacity-100 relative z-10">{item.name}</span>
                            <div className="px-2 py-0.5 bg-white/5 rounded-full relative z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#888]">{item.width} × {item.depth || item.height || '0'} cm</span>
                            </div>
                        </button>
                    ))}

                    {filteredCatalog.length === 0 && (
                        <div className="col-span-2 flex flex-col items-center justify-center py-20 px-6 text-center opacity-40">
                            <Filter size={32} className="mb-4 text-white/20" />
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">No Narrative Found</p>
                            <p className="text-[9px] text-white/50 mt-2 italic">Adjust your curatorial lens.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AssetLibrary;
