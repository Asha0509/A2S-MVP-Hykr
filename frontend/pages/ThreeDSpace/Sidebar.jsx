import React, { useState } from 'react';
import {
    Layers, Trash2, Compass, Eye, RotateCcw, RotateCw,
    Box, ChevronRight, X, Maximize2, Move
} from 'lucide-react';

const Sidebar = ({
    items,
    setItems,
    selectedId,
    setSelectedId,
    CATALOG,
    activeSurface,
    setActiveSurface,
    rotateItem,
    rotateItemCcw,
    deleteItem
}) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            {/* Floating Toggle Button (visible when closed) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed left-6 top-1/3 -translate-y-1/2 z-[90] w-12 h-12 bg-white/10 backdrop-blur-3xl text-white rounded-full flex items-center justify-center shadow-2xl border border-white/20 hover:scale-110 transition-all animate-fade-in"
                >
                    <Layers size={22} />
                </button>
            )}

            <div className={`
                fixed top-24 bottom-24 left-6 z-[90] w-72 flex flex-col 
                bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] 
                shadow-2xl overflow-hidden transition-all duration-700 ease-premium
                ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[-120%] opacity-0 pointer-events-none'}
            `}>
                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-serif text-2xl font-black text-white italic">Curator</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Scene Hierarchy</p>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Object List */}
                <div className="flex-grow min-h-0 overflow-y-auto px-6 pb-6 custom-scrollbar space-y-2">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <Box size={40} className="mb-4 text-white/10" />
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Atelier Empty</p>
                        </div>
                    ) : (
                        items.map(item => {
                            const cat = CATALOG.find(c => c.id === item.catalogId);
                            const name = cat?.name ?? item.catalogId;
                            const isSelected = selectedId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    className={`
                                        group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300
                                        ${isSelected ? 'bg-accent text-on-accent shadow-lg shadow-accent/30' : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/80'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-white/20' : 'bg-white/5'}`}>
                                            {cat?.icon ? React.cloneElement(cat.icon, { size: 14, className: isSelected ? 'text-on-accent' : 'text-accent' }) : <Box size={14} />}
                                        </div>
                                        <span className="truncate text-[11px] font-black uppercase tracking-wide">{name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setItems(prev => prev.filter(i => i.id !== item.id));
                                            if (selectedId === item.id) setSelectedId(null);
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${isSelected ? 'text-on-accent/40 hover:text-on-accent hover:bg-white/10' : 'text-white/20 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'}`}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Perspective Hub */}
                <div className="p-8 pt-6 border-t border-white/5 bg-white/5">
                    <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                        <Compass size={12} className="text-accent" /> Perspective Hub
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setActiveSurface('3d')}
                            className={`col-span-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${activeSurface === '3d' ? 'bg-white text-a2s-charcoal shadow-xl' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                        >
                            <Maximize2 size={16} /> Cinematic 3D
                        </button>
                        <button
                            onClick={() => setActiveSurface('floor')}
                            className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSurface === 'floor' ? 'bg-white text-a2s-charcoal shadow-xl' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}
                        >
                            Floor
                        </button>
                        <div className="grid grid-cols-2 gap-1">
                            {['n', 's', 'e', 'w'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setActiveSurface(`wall-${s}`)}
                                    className={`py-1.5 rounded-lg text-[8px] font-black transition-all ${activeSurface === `wall-${s}` ? 'bg-white text-a2s-charcoal' : 'bg-white/5 text-white/30 border border-white/5 hover:text-white'}`}
                                >
                                    {s.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Object Controls - Floating Inspector Detail */}
                {selectedId && (
                    <div className="p-8 pt-6 border-t border-white/10 bg-accent/90 animate-fade-in">
                        <p className="text-[9px] font-black text-on-accent uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                            <Move size={12} /> Object Mechanics
                        </p>
                        <div className="flex gap-3">
                            <button onClick={rotateItemCcw} className="flex-1 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center text-on-accent transition-all active:scale-95">
                                <RotateCcw size={20} />
                            </button>
                            <button onClick={rotateItem} className="flex-1 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center text-on-accent transition-all active:scale-95">
                                <RotateCw size={20} />
                            </button>
                            <button onClick={deleteItem} className="flex-1 py-4 bg-red-500/20 hover:bg-red-500 border border-red-500/30 rounded-2xl flex items-center justify-center text-on-accent transition-all active:scale-95">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Sidebar;
