import React from 'react';
import { Lock, Sparkles, X, ArrowUpRight, Monitor, PlayCircle, Box } from 'lucide-react';

const LockedFeatureOverlay = ({ isOpen, onClose, featureName, featureDescription, previewImage }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl transition-all duration-1000" onClick={onClose} />
            
            {/* Content Container */}
            <div className="relative w-full max-w-6xl glass-premium rounded-[64px] border border-white/10 shadow-4xl overflow-hidden animate-scale-in flex flex-col lg:flex-row h-auto min-h-[600px] max-h-[90vh]">
                
                {/* Left: Visual Preview (Cinematic Animation) */}
                <div className="lg:w-3/5 h-[400px] lg:h-auto relative overflow-hidden bg-surface group">
                    {/* The "Building" Scene */}
                    <div className="absolute inset-0 transition-transform duration-[10s] group-hover:scale-110">
                        <img 
                            src="/3d-studio-animation.png" 
                            alt="3D Studio Preview" 
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Animated Overlays - Simulation of "Building" */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {/* Blueprint Grid Drawing */}
                        <div className="absolute inset-0 opacity-10 animate-blueprint">
                            <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        </div>

                        {/* Scan Line */}
                        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_20px_rgba(29,97,114,0.8)] animate-scan-fast z-20" />

                        {/* Floating "Elements" dropping in */}
                        <div className="absolute top-[20%] left-[30%] animate-furniture stagger-1">
                             <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3">
                                 <Box size={20} className="text-accent" />
                                 <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                                     <div className="h-full bg-accent w-3/4 animate-pulse" />
                                 </div>
                             </div>
                        </div>

                        <div className="absolute top-[50%] right-[20%] animate-furniture stagger-3">
                             <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3">
                                 <Sparkles size={20} className="text-accent" />
                                 <span className="text-[8px] font-black text-white uppercase tracking-widest">Optimizing Vastu...</span>
                             </div>
                        </div>

                        {/* Measuring Lines */}
                        <div className="absolute top-[60%] left-[10%] w-[40%] h-px bg-white/20 animate-blueprint stagger-2">
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white/40">480cm</span>
                        </div>
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent hidden lg:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />
                    
                    <div className="absolute bottom-12 left-12 z-20">
                        <div className="flex items-center gap-4 backdrop-blur-2xl bg-white/5 px-8 py-4 rounded-full border border-white/10 shadow-2xl">
                            <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-[0_0_15px_rgba(29,97,114,1)]" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Cinematic Studio Preview</span>
                                <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Alpha Protocol 0.8.4</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Locking Manifest */}
                <div className="flex-1 p-12 lg:p-16 flex flex-col relative bg-main/98 overflow-y-auto">
                    <button 
                        onClick={onClose}
                        className="absolute top-10 right-10 p-3 rounded-full hover:bg-white/5 text-muted transition-colors z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="mb-10 w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <Lock size={20} />
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-px bg-accent/40" />
                        <span className="text-[11px] font-black text-accent uppercase tracking-[0.5em]">Members Area Exclusive</span>
                    </div>

                    <h2 className="font-serif text-4xl lg:text-6xl font-black text-main leading-[0.9] italic mb-10 tracking-tighter">
                         <span className="text-gradient-gold">3D</span><br />Architectural<br />Studio
                    </h2>

                    <p className="text-muted text-base font-light leading-relaxed mb-12">
                        {featureDescription || "The 3D Studio is currently undergoing a structural refinement session. Our architects are finalizing the immersive staging algorithms."}
                    </p>

                    <div className="mt-auto space-y-8">
                         <div className="p-8 rounded-[40px] bg-white/5 border border-white/5">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Sparkles size={14} className="text-accent" />
                                Incoming Protocol
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "Vastu-AI Structural Auditing",
                                    "Real-time Spatial Staging",
                                    "High-Fidelity Perspective Exports"
                                ].map((item, i) => (
                                    <li key={i} className="text-xs text-muted flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent/30" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                         </div>

                         <div className="flex flex-col sm:flex-row gap-4">
                            <button className="flex-1 btn-premium btn-premium-gold py-5 group">
                                <span>Request Early Protocol Access</span>
                                <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                            <button 
                                onClick={onClose}
                                className="px-8 py-5 rounded-[24px] border border-premium text-[10px] font-black uppercase tracking-widest text-muted hover:text-white hover:border-white/20 transition-all"
                            >
                                Acknowledge Lock
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LockedFeatureOverlay;
