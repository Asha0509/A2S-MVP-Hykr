import React, { useState } from 'react';
import { X, SlidersHorizontal, IndianRupee, Sparkles, Home, ChevronDown, Check } from 'lucide-react';
import { INITIAL_FILTER_STATE, FURNITURE_CATEGORY_GROUPS } from '../constants';

const FilterSidebar = ({ filters, setFilters, viewType = 'rooms', counts = { rooms: {}, styles: {}, productRooms: {} }, sortBy, setSortBy, onClose }) => {
    const [expandedSections, setExpandedSections] = useState({
        sort: true,
        budget: false,
        space: false,
        aesthetic: false
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Exact lists from landing page reference
    // Exact lists from landing page reference
    const roomTypesList = [
        'Living Room', 'Kitchen', 'Home Office', 'Master Bedroom', 'Guest Bedroom', 'Dining Room', 'Bathroom', 'Balcony', 'Pooja Room', 'Walk-in Wardrobe', 'Entire House'
    ];
    const aestheticsList = ['Minimal', 'Scandinavian', 'Indian Contemporary', 'Mid-Century Modern', 'Luxury', 'Boho', 'Industrial'];
    // Curated labels backed by FURNITURE_CATEGORY_GROUPS so the chip vocabulary
    // actually matches the scraper category vocabulary (sofa, lighting, storage…).
    const furnitureCategoriesList = Object.keys(FURNITURE_CATEGORY_GROUPS);

    const toggleRoom = (room) => {
        setFilters(prev => ({
            ...prev,
            roomTypes: prev.roomTypes.includes(room)
                ? prev.roomTypes.filter(r => r !== room)
                : [...prev.roomTypes, room]
        }));
    };

    const toggleStyle = (style) => {
        setFilters(prev => ({
            ...prev,
            styles: prev.styles.includes(style)
                ? prev.styles.filter(s => s !== style)
                : [...prev.styles, style]
        }));
    };

    const toggleProductRoomType = (room) => {
        setFilters(prev => ({
            ...prev,
            productRoomTypes: (prev.productRoomTypes || []).includes(room)
                ? (prev.productRoomTypes || []).filter(r => r !== room)
                : [...(prev.productRoomTypes || []), room]
        }));
    };

    const canonicalProductRoomTypes = [
        'Living Room',
        'Bedroom',
        'Dining Room',
        'Kitchen',
        'Home Office',
        'Bathroom',
        'Balcony',
        'Pooja Room',
        'Walk-in Wardrobe',
        'Entire House',
    ];
    const productRoomTypesList = Array.from(
        new Set([...canonicalProductRoomTypes, ...Object.keys(counts.productRooms || {})])
    );

    return (
        <div className="bg-white p-6 md:p-7 rounded-[36px] border border-premium shadow-2xl h-full flex flex-col overflow-hidden animate-fade-in-left transition-all duration-700">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-main uppercase tracking-[0.5em]">Refine</span>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2.5 rounded-full hover:bg-neutral-100 transition-all duration-500 group"
                    >
                        <X size={20} className="text-neutral-500 group-hover:text-main group-hover:rotate-90 transition-all duration-500" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
                {/* Sort Section */}
                <div className="border-b border-neutral-100 pb-4 mb-1">
                    <button 
                        onClick={() => toggleSection('sort')}
                        className="flex items-center justify-between w-full group py-2.5 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-all ${expandedSections.sort ? 'bg-accent text-on-accent' : 'bg-neutral-50 text-neutral-400'}`}>
                                <SlidersHorizontal size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">Sort</h4>
                        </div>
                        <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-500 ${expandedSections.sort ? 'rotate-180 text-accent' : ''}`} />
                    </button>
                    
                    <div className={`grid gap-2 transition-all duration-500 overflow-hidden ${expandedSections.sort ? 'max-h-[500px] mt-2.5 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {[
                            { value: 'recommended', label: 'Recommended' },
                            { value: 'price-low', label: 'Price: Low → High' },
                            { value: 'price-high', label: 'Price: High → Low' },
                        ].map(opt => {
                            const isActive = sortBy === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setSortBy(opt.value)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-500 active:scale-[0.98] ${isActive 
                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl' 
                                        : 'bg-white text-main border-neutral-50 hover:border-accent/10 hover:bg-neutral-50/50'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                    {isActive && <Check size={14} className="text-accent animate-scale-in" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Progressive Filters Toggle */}
                <div className="py-2">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(prev => !prev)}
                        className="w-full py-2.5 rounded-xl border border-neutral-200 text-[10px] font-black uppercase tracking-[0.24em] text-neutral-600 hover:text-accent hover:border-accent transition-all"
                    >
                        {showAdvanced ? 'Hide Advanced Filters' : 'More Filters'}
                    </button>
                </div>

                {/* Budget Range Section */}
                {showAdvanced && (
                <div className="border-b border-neutral-100 pb-4 mb-1">
                    <button 
                        onClick={() => toggleSection('budget')}
                        className="flex items-center justify-between w-full group py-2.5 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-all ${expandedSections.budget ? 'bg-accent text-on-accent' : 'bg-neutral-50 text-neutral-400'}`}>
                                <IndianRupee size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">Budget Range</h4>
                        </div>
                        <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-500 ${expandedSections.budget ? 'rotate-180 text-accent' : ''}`} />
                    </button>

                    <div className={`transition-all duration-500 overflow-hidden ${expandedSections.budget ? 'max-h-[500px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <span className="text-[9px] font-semibold text-neutral-600 uppercase tracking-widest">Maximum Price</span>
                            <div className="flex items-center gap-1.5 text-accent font-black italic">
                                <IndianRupee size={14} />
                                <span className="text-2xl tracking-tighter">{(filters.maxPrice / 1000).toFixed(0)}k</span>
                            </div>
                        </div>
                        <div className="relative px-1">
                            <input
                                type="range"
                                min="3000"
                                max="500000"
                                step="1000"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                                className="w-full h-1.5 bg-neutral-100 rounded-full appearance-none cursor-pointer accent-accent hover:accent-accent-shade transition-all"
                            />
                            <div className="flex justify-between mt-3 text-[9px] font-black text-neutral-500 uppercase tracking-[0.25em]">
                                <span>Min 3k</span>
                                <span>Max 500k</span>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* Type/Space Filters Section */}
                <div className="border-b border-neutral-100 pb-4 mb-1">
                    <button 
                        onClick={() => toggleSection('space')}
                        className="flex items-center justify-between w-full group py-2.5 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-all ${expandedSections.space ? 'bg-accent text-on-accent' : 'bg-neutral-50 text-neutral-400'}`}>
                                <Home size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">{viewType === 'rooms' ? 'Room Types' : 'Item Type'}</h4>
                        </div>
                        <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-500 ${expandedSections.space ? 'rotate-180 text-accent' : ''}`} />
                    </button>

                    <div className={`flex flex-wrap gap-2 transition-all duration-500 overflow-hidden ${expandedSections.space ? 'max-h-[500px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {(viewType === 'rooms' ? roomTypesList : furnitureCategoriesList).map(item => {
                            const count = counts.rooms[item] || 0;
                            const isActive = filters.roomTypes.includes(item);
                            return (
                                <button
                                    key={item}
                                    onClick={() => toggleRoom(item)}
                                    className={`group px-3 py-2 rounded-lg border-2 transition-all duration-500 flex items-center gap-2 active:scale-95 ${isActive 
                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl shadow-neutral-900/20' 
                                        : 'bg-white text-main border-neutral-50 hover:border-accent/10 hover:bg-neutral-50/50'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider">{item}</span>
                                    {count > 0 && (
                                        <span className={`text-[8px] font-black transition-colors ${isActive ? 'text-white/70' : 'text-neutral-500 group-hover:text-accent'}`}>
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {viewType === 'furniture' && productRoomTypesList.length > 0 && (
                <div className="border-b border-neutral-100 pb-4 mb-1">
                    <button
                        onClick={() => toggleSection('space')}
                        className="flex items-center justify-between w-full group py-2.5 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-neutral-50 text-neutral-400">
                                <Home size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">Room Type</h4>
                        </div>
                    </button>

                    <div className="flex flex-wrap gap-2 mt-3">
                        {productRoomTypesList.map(room => {
                            const count = counts.productRooms[room] || 0;
                            const isActive = (filters.productRoomTypes || []).includes(room);
                            return (
                                <button
                                    key={room}
                                    onClick={() => toggleProductRoomType(room)}
                                    className={`group px-3 py-2 rounded-lg border-2 transition-all duration-500 flex items-center gap-2 active:scale-95 ${isActive
                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl shadow-neutral-900/20'
                                        : 'bg-white text-main border-neutral-50 hover:border-accent/10 hover:bg-neutral-50/50'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider">{room}</span>
                                    {count > 0 && (
                                        <span className={`text-[8px] font-black transition-colors ${isActive ? 'text-white/70' : 'text-neutral-500 group-hover:text-accent'}`}>
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                )}

                {/* Aesthetic Filters Section */}
                {showAdvanced && (
                <div>
                    <button 
                        onClick={() => toggleSection('aesthetic')}
                        className="flex items-center justify-between w-full group py-2.5 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-all ${expandedSections.aesthetic ? 'bg-accent text-on-accent' : 'bg-neutral-50 text-neutral-400'}`}>
                                <Sparkles size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">Styles</h4>
                        </div>
                        <ChevronDown size={16} className={`text-neutral-500 transition-transform duration-500 ${expandedSections.aesthetic ? 'rotate-180 text-accent' : ''}`} />
                    </button>

                    <div className={`flex flex-wrap gap-2 transition-all duration-500 overflow-hidden ${expandedSections.aesthetic ? 'max-h-[500px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {aestheticsList.map(aesthetic => {
                            const count = counts.styles[aesthetic] || 0;
                            const isActive = filters.styles.includes(aesthetic);
                            return (
                                <button
                                    key={aesthetic}
                                    onClick={() => toggleStyle(aesthetic)}
                                    className={`group px-4 py-2.5 rounded-xl border-2 transition-all duration-500 flex items-center gap-2 active:scale-95 ${isActive 
                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl shadow-neutral-900/20' 
                                        : 'bg-white text-main border-neutral-50 hover:border-accent/10 hover:bg-neutral-50/50'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{aesthetic}</span>
                                    {count > 0 && (
                                        <span className={`text-[8px] font-black transition-colors ${isActive ? 'text-white/60' : 'text-neutral-500 group-hover:text-accent'}`}>
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                )}
            </div>

            {/* Global Actions */}
            <div className="mt-5 pt-5 border-t border-neutral-100">
                <button
                    type="button"
                    onClick={() => { setFilters({ ...INITIAL_FILTER_STATE }); setSortBy('recommended'); }}
                    className="w-full py-3.5 rounded-2xl border border-neutral-200 text-[10px] font-black uppercase tracking-[0.32em] text-neutral-600 hover:text-accent hover:border-accent hover:bg-accent/5 transition-all duration-500 group flex items-center justify-center gap-3"
                >
                    <SlidersHorizontal size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                    Reset All
                </button>
            </div>
        </div>
    );
};

export default FilterSidebar;
