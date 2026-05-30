import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800';

export default function ImageGallery({ mainImage, gallery = [], title = "Design Detail" }) {
    const images = [mainImage, ...gallery].filter(Boolean);
    const [activeIndex, setActiveIndex] = useState(0);

    const next = () => setActiveIndex((prev) => (prev + 1) % images.length);
    const prev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

    if (!images.length) return null;

    return (
        <div className="flex flex-col gap-4 w-full h-full group">
            {/* Main Viewport */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-neutral-100 shadow-2xl transition-all duration-700 hover:shadow-black/10">
                <img
                    src={images[activeIndex]}
                    alt={`${title} view ${activeIndex + 1}`}
                    className="w-full h-full object-cover animate-in fade-in zoom-in duration-500"
                    key={activeIndex}
                    onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                />

                {/* Overlay Controls */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={prev}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 border border-white/30 text-white transition-all transform hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 border border-white/30 text-white transition-all transform hover:scale-110 active:scale-95"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Counter Badge */}
                <div className="absolute bottom-6 right-6 px-4 py-2 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 text-white text-xs font-medium tracking-tight">
                    {activeIndex + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto py-2 scrollbar-none px-1">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`relative min-w-[100px] h-[64px] rounded-xl overflow-hidden border-2 transition-all duration-300 transform ${activeIndex === idx
                                    ? 'border-yellow-500 scale-105 shadow-lg'
                                    : 'border-transparent hover:border-black/20 hover:scale-105 opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={img}
                                className="w-full h-full object-cover"
                                alt={`Thumb ${idx}`}
                                onError={(e) => {
                                    e.currentTarget.src = FALLBACK_IMAGE;
                                }}
                            />
                            {activeIndex === idx && (
                                <div className="absolute inset-0 bg-yellow-500/10 pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
