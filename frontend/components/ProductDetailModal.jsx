import React, { useEffect } from 'react';
import { 
    X, ShoppingBag, Info, IndianRupee, Ruler, Palette, 
    Layers, Store, Award, ChevronRight, Share2, Heart,
    ArrowUpRight, BarChart3, LayoutGrid, ArrowLeft
} from 'lucide-react';
import ImageGallery from './ImageGallery';
import { toggleWatchlist, getUserProfile, getProductInsights } from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from './ToastContainer';
import { getProductShopUrl } from '../utils/productLinks';

const ProductDetailModal = ({ product, onClose }) => {
    const { toasts, removeToast, toast } = useToast();
    
    const [isSaved, setIsSaved] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [insights, setInsights] = React.useState({ priceAcrossPlatforms: [], similarProducts: [] });
    const [isInsightsLoading, setIsInsightsLoading] = React.useState(false);

    useEffect(() => {
        if (!product) return;
        const checkSavedStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const profile = await getUserProfile();
                if (profile.watchlist && profile.watchlist.includes(product.id)) {
                    setIsSaved(true);
                }
            } catch (err) {
                console.error("Error checking saved status:", err);
            }
        };
        checkSavedStatus();
    }, [product?.id]);

    useEffect(() => {
        if (!product) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [product]);

    useEffect(() => {
        if (!product?.id) return;

        const fetchInsights = async () => {
            setIsInsightsLoading(true);
            const data = await getProductInsights(product.id);
            setInsights(data);
            setIsInsightsLoading(false);
        };

        fetchInsights();
    }, [product?.id]);

    if (!product) return null;

    const imageUrl = product.image_url || product.image || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800';
    const gallery = product.gallery || [imageUrl];
    const linkUrl = getProductShopUrl(product);
    const normalizedBrand = String(product.brand || '').trim().toLowerCase();
    const brandLabel = normalizedBrand && normalizedBrand !== 'unknown'
        ? product.brand
        : (product.vendor || 'Marketplace');

    const handleToggleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to save items');
                return;
            }

            setIsSaving(true);
            await toggleWatchlist(product.id);
            setIsSaved(!isSaved);
            window.dispatchEvent(new CustomEvent('a2s-saved-update'));
            toast.success(isSaved ? 'Removed from saved list' : 'Saved to list');
        } catch (err) {
            console.error("Error toggling save:", err);
            toast.error('Failed to update saved list');
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareTitle = `${product.name} | A2S`;
        const shareText = `Check out ${product.name} in ${product.aestheticStyle || product.style || 'Minimal'} style on A2S.`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            }

            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
        } catch (err) {
            if (err?.name !== 'AbortError') {
                toast.error('Unable to share right now');
            }
        }
    };

    return (
        <div className="fixed top-16 md:top-[72px] inset-x-0 bottom-0 z-50 flex flex-col bg-white animate-fade-in overflow-hidden">
            {/* Immersive Full-Screen Header Actions */}
            <div className="absolute top-0 left-0 right-0 z-[210] p-8 flex justify-between items-center bg-gradient-to-b from-black/5 to-transparent pointer-events-none">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/80 hover:bg-main backdrop-blur-md text-main hover:text-white transition-all border border-main/10 shadow-2xl shadow-main/20 group pointer-events-auto"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Items</span>
                </button>

                <div className="flex items-center gap-3 pointer-events-auto">
                    <button 
                        onClick={handleToggleSave}
                        disabled={isSaving}
                        className={`p-4 rounded-full backdrop-blur-md transition-all border group ${isSaved ? 'bg-accent text-on-accent border-accent' : 'bg-black/5 hover:bg-black/10 text-main border-black/5'}`}
                    >
                        <Heart size={20} className={`${isSaved ? 'fill-current scale-110' : 'group-hover:scale-110'} transition-transform`} />
                    </button>
                    <button 
                        onClick={handleShare}
                        className="p-4 rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-md text-main transition-all border border-black/5 group"
                    >
                        <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row w-full h-full overflow-hidden">
                {/* Left: Immersive Visual Section (Contain style for full product visibility) */}
                <div className="w-full md:w-[60%] h-[50vh] md:h-full bg-[#f8f8f8] overflow-hidden relative group flex items-center justify-center p-12 lg:p-24">
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageGallery mainImage={imageUrl} gallery={gallery} title={product.name} />
                    </div>
                        {/* Style Label Badge - Removed as requested */}
                    </div>

                    {/* Right: Technical detail section */}
                    <div className="flex-1 overflow-y-auto p-12 md:p-16 custom-scrollbar bg-white">
                        {/* Aesthetic Style Badge */}
                        <div className="flex items-center gap-3 mb-8">
                            <span className="px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-black uppercase tracking-[0.2em]">
                                ✨ {product.aestheticStyle || product.style || 'Minimal'}
                            </span>
                        </div>

                        {/* Breadcrumb / Category */}
                        <div className="flex items-center gap-3 mb-10">
                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">{brandLabel}</span>
                            <div className="w-6 h-px bg-neutral-100" />
                            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.3em]">{product.category || 'Item'}</span>
                        </div>

                        {/* Heading */}
                        <div className="mb-14">
                            <h2 className="font-serif text-[42px] md:text-[56px] font-black text-main leading-[1.05] italic tracking-tighter mb-6">
                                {product.name}
                            </h2>
                            <p className="text-sm text-neutral-400 font-medium leading-relaxed max-w-md">
                                {product.description || 'High-quality furniture carefully selected to match your home style. Every piece is built with premium materials and designed for both comfort and beauty.'}
                            </p>
                        </div>

                        {/* Specs & Intelligence Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
                            <div className="space-y-10">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2">
                                        <IndianRupee size={12} /> Price
                                    </span>
                                    <div className="text-4xl font-black text-main tracking-tighter">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 border-l-2 border-accent/20 pl-6">
                                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Sold By</span>
                                    <span className="text-xs font-black text-main uppercase tracking-widest flex items-center gap-2">
                                        <Store size={14} className="text-accent" />
                                        {product.vendor || 'Merchant'}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1.5 border-l-2 border-accent/20 pl-6">
                                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Brand</span>
                                    <span className="text-xs font-black text-main uppercase tracking-widest">
                                        {brandLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 p-8 rounded-[32px] bg-neutral-50/50 border border-neutral-100">
                                <div className="flex items-start gap-4">
                                    <Palette size={16} className="text-accent flex-shrink-0 mt-1" />
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Color</span>
                                        <div className="flex items-center gap-3 mt-1">
                                            {product.colorHex && (
                                                <div 
                                                    className="w-8 h-8 rounded-full border-2 border-neutral-200 shadow-sm"
                                                    style={{ backgroundColor: product.colorHex }}
                                                    title={product.color}
                                                />
                                            )}
                                            <span className="text-[11px] font-black text-main uppercase tracking-widest">
                                                {product.color || 'Multi-tone'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Layers size={16} className="text-accent flex-shrink-0 mt-1" />
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Material</span>
                                        <span className="text-[11px] font-black text-main uppercase tracking-widest mt-1">{product.material || 'Premium Finish'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Ruler size={16} className="text-accent flex-shrink-0 mt-1" />
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Dimensions</span>
                                        <span className="text-[11px] font-black text-main uppercase tracking-widest mt-1">{product.dimensions || 'Hand-measured'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Platform Price Comparison */}
                        <div className="mb-14 p-10 rounded-[40px] bg-neutral-50 border border-neutral-100 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 flex items-center gap-2">
                                    <BarChart3 size={11} /> Price Across Platforms
                                </h4>
                                {insights.priceAcrossPlatforms?.length > 0 && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Live Comparison</span>
                                )}
                            </div>

                            {isInsightsLoading ? (
                                <div className="text-[11px] font-bold text-neutral-400">Checking best prices...</div>
                            ) : insights.priceAcrossPlatforms?.length > 0 ? (
                                <div className="space-y-3">
                                    {insights.priceAcrossPlatforms.slice(0, 4).map((option, index) => (
                                        <a
                                            key={`${option.vendor}-${index}`}
                                            href={option.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 hover:border-accent/50 transition-all bg-white"
                                        >
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-main">{option.vendor}</p>
                                                {option.cheapest && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Cheapest</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-main">₹{Number(option.price || 0).toLocaleString('en-IN')}</p>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Open Link</p>
                                            </div>
                                        </a>
                                    ))}
                                    {insights.priceAcrossPlatforms.length === 1 && (
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 pt-2">
                                            Import more vendors to compare prices across platforms.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[11px] font-bold text-neutral-400">
                                    Import more vendors to compare prices across platforms.
                                </div>
                            )}
                        </div>

                        {/* CTA Section */}
                        <div className="flex flex-col gap-4 mb-14">
                                {linkUrl !== '#' ? (
                                    <a 
                                        href={linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-premium btn-premium-gold w-full flex items-center justify-center gap-4 py-6 shadow-2xl shadow-accent/20 text-[13px] font-black uppercase tracking-[0.4em] group"
                                    >
                                        <span>Visit Merchant</span>
                                        <ArrowUpRight size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </a>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="btn-premium w-full flex items-center justify-center gap-4 py-6 text-[13px] font-black uppercase tracking-[0.4em] opacity-50 cursor-not-allowed"
                                    >
                                        <span>Merchant Link Unavailable</span>
                                    </button>
                                )}
                                <p className="text-[9px] text-center font-bold text-neutral-300 uppercase tracking-widest">
                                    {linkUrl !== '#' ? "Affiliate link • Check availability on merchant's website" : 'Link not available for this item'}
                                </p>
                        </div>

                        {/* Similar Products */}
                        <div className="pt-10 border-t border-neutral-50 overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <LayoutGrid size={16} className="text-neutral-300" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Similar Items</h4>
                                </div>
                                {insights.similarProducts?.length > 0 && (
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-accent/60">Matched Variants</span>
                                )}
                            </div>

                            {insights.similarProducts?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {insights.similarProducts.slice(0, 4).map((item) => (
                                        <a
                                            key={item.id}
                                            href={item.link || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-accent/50 transition-all"
                                        >
                                            <img
                                                src={item.image || imageUrl}
                                                alt={item.name}
                                                className="w-16 h-16 rounded-xl object-cover bg-neutral-100"
                                                onError={(e) => { e.target.src = imageUrl; }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-accent">{item.vendor}</p>
                                                <p className="text-[11px] font-bold text-main line-clamp-1">{item.name}</p>
                                                <p className="text-[10px] font-black text-main">₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                                                    {(item.color || 'Variant')} • {(item.style || 'Contemporary')}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[11px] font-bold text-neutral-400">
                                    Similar variants will appear after scraping more color/style options.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default ProductDetailModal;
