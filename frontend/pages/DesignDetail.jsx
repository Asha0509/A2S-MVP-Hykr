import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, IndianRupee, ShoppingBag, Sparkles, ExternalLink, ArrowRight, ChevronRight } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';
import { isDesignSaved } from '../utils/storage';
import { getProductShopUrl, openProductInNewTab } from '../utils/productLinks';
import { getDesignById, saveDesign, getUserProfile } from '../services/api';

const DesignDetail = () => {
    const { id } = useParams();
    const [design, setDesign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const productsRef = useRef(null);
    const { toasts, removeToast, toast } = useToast();

    useEffect(() => {
        const fetchDesignAndStatus = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const found = await getDesignById(id);
                setDesign(found);
                if (localStorage.getItem('token')) {
                    try {
                        const profile = await getUserProfile();
                        if (profile && profile.savedDesigns) {
                            setIsSaved(profile.savedDesigns.includes(id));
                        }
                    } catch (authErr) {
                        setIsSaved(isDesignSaved(id));
                    }
                } else {
                    setIsSaved(isDesignSaved(id));
                }
            } catch (err) {
                console.error(err);
                setDesign(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDesignAndStatus();
    }, [id]);

    const toggleSave = async () => {
        if (!id) return;
        try {
            const updatedSavedDesigns = await saveDesign(id);
            const nowSaved = updatedSavedDesigns.includes(id);
            setIsSaved(nowSaved);
            window.dispatchEvent(new CustomEvent('a2s-saved-update'));
            toast.success(nowSaved ? 'Design saved to your collection!' : 'Design removed from your collection.');
        } catch (e) {
            console.error('Error toggling save:', e);
            toast.error('Could not update saved designs. Please try again.');
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share && design) {
                await navigator.share({
                    title: design.title,
                    text: design.description,
                    url,
                });
                toast.success('Design shared successfully!');
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            }
        } catch (e) {
            // User cancelled share dialog or clipboard failed
            if (e.name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(url);
                    toast.success('Link copied to clipboard!');
                } catch {
                    toast.error('Could not share. Please copy the URL manually.');
                }
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-main pt-24 flex items-center justify-center transition-all duration-1000">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent animate-pulse">Architect Thinking...</p>
                </div>
            </div>
        );
    }

    if (!design) {
        return (
            <div className="min-h-screen bg-main pt-24 flex items-center justify-center transition-all duration-1000 px-6">
                <div className="flex flex-col items-center gap-8 text-center max-w-md">
                    <p className="font-serif text-2xl font-black text-main italic">We couldn&apos;t load this design.</p>
                    <p className="text-muted text-sm font-light">It may have been removed or the link is invalid.</p>
                    <Link to="/gallery" className="btn-premium btn-premium-gold">
                        <span>Back to Gallery</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-main transition-all duration-1000 relative overflow-hidden">
            {/* Ambient Background Orbs */}
            <div className="ambient-orb ambient-orb-1 opacity-60" />
            <div className="ambient-orb ambient-orb-2 opacity-60" />
            <div className="flex flex-col lg:flex-row min-h-screen">

                {/* Visual Panel (Sticky) */}
                <div className="w-full lg:w-[55%] lg:h-[calc(100vh-80px)] lg:sticky lg:top-20 relative overflow-hidden bg-neutral-100 flex items-center justify-center p-8 lg:p-12">
                    <div className="w-full h-full max-w-4xl">
                        <ImageGallery
                            mainImage={design.image}
                            gallery={design.gallery}
                            title={design.title}
                        />
                    </div>

                    {/* Floating Navigation — pushed down to avoid header overlap */}
                    <div className="absolute top-24 left-12 z-20 flex gap-4">
                        <Link
                            to="/gallery"
                            className="p-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full text-white hover:bg-accent hover:border-accent transition-all duration-500 group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <button
                            onClick={handleShare}
                            className="px-6 py-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-main transition-all duration-500 flex items-center gap-2"
                        >
                            <Share2 size={14} />
                            Share Narrative
                        </button>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute bottom-12 left-12 right-12 z-20 hidden lg:block animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="text-accent" size={16} />
                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Expert Curation</span>
                        </div>
                        <h1 className="font-serif text-6xl font-black text-white italic tracking-tighter mb-4 leading-[0.9]">
                            {design.title}
                        </h1>
                    </div>
                </div>

                {/* Editorial Content Panel — starts after the header */}
                <div className="w-full lg:w-[45%] bg-white p-8 md:p-16 lg:p-24 lg:pt-32 pt-28 overflow-y-auto transition-all duration-1000">
                    {/* Breadcrumb */}
                    <nav className="breadcrumb mb-8" aria-label="Breadcrumb">
                        <Link to="/gallery">Gallery</Link>
                        <ChevronRight size={10} className="separator" />
                        <span className="text-accent">{design.title}</span>
                    </nav>

                    <header className="mb-16">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <span className="section-tag mb-4">{design.style} Style</span>
                                <h1 className="font-serif text-5xl font-black text-main lg:hidden mb-8 tracking-tighter leading-none">{design.title}</h1>
                                <p className="text-xl text-neutral-500 font-light italic leading-relaxed max-w-lg">
                                    "{design.description}"
                                </p>
                            </div>
                            <button
                                onClick={toggleSave}
                                className={`p-4 rounded-full transition-all duration-500 ${isSaved ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-110' : 'bg-neutral-50 text-neutral-300 hover:text-accent'}`}
                            >
                                <Heart size={20} fill={isSaved ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8 border-t border-premium pt-8">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 block mb-2">Estimated Price</span>
                                <div className="flex items-center gap-2 text-2xl font-black text-main tracking-tighter">
                                    <IndianRupee size={18} className="text-accent" />
                                    <span>{design.totalCost.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 block mb-2">Contents</span>
                                <div className="text-2xl font-black text-main tracking-tighter">
                                    {design.products?.length || 0} <span className="text-sm font-bold text-gray-300">Products</span>
                                </div>
                            </div>
                        </div>

                        {/* Room Tags */}
                        {design.tags && design.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-6">
                                {design.tags.map(tag => (
                                    <span key={tag} className="px-4 py-1.5 rounded-full bg-accent/5 text-[9px] font-black uppercase tracking-widest text-accent border border-accent/10">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </header>

                    {/* Sourcing Section */}
                    <section ref={productsRef} className="space-y-16" aria-label="Product elements">
                        <div className="flex justify-between items-end border-b border-premium pb-8">
                            <h2 className="font-serif text-3xl font-black italic text-main">Product List</h2>
                            <button onClick={() => productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-main transition-colors">
                                See Details
                            </button>
                        </div>

                        {/* Categorized Products */}
                        {Object.entries(
                            (design.products || []).reduce((acc, p) => {
                                const cat = p.category || 'Essential';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(p);
                                return acc;
                            }, {})
                        ).map(([category, products]) => (
                            <div key={category} className="space-y-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 flex items-center gap-4">
                                    <span className="w-12 h-px bg-gray-100" />
                                    {category}
                                </h3>
                                <div className="space-y-6">
                                    {products.map(product => (
                                        <div key={product.id} className="group flex gap-8 items-center py-4 hover:px-4 hover:bg-accent/5 rounded-3xl transition-all duration-500">
                                            <div className="w-24 h-24 bg-surface rounded-2xl overflow-hidden border border-premium p-2 flex-shrink-0 group-hover:shadow-premium transition-all">
                                                <img
                                                    src={product.image || product.image_url || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400'}
                                                    className="w-full h-full object-contain"
                                                    alt=""
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400';
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-serif text-lg font-black italic text-main">{product.name}</h4>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{product.brand && product.brand.toLowerCase() !== 'unknown' ? product.brand : (product.vendor || 'Marketplace')}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-main font-black">
                                                        <IndianRupee size={12} className="text-accent" />
                                                        <span className="text-sm tracking-tighter">{product.price.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openProductInNewTab(product)}
                                                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-accent border-b border-accent/20 pb-1 hover:border-accent transition-all"
                                                >
                                                    <span>Buy at Merchant</span>
                                                    <ExternalLink size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Global Sourcing Action */}
                    <footer className="mt-24 pt-16 border-t border-premium">
                        <button
                            className="w-full py-6 rounded-full bg-main text-on-accent text-[10px] font-black uppercase tracking-[0.4em] hover:bg-accent hover:text-on-accent transition-all duration-700 shadow-premium flex items-center justify-center gap-4 group"
                        >
                            <span>Buy Full Collection</span>
                            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </footer>
                </div>
            </div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default DesignDetail;
