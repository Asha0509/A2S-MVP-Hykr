import React from 'react';
import {
    X, Clock, Box, CheckCircle, AlertCircle, Sparkles,
    ArrowLeft, BoxSelect, Pencil, Trash2
} from 'lucide-react';
import FloorPlanDrawer from '../../components/FloorPlanDrawer';

export const LoadModal = ({ isLoadModalOpen, setIsLoadModalOpen, savedPresets, loadPresetIntoScene, deletePreset }) => {
    if (!isLoadModalOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-serif text-xl font-bold text-a2s-charcoal">Load Project</h2>
                    <button onClick={() => setIsLoadModalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="overflow-y-auto p-5 space-y-3">
                    {savedPresets.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>No saved projects found.</p>
                            <p className="text-sm mt-1">Save a design to see it here.</p>
                        </div>
                    ) : (
                        savedPresets.map(preset => (
                            <div key={preset.id} className="border border-gray-200 rounded-xl p-4 hover:border-a2s-gold hover:bg-a2s-gold/5 transition group flex justify-between items-center cursor-pointer" onClick={() => loadPresetIntoScene(preset)}>
                                <div>
                                    <h3 className="font-bold text-a2s-charcoal group-hover:text-a2s-gold transition">{preset.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {preset.date}</span>
                                        <span className="flex items-center gap-1"><Box size={12} /> {preset.itemCount} items</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => deletePreset(e, preset.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Delete Project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export const SetupModal = ({
    isSetupModalOpen,
    setIsSetupModalOpen,
    setupStep,
    setSetupStep,
    setupMode,
    setSetupMode,
    roomType,
    setRoomType,
    roomDimensions,
    setRoomDimensions,
    setFloorPlanPoints,
    setFloorPlanArea,
    floorPlanPoints,
    floorPlanArea,
    hasItems
}) => {
    if (!isSetupModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
            {/* Step 1: Choose Mode */}
            {setupStep === 1 && (
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/20">
                    <div className="p-8 pb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-serif text-2xl font-bold text-a2s-charcoal">Design Your Space</h2>
                            {hasItems && (
                                <button onClick={() => setIsSetupModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">Choose how you want to create your room.</p>
                    </div>

                    <div className="p-8 pt-4 space-y-4">
                        <div>
                            <label className="block mb-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Room Type</span>
                                <select
                                    value={roomType}
                                    onChange={(e) => setRoomType(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-a2s-gold/50 focus:border-a2s-gold transition outline-none text-sm font-medium"
                                >
                                    {['Bedroom', 'Living Room', 'Office', 'Bathroom', 'Dining Room'].map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Setup Method</span>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setSetupMode('rectangle'); setSetupStep(2); }}
                                    className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-a2s-gold hover:bg-a2s-gold/5 transition-all text-left flex flex-col gap-3"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
                                        <BoxSelect size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-a2s-charcoal mb-1">Quick Rectangle</h3>
                                        <p className="text-xs text-gray-500">Simple width × depth setup</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { setSetupMode('custom'); setSetupStep(2); }}
                                    className="group p-6 border-2 border-gray-200 rounded-2xl hover:border-a2s-gold hover:bg-a2s-gold/5 transition-all text-left flex flex-col gap-3"
                                >
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition">
                                        <Pencil size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-a2s-charcoal mb-1">Custom Floor Plan</h3>
                                        <p className="text-xs text-gray-500">Draw your room shape in 2D</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Rectangle Configuration */}
            {setupStep === 2 && setupMode === 'rectangle' && (
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20">
                    <div className="p-8 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => { setSetupStep(1); setSetupMode(null); }} className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-a2s-charcoal">Room Dimensions</h2>
                                <p className="text-sm text-gray-500">Configure your rectangular room</p>
                            </div>
                        </div>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            setRoomDimensions({
                                width: parseInt(formData.get('width')),
                                depth: parseInt(formData.get('depth')),
                                height: parseInt(formData.get('height'))
                            });
                            setFloorPlanPoints(null);
                            setIsSetupModalOpen(false);
                            setSetupStep(1);
                            setSetupMode(null);
                        }}
                        className="p-8 pt-2 space-y-6"
                    >
                        <div className="grid grid-cols-3 gap-4">
                            {['width', 'depth', 'height'].map(dim => (
                                <label key={dim} className="block">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block text-center">{dim.charAt(0).toUpperCase() + dim.slice(1)} (cm)</span>
                                    <input
                                        type="number"
                                        name={dim}
                                        min={dim === 'height' ? "200" : "300"}
                                        max={dim === 'height' ? "500" : "1200"}
                                        defaultValue={roomDimensions[dim]}
                                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-a2s-gold/20 text-center text-sm font-bold shadow-sm"
                                        required
                                    />
                                </label>
                            ))}
                        </div>
                        <button type="submit" className="w-full py-4 bg-a2s-charcoal text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]">
                            {hasItems ? 'Update Room' : 'Start Designing'}
                            <ArrowLeft size={18} className="rotate-180" />
                        </button>
                    </form>
                </div>
            )}

            {/* Step 2: Custom Floor Plan Drawing */}
            {setupStep === 2 && setupMode === 'custom' && (
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col border border-white/20">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setSetupStep(1); setSetupMode(null); }} className="p-2 rounded-full hover:bg-gray-200 transition text-gray-600">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="font-serif text-xl font-bold text-a2s-charcoal">Step 2: Draw Floor Plan</h2>
                                <p className="text-xs text-gray-500">Click to add points, close the shape to complete</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-grow overflow-hidden">
                        <FloorPlanDrawer
                            onComplete={(points, area) => {
                                setFloorPlanPoints(points);
                                setFloorPlanArea(area);
                                setSetupStep(3);
                            }}
                            initialPoints={floorPlanPoints}
                        />
                    </div>
                </div>
            )}

            {/* Step 3: Set Height */}
            {setupStep === 3 && setupMode === 'custom' && floorPlanPoints && (
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20">
                    <div className="p-8 pb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => setSetupStep(2)} className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-a2s-charcoal">Set Room Height</h2>
                                <p className="text-sm text-gray-500">Floor plan area: {(floorPlanArea / 10000).toFixed(2)} m²</p>
                            </div>
                        </div>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const height = parseInt(formData.get('height'));
                            const xs = floorPlanPoints.map(p => p.x);
                            const ys = floorPlanPoints.map(p => p.y);
                            const width = Math.max(...xs) - Math.min(...xs);
                            const depth = Math.max(...ys) - Math.min(...ys);
                            setRoomDimensions({ width, depth, height });
                            setIsSetupModalOpen(false);
                            setSetupStep(1);
                            setSetupMode(null);
                        }}
                        className="p-8 pt-2 space-y-6"
                    >
                        <div className="relative">
                            <input type="number" name="height" min="200" max="500" step="10" defaultValue={roomDimensions.height} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-a2s-gold/50 text-center text-2xl font-bold shadow-sm" required />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">cm</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-2"><CheckCircle size={14} /> Floor Plan Ready</h4>
                            <p className="text-xs text-green-600">{floorPlanPoints.length} points • {(floorPlanArea / 10000).toFixed(2)} m² area</p>
                        </div>
                        <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-[0.98]">
                            Create 3D Space <ArrowLeft size={18} className="rotate-180" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export const VastuModal = ({ vastuResult, setVastuResult }) => {
    if (!vastuResult) return null;

    const score = Number.isFinite(Number(vastuResult?.score))
        ? Number(vastuResult.score)
        : Number.isFinite(Number(vastuResult?.vastu_score))
            ? Number(vastuResult.vastu_score)
            : 0;

    const summary = vastuResult?.summary || vastuResult?.vastu_summary || 'Analysis complete. View details.';
    const pros = Array.isArray(vastuResult?.pros)
        ? vastuResult.pros
        : Array.isArray(vastuResult?.vastu_pros)
            ? vastuResult.vastu_pros
            : [];
    const cons = Array.isArray(vastuResult?.cons)
        ? vastuResult.cons
        : Array.isArray(vastuResult?.vastu_cons)
            ? vastuResult.vastu_cons
            : [];
    const renderItemText = (item) => (typeof item === 'string' ? item : item?.text || '');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-a2s-charcoal text-white">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-a2s-gold" size={20} />
                        <h2 className="font-serif text-xl font-bold">Vastu Analysis</h2>
                    </div>
                    <button onClick={() => setVastuResult(null)} className="p-1 rounded-full hover:bg-white/10 transition text-white"><X size={20} /></button>
                </div>
                <div className="overflow-y-auto p-6 text-gray-700 leading-relaxed">
                    <div className="prose prose-sm max-w-none">
                        <h3 className="text-lg font-bold text-a2s-charcoal mb-2">Overall Score: {score}/100</h3>
                        <p className="mb-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200 italic">"{summary}"</p>
                        <h4 className="font-bold text-green-700 flex items-center gap-2 mb-2"><CheckCircle size={16} /> Positive Aspects</h4>
                        <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">{pros.map((pro, i) => <li key={i}>{renderItemText(pro)}</li>)}</ul>
                        <h4 className="font-bold text-red-600 flex items-center gap-2 mb-2"><AlertCircle size={16} /> Suggestions to Improve</h4>
                        <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">{cons.map((con, i) => <li key={i}>{renderItemText(con)}</li>)}</ul>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                    <button onClick={() => setVastuResult(null)} className="btn-primary w-full py-3 bg-a2s-charcoal text-white rounded-xl font-bold">Back to Studio</button>
                </div>
            </div>
        </div>
    );
};
