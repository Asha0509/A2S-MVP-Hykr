import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, IndianRupee, Eye, ShoppingBag } from 'lucide-react';
import { isDesignSaved, toggleSavedDesign } from '../utils/storage';

const DesignCardList = ({ design, onQuickPreview }) => {
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSaved(isDesignSaved(design.id));
    }, [design.id]);

    const handleSaveClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(toggleSavedDesign(design.id));
    };

    return (
        <div className="group card-luxury overflow-hidden flex flex-row h-44 bg-white">
            {/* Image */}
            <div className="relative w-56 flex-shrink-0 overflow-hidden">
                <img
                    src={design.image}
                    alt={design.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Price Badge */}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-a2s-charcoal/90 backdrop-blur-md rounded-lg text-xs font-black text-white tracking-wider border border-white/10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-a2s-gold animate-pulse" />
                    <IndianRupee size={10} className="text-a2s-gold" /> {(design.totalCost / 1000).toFixed(0)}k
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-a2s-gold uppercase tracking-[0.2em]">{design.roomType}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{design.style}</span>
                    </div>
                    <h3 className="font-serif text-lg font-black text-a2s-charcoal leading-tight group-hover:text-a2s-gold transition-colors truncate">
                        {design.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{design.description}</p>
                </div>

                <div className="flex items-center justify-between gap-3 mt-3">
                    <div className="flex flex-wrap gap-1.5">
                        {design.tags && design.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {onQuickPreview && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickPreview(design); }}
                                className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-a2s-gold/10 hover:text-a2s-gold transition"
                                aria-label="Quick preview"
                            >
                                <Eye size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSaveClick}
                            className={`p-2 rounded-xl transition ${saved ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:text-red-500'}`}
                            aria-label={saved ? 'Unsave' : 'Save'}
                        >
                            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
                        </button>
                        <Link
                            to={`/design/${design.id}`}
                            className="px-4 py-2 rounded-xl bg-a2s-charcoal text-white text-xs font-bold uppercase tracking-widest hover:bg-a2s-gold hover:text-a2s-charcoal transition"
                        >
                            View
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignCardList;
