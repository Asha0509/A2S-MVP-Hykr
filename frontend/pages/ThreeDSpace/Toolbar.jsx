import React from 'react';
import {
    Grid, Layout, FolderOpen, Save, Sparkles, RotateCw,
    EyeOff, Eye, Box, ChevronDown, Rocket
} from 'lucide-react';

const Toolbar = ({
    snapToGrid,
    setSnapToGrid,
    setIsSetupModalOpen,
    openLoadModal,
    saveProject,
    performVastuAudit,
    isAnalyzing,
    activeSurface,
    hideCeiling,
    setHideCeiling,
    invisibleWalls,
    setInvisibleWalls
}) => {
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-[95vw] animate-fade-in-up">
            <div className="glass-premium flex items-center h-14 px-2 rounded-full border border-white/20 shadow-2xl overflow-hidden">
                {/* Brand / Logo Section */}
                <div className="flex items-center gap-3 pl-3 pr-4 border-r border-white/10 group cursor-default">
                    <div className="w-8 h-8 bg-a2s-charcoal rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Box size={16} className="text-a2s-gold" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="font-serif text-sm font-black text-main leading-none">Studio</h1>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-accent mt-0.5">Artisan Edition</p>
                    </div>
                </div>

                {/* View Controls Group */}
                <div className="flex items-center p-1 bg-white/5 mx-2 rounded-full">
                    <button
                        onClick={() => setIsSetupModalOpen(true)}
                        className="px-4 py-2 hover:bg-white/10 text-white rounded-full flex items-center gap-2 transition-all group"
                        title="Room Setup"
                    >
                        <Layout size={14} className="text-accent group-hover:scale-110 transition" />
                        <span className="text-[10px] font-black uppercase tracking-wider hidden md:block">Setup</span>
                    </button>
                    
                    <div className="w-px h-4 bg-white/10 mx-1" />

                    <label className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/10 rounded-full transition-all group">
                        <input
                            type="checkbox"
                            checked={snapToGrid}
                            onChange={(e) => setSnapToGrid(e.target.checked)}
                            className="hidden"
                        />
                        <div className={`w-3 h-3 rounded-full border-2 transition-all ${snapToGrid ? 'bg-accent border-accent scale-110 shadow-lg shadow-accent/50' : 'border-white/20 bg-transparent'}`} />
                        <Grid size={14} className="text-white/60 group-hover:text-white transition" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/70 group-hover:text-white hidden md:block">Snap</span>
                    </label>
                </div>

                {/* Action Group */}
                <div className="flex items-center gap-1 mx-1">
                    <button onClick={openLoadModal} className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all group">
                        <FolderOpen size={18} className="group-hover:scale-110 transition" />
                    </button>
                    <button onClick={saveProject} className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all group">
                        <Save size={18} className="group-hover:scale-110 transition" />
                    </button>
                </div>

                {/* AI / Vastu Toggle - The Power Button */}
                <div className="pl-2 pr-1">
                    <button
                        onClick={performVastuAudit}
                        disabled={isAnalyzing}
                        className={`
                            h-10 px-6 rounded-full flex items-center gap-2 transition-all duration-500
                            ${isAnalyzing ? 'bg-white/10 text-white/50 cursor-wait' : 'bg-accent text-on-accent hover:scale-105 hover:shadow-xl hover:shadow-accent/40'}
                        `}
                    >
                        {isAnalyzing ? (
                            <RotateCw className="animate-spin" size={16} />
                        ) : (
                            <>
                                <Sparkles size={16} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Analyze Scene</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 3D Specific Toggles */}
                {activeSurface === '3d' && (
                    <div className="flex items-center gap-1 border-l border-white/10 ml-2 pl-2 pr-2">
                        <button
                            onClick={() => setHideCeiling(!hideCeiling)}
                            className={`p-2.5 rounded-full transition-all ${hideCeiling ? 'text-accent bg-accent/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            title="Toggle Ceiling"
                        >
                            {hideCeiling ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        
                        <div className="relative group/walls flex items-center p-1 bg-black/20 rounded-full border border-white/5 ml-1">
                            {['N', 'S', 'E', 'W'].map(dir => {
                                const wallId = `wall-${dir.toLowerCase()}`;
                                const isHidden = invisibleWalls.includes(wallId);
                                return (
                                    <button
                                        key={dir}
                                        onClick={() => setInvisibleWalls(prev => isHidden ? prev.filter(w => w !== wallId) : [...prev, wallId])}
                                        className={`w-6 h-6 flex items-center justify-center rounded-full text-[8px] font-black transition-all ${isHidden ? 'bg-red-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                    >
                                        {dir}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Toolbar;
