import React, { useMemo } from 'react';
import { IndianRupee } from 'lucide-react';

const RelatedProducts = ({ currentProduct, allProducts, designs, onProductClick }) => {
    const fallbackImage = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400';

    // 1. Find products from the same collection (Design)
    const collectionProducts = useMemo(() => {
        const parentDesign = designs.find(d =>
            (d.products || []).some(p => p.id === currentProduct.id)
        );

        if (!parentDesign) return [];

        return (parentDesign.products || [])
            .filter(p => p.id !== currentProduct.id)
            .slice(0, 4);
    }, [currentProduct, designs]);

    // 2. Find similar products (Same category)
    const similarProducts = useMemo(() => {
        return allProducts
            .filter(p =>
                p.category === currentProduct.category &&
                p.id !== currentProduct.id &&
                !collectionProducts.some(cp => cp.id === p.id)
            )
            .sort(() => 0.5 - Math.random()) // Randomize slightly for variety
            .slice(0, 4);
    }, [currentProduct, allProducts, collectionProducts]);

    if (collectionProducts.length === 0 && similarProducts.length === 0) return null;

    const ProductSmallCard = ({ item }) => (
        <button
            onClick={() => onProductClick(item)}
            className="flex-shrink-0 w-40 group text-left transition-all hover:translate-y-[-4px]"
        >
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3 border border-premium flex items-center justify-center p-4">
                <img
                    src={item.image || item.image_url || fallbackImage}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        e.currentTarget.src = fallbackImage;
                    }}
                />
            </div>
            <div className="px-1">
                <span className="block text-[8px] font-black text-accent uppercase tracking-widest mb-1">{String(item.brand || '').trim().toLowerCase() !== 'unknown' && String(item.brand || '').trim() ? item.brand : (item.vendor || 'Marketplace')}</span>
                <h4 className="text-[10px] font-bold text-main line-clamp-1 mb-1">{item.name}</h4>
                <div className="flex items-center gap-0.5 text-main font-black">
                    <IndianRupee size={10} className="text-accent" />
                    <span className="text-[11px]">{(item.price || 0).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </button>
    );

    return (
        <div className="mt-12 space-y-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {/* Collection Section */}
            {collectionProducts.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-main/40">Complete the Look</h3>
                        <div className="h-[1px] flex-1 bg-premium mx-6 opacity-30" />
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                        {collectionProducts.map(item => (
                            <ProductSmallCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}

            {/* Similar Section */}
            {similarProducts.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-main/40">Similar Discoveries</h3>
                        <div className="h-[1px] flex-1 bg-premium mx-6 opacity-30" />
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                        {similarProducts.map(item => (
                            <ProductSmallCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RelatedProducts;
