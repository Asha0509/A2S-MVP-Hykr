import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Heart,
    Box,
    User,
    ShoppingBag,
    Lock,
    Copy,
    Check,
    Layout,
    LogOut,
    Dna,
    Sparkles,
    Trash2,
    ArrowUpRight,
    RotateCcw,
    Compass,
    Zap,
    Users,
    ScanLine,
    Camera,
} from 'lucide-react';

import { STORAGE_KEYS, clearUser } from '../utils/storage';
import { getUserProfile, getDesigns, saveDesign, toggleWatchlist, getProducts, updateUserProfile, getWaitlistStatus, joinPhase2Waitlist } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import ConfirmationModal from '../components/ConfirmationModal';
import LockedFeatureOverlay from '../components/LockedFeatureOverlay';
import TutorialOverlay from '../components/TutorialOverlay';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';
import { useStore } from '../store/useStore';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Zustand Store Hooks
    const user = useStore(state => state.user);
    const consultantCredits = useStore(state => state.consultantCredits);
    const vastuCredits = useStore(state => state.vastuCredits);
    const savedDesignsCount = useStore(state => state.savedDesigns?.length || 0);
    const setProfile = useStore(state => state.setProfile);
    const logout = useStore(state => state.logout);

    const [savedDesigns, setSavedDesigns] = useState([]);
    const [savedProducts, setSavedProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [is3DLockedOpen, setIs3DLockedOpen] = useState(false);
    const [designToDelete, setDesignToDelete] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('overview');
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [waitlistStatus, setWaitlistStatus] = useState({ joined: false, rank: null, totalWaitlist: 0, inviteCode: '' });
    const [joiningWaitlist, setJoiningWaitlist] = useState(false);
    const [waitlistCopied, setWaitlistCopied] = useState(false);
    const { toasts, removeToast, toast } = useToast();


    const fetchProfileData = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            setError(null);
            const profile = await getUserProfile();
            // This now updates the Zustand store via getUserProfile internal sync

            // Fetch saved designs details
            if (profile.savedDesigns && profile.savedDesigns.length > 0) {
                const allDesigns = await getDesigns();
                const saved = allDesigns.filter((d) => profile.savedDesigns.includes(d.id));
                setSavedDesigns(saved || []);
            }

            // Fetch watchlist products
            const allProds = await getProducts();
            setAllProducts(allProds || []);
            if (profile.watchlist && profile.watchlist.length > 0) {
                const savedProds = allProds.filter(p => profile.watchlist.includes(p.id));
                setSavedProducts(savedProds || []);
            }
        } catch (e) {
            console.error('Failed to fetch profile:', e);
            // If we get a 401, the token is invalid/expired. 
            // We should clear it and let the user re-login rather than showing a generic error.
            const errorMsg = typeof e === 'string' ? e : (e.message || '');
            if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
                 await clearUser();
                 navigate('/login', { state: { from: location } });
            } else {
                 setError('Unable to load your profile. Please check your connection and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && !user.tutorialCompleted) {
            // Delay slightly to allow dashboard animations to finish
            const timer = setTimeout(() => setIsTutorialOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleTutorialFinish = async () => {
        try {
            await updateUserProfile({ tutorialCompleted: true });
            setIsTutorialOpen(false);
            toast.success("Tutorial completed! You're all set.");
        } catch (err) {
            console.error("Failed to mark tutorial as completed:", err);
            setIsTutorialOpen(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    useEffect(() => {
        const handler = () => fetchProfileData(false); // Don't show full loading overlay for updates
        window.addEventListener('a2s-saved-update', handler);
        return () => window.removeEventListener('a2s-saved-update', handler);
    }, []);


    useEffect(() => {
        if (location.state?.activeView) {
            setActiveView(location.state.activeView);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);


    useEffect(() => {
        getWaitlistStatus()
            .then(data => setWaitlistStatus(data))
            .catch(() => {});
    }, []);

    const handleJoinWaitlist = async () => {
        setJoiningWaitlist(true);
        try {
            await joinPhase2Waitlist();
            const data = await getWaitlistStatus();
            setWaitlistStatus(data);
            toast.success("You're on the waitlist! Check your position below.");
        } catch (err) {
            const msg = typeof err === 'string' ? err : 'Failed to join waitlist. Please try logging out and back in.';
            toast.error(msg);
        } finally {
            setJoiningWaitlist(false);
        }
    };

    const copyWaitlistCode = () => {
        if (waitlistStatus.inviteCode) {
            navigator.clipboard.writeText(waitlistStatus.inviteCode);
            setWaitlistCopied(true);
            setTimeout(() => setWaitlistCopied(false), 2000);
        }
    };

    const handleLogout = async () => {
        logout();
        navigate('/');
    };


    const handleRefineStyle = () => {
        setIsRefineModalOpen(true);
    };

    const confirmRefineStyle = async () => {
        try {
            // Update backend to clear DNA
            await updateUserProfile({ 
                styleDNA: null, 
                styleSelections: [] 
            });
            
            // Clear local storage
            localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PREFERENCES);
            
            // Close modal and navigate
            setIsRefineModalOpen(false);
            navigate('/onboarding');
            toast.success("Style profile reset. Let's start fresh!");
        } catch (err) {
            console.error("Failed to reset style DNA:", err);
            toast.error("Failed to reset style profile. Please try again.");
            setIsRefineModalOpen(false);
        }
    };

    const handleDeleteDesign = (e, design) => {
        e.preventDefault();
        e.stopPropagation();
        setDesignToDelete(design);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteDesign = async () => {
        if (designToDelete) {
            try {
                await saveDesign(designToDelete.id);
                setSavedDesigns(prev => prev.filter(d => d.id !== designToDelete.id));
                setIsDeleteModalOpen(false);
                setDesignToDelete(null);
            } catch (err) {
                console.error("Failed to delete design:", err);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-a2s-cream/50 to-white pt-24 pb-16 flex items-center justify-center px-4">
                <LoadingSpinner message="Loading your dashboard..." size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-a2s-cream/50 to-white pt-24 pb-16 flex items-center justify-center px-4">
                <ErrorDisplay
                    message="Couldn't load your dashboard"
                    details={error}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-a2s-cream/50 to-white pt-24 pb-16 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white rounded-2xl luxury-shadow border border-gray-100 p-10">
                        <div className="w-16 h-16 rounded-2xl bg-a2s-gold/15 flex items-center justify-center mx-auto mb-6">
                            <User size={32} className="text-a2s-gold" />
                        </div>
                        <h1 className="font-serif text-2xl font-bold text-a2s-charcoal mb-2">Your Dashboard</h1>
                        <span className="section-underline block mb-4" aria-hidden="true" />
                        <p className="text-gray-600 mb-8">
                            Sign in to see your saved designs, 3D projects, and a personalized dashboard.
                        </p>
                        <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                            Sign in to continue
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const attributedBuilder = (typeof window !== 'undefined' && localStorage.getItem('a2s-attributed-builder')) || '';
    const builderLabel = attributedBuilder
        ? attributedBuilder.split('-').slice(0, -1).join(' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : '';

    return (
        <div className="min-h-screen bg-main pb-20 relative overflow-hidden transition-all duration-1000">
            <div className="ambient-orb ambient-orb-1 opacity-40 blur-[120px]" />
            <div className="ambient-orb ambient-orb-2 opacity-40 blur-[120px]" />

            <div className="max-w-[1600px] mx-auto px-8 pt-32 lg:pt-40">
                {attributedBuilder && (
                    <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-xs">
                        <span className="text-accent font-semibold uppercase tracking-wider">via {builderLabel || 'Builder Partner'}</span>
                        <span className="text-muted">· Your buyer experience is hosted by A2S</span>
                    </div>
                )}
                <header className="mb-10 animate-fade-in-up">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-px bg-accent" />
                                <span className="text-[10px] font-black text-accent uppercase tracking-[0.5em]">Dashboard</span>
                            </div>
                            <h1 className="font-serif text-5xl md:text-7xl font-black text-main leading-[0.95] tracking-tighter mb-6">
                                Hello, <span className="text-gradient-gold italic">{(user?.name || '').trim().split(/\s+/)[0] || 'there'}</span>
                            </h1>
                            <p className="text-muted text-lg font-light max-w-xl leading-relaxed">
                                Welcome to your personal dashboard. Here you can see your saved designs and 3D projects.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Status</p>
                                <p className="text-xs font-black text-main uppercase racking-wider">Member</p>
                            </div>
                            <div className="w-px h-12 bg-premium hidden sm:block" />
                            <button
                                onClick={handleLogout}
                                className="group flex items-center gap-3 px-6 py-3 rounded-full border border-premium hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-500"
                            >
                                <LogOut size={14} className="text-muted group-hover:text-red-500 transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-red-500">Log Out</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 border-b border-premium pb-0">
                        <button 
                            onClick={() => setActiveView('overview')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.4em] transition-all relative ${activeView === 'overview' ? 'text-accent' : 'text-muted hover:text-main'}`}
                        >
                            Overview
                            {activeView === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent animate-width-in" />}
                        </button>
                        <button 
                            onClick={() => setActiveView('3d-studio')}
                            className={`pb-4 text-[11px] font-black uppercase tracking-[0.4em] transition-all relative ${activeView === '3d-studio' ? 'text-accent' : 'text-muted hover:text-main'}`}
                        >
                            3D Studio
                            {activeView === '3d-studio' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent animate-width-in" />}
                        </button>
                    </div>
                </header>

                <div className="transition-all duration-700">
                    {activeView === 'overview' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-in">
                            <div className="lg:col-span-8 space-y-12">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up stagger-1">
                                    <div className="glass-premium p-8 rounded-[40px] border border-premium group hover:border-accent/30 transition-all duration-700">
                                        <div className="w-12 h-12 rounded-2xl bg-main/5 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                                            <User size={22} />
                                        </div>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-2">Member</p>
                                        <h3 className="font-serif text-xl font-black text-main italic truncate">{user.name}</h3>
                                        <p className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">{user.location || 'India'}</p>
                                    </div>
    
                                    <div className="glass-premium p-8 rounded-[40px] border border-premium group hover:border-accent/30 transition-all duration-700">
                                        <div className="w-12 h-12 rounded-2xl bg-main/5 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                                            <Sparkles size={22} />
                                        </div>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-2">AI Consultant</p>
                                        <h3 className="font-serif text-4xl font-black text-main italic">{user.consultantCredits}</h3>
                                        <p className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Left • {user.consultantCredits > 0 ? 'Active' : 'Exhausted'}</p>
                                    </div>

                                    <div className="glass-premium p-8 rounded-[40px] border border-premium group hover:border-accent/30 transition-all duration-700">
                                        <div className="w-12 h-12 rounded-2xl bg-main/5 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                                            <Layout size={22} />
                                        </div>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-2">Vastu Audits</p>
                                        <h3 className="font-serif text-4xl font-black text-main italic">{user.vastuCredits}</h3>
                                        <p className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Left • Fixed Limit</p>
                                    </div>
    
                                    <div className="glass-premium p-8 rounded-[40px] border border-premium group hover:border-accent/30 transition-all duration-700">
                                        <div className="w-12 h-12 rounded-2xl bg-main/5 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                                            <Heart size={22} />
                                        </div>
                                        <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-2">In Your List</p>
                                        <h3 className="font-serif text-4xl font-black text-main italic">{((savedDesigns?.length || 0) + (savedProducts?.length || 0))}</h3>
                                        <p className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Saved Items</p>
                                    </div>
                                </div>
    
                                <section className="animate-fade-in-up stagger-2">
                                    <div className="flex items-center justify-between mb-8 px-4">
                                        <div>
                                            <h2 className="font-serif text-3xl font-black text-main italic">Saved Items</h2>
                                            <p className="text-[10px] text-muted font-black uppercase tracking-[0.3em] mt-2">Your Collection</p>
                                        </div>
                                        <Link to="/gallery" className="text-[10px] font-black text-accent uppercase tracking-[0.4em] hover:text-main transition-colors border-b border-accent/20 pb-1">
                                            Return to Gallery
                                        </Link>
                                    </div>
    
                                    {savedDesigns.length > 0 || savedProducts.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {savedDesigns.map((design) => (
                                                <article
                                                    key={`design-${design.id}`}
                                                    className="group relative rounded-[40px] overflow-hidden glass-premium border border-premium hover:border-accent/40 shadow-sm transition-all duration-700"
                                                >
                                                    <Link to={`/design/${design.id}`} className="block">
                                                        <div className="aspect-[4/5] overflow-hidden relative">
                                                            <img
                                                                src={design.image}
                                                                alt=""
                                                                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                                            <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
                                                                <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 shadow-xl scale-0 group-hover:scale-100 transition-transform duration-500">
                                                                    <Heart size={16} fill="currentColor" />
                                                                </div>
                                                                <button 
                                                                    onClick={(e) => handleDeleteDesign(e, design)}
                                                                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500 shadow-xl scale-0 group-hover:scale-100 transition-all duration-500 delay-75"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="p-8">
                                                            <p className="text-[9px] font-black text-accent uppercase tracking-[0.3em] mb-2">{design.style} Style</p>
                                                            <h3 className="font-serif text-xl font-black text-main italic group-hover:text-accent transition-colors truncate">
                                                                {design.title}
                                                            </h3>
                                                        </div>
                                                    </Link>
                                                </article>
                                            ))}
    
                                            {savedProducts.map((product) => (
                                                <article
                                                    key={`product-${product.id}`}
                                                    className="group relative rounded-[40px] overflow-hidden glass-premium border border-premium hover:border-accent/40 shadow-sm transition-all duration-700"
                                                >
                                                    <div className="aspect-[4/5] overflow-hidden relative">
                                                        <img
                                                            src={product.image || product.image_url}
                                                            alt=""
                                                            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                                                            onError={(e) => {
                                                                e.currentTarget.src = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                                        <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
                                                            <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 shadow-xl scale-0 group-hover:scale-100 transition-transform duration-500">
                                                                <Heart size={16} fill="currentColor" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-8">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="text-[9px] font-black text-accent uppercase tracking-[0.3em]">{product.brand && product.brand.toLowerCase() !== 'unknown' ? product.brand : (product.vendor || 'Marketplace')}</p>
                                                            <p className="text-[10px] font-black text-main italic">₹{product.price?.toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <h3 className="font-serif text-xl font-black text-main italic group-hover:text-accent transition-colors truncate">
                                                            {product.name}
                                                        </h3>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="glass-premium p-20 rounded-[48px] border border-premium text-center">
                                            <div className="w-20 h-20 rounded-[32px] bg-main/5 flex items-center justify-center text-accent/30 mx-auto mb-8 border border-premium">
                                                <Heart size={32} />
                                            </div>
                                            <h3 className="font-serif text-2xl font-black text-main italic mb-4">No saved items</h3>
                                            <p className="text-muted text-sm font-light mb-10 max-w-xs mx-auto">
                                                Browse our gallery and save your favorite items here.
                                            </p>
                                            <Link to="/gallery" className="btn-premium btn-premium-gold">
                                                <span>Return to Gallery</span>
                                            </Link>
                                        </div>
                                    )}
                                </section>
    
                                <section className="animate-fade-in-up stagger-4 section-glass-highlight">
                                     <div className="bg-main rounded-[60px] border border-premium shadow-premium p-10 md:p-16 relative overflow-hidden group hover:border-accent/40 transition-all duration-1000">
                                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-accent/10 transition-all duration-1000" />
                                        
                                        <div className="relative z-10">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 rounded-xl bg-accent/10 text-accent">
                                                            <Dna size={16} />
                                                        </div>
                                                        <h2 className="font-serif text-4xl font-black text-main italic">Your Style Report</h2>
                                                    </div>
                                                    <p className="text-[10px] text-muted tracking-[0.4em] font-black uppercase">We analyze your favorites to help you find your style.</p>
                                                </div>
                                                {user?.styleDNA && (
                                                    <div className="flex flex-wrap gap-4">
                                                        <button 
                                                            onClick={handleRefineStyle}
                                                            className="btn-premium btn-premium-outline px-6 py-3 group flex items-center gap-2"
                                                        >
                                                            <RotateCcw size={14} className="text-accent group-hover:-rotate-90 transition-transform" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Refine Your Style</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => navigate('/gallery')}
                                                            className="btn-premium btn-premium-outline px-6 py-3 group flex items-center gap-2"
                                                        >
                                                            <Compass size={14} className="text-accent group-hover:rotate-45 transition-transform" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Browse Inspirations</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
    
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                                <div className="space-y-10">
                                                    <div className="p-4 border-l-2 border-accent">
                                                        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-6">Style Profile</h3>
                                                        {user?.styleDNA ? (
                                                            <div className="flex flex-col gap-6">
                                                                <div className="text-xs font-black text-accent uppercase tracking-[0.2em] mb-2">Style DNA: {user.styleDNA === 'Diverse' ? 'Multilayered' : user.styleDNA}</div>
                                                                <div className="text-4xl md:text-6xl font-serif font-black text-main leading-[0.9] italic">
                                                                    You love <span className="text-gradient-gold">{user.styleDNA === 'Diverse' ? 'Multilayered' : user.styleDNA}</span>
                                                                </div>
                                                                <p className="text-sm text-muted leading-relaxed font-light max-w-md mt-4">
                                                                    {user.styleDNA === 'Diverse' 
                                                                        ? "Your taste transcends boundaries, blending unexpected textures and eras into a unique aesthetic tapestry."
                                                                        : `Your choices suggest a deep connection to ${user.styleDNA.toLowerCase()} principles, favoring clarity and intentionality.`
                                                                    }
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-8">
                                                                <p className="text-sm text-muted italic font-light leading-relaxed">Choose some favorite designs to see your style report here.</p>
                                                                <Link to="/onboarding" className="btn-premium btn-premium-gold w-fit">
                                                                    <span>Get Started</span>
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-10">
                                                    <div className="flex flex-col gap-6">
                                                        <div className="p-10 rounded-[48px] bg-surface border border-premium flex items-center justify-between group/item hover:border-accent/40 transition-all duration-700 shadow-sm">
                                                            <div className="flex items-center gap-8">
                                                                <div className="w-16 h-16 rounded-[24px] bg-accent/10 flex items-center justify-center text-accent shadow-xl shadow-accent/5 group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-700">
                                                                    <User size={32} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-serif text-2xl font-black text-main italic">Account Status</p>
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                                        <p className="text-[10px] text-muted uppercase tracking-widest font-black">Active Member</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => setIsTutorialOpen(true)}
                                                                className="px-6 py-3 rounded-2xl border border-premium text-[9px] font-black uppercase tracking-widest text-muted hover:text-accent hover:border-accent/40 transition-all flex items-center gap-2"
                                                            >
                                                                <Zap size={12} className="text-accent" />
                                                                Tutorial
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
    
                            <aside className="lg:col-span-4 animate-fade-in-up stagger-5">
                                <div className="glass-premium rounded-[48px] p-10 border border-premium sticky top-32 group overflow-hidden transition-all duration-1000 hover:border-accent/30">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent/10 transition-all" />
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 rounded-2xl bg-main/5 flex items-center justify-center text-accent border border-premium">
                                                <Lock size={20} />
                                            </div>
                                             <div>
                                                 <h3 className="font-serif text-2xl font-black text-main italic">Platform Features</h3>
                                                 <span className="inline-block mt-1 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs font-black text-accent uppercase tracking-[0.3em]">Live & Upcoming</span>
                                             </div>
                                        </div>
    
                                        <h2 className="font-serif text-3xl font-black text-main leading-none italic mb-6">
                                            The <span className="text-gradient-gold">A2S Ecosystem</span>
                                        </h2>
                                        <p className="text-sm text-muted font-light leading-relaxed mb-10">
                                            Access our full suite of AI-powered interior design tools.
                                        </p>
    
                                        <div className="space-y-4 mb-12">
                                            {[
                                                { icon: <Sparkles size={18} />, title: "AI Consultant", desc: "Expert design advice on demand.", status: "LIVE" },
                                                { icon: <Layout size={18} />, title: "Vastu Audit", desc: "Balance your home's energy.", status: "LIVE" },
                                                { icon: <Box size={18} />, title: "3D Studio", desc: "Plan your space in 3D.", status: "BETA" },
                                                { icon: <ShoppingBag size={18} />, title: "Smart Sourcing", desc: "Curated artisan products.", status: "BETA" },
                                                { icon: <Users size={18} />, title: "Artisan Cloud", desc: "Vetted craftsmen marketplace.", status: "PHASE 2" },
                                                { icon: <ScanLine size={18} />, title: "Video-to-3D", desc: "Scan rooms with your phone.", status: "PHASE 2" },
                                                { icon: <Camera size={18} />, title: "AR Live View", desc: "See furniture in your room.", status: "PHASE 2" }
                                            ].map((feature, i) => (
                                                <div key={i} className="flex gap-4 p-4 rounded-[24px] bg-white/5 border border-premium hover:bg-white/10 transition-colors">
                                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                                        {feature.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="text-xs font-black text-main uppercase tracking-wider mb-1">{feature.title}</h4>
                                                            <span className="text-[8px] font-black text-accent/50 group-hover:text-accent transition-colors">{feature.status}</span>
                                                        </div>
                                                        <p className="text-[10px] text-muted leading-relaxed">{feature.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="glass-premium rounded-[64px] border border-premium overflow-hidden flex flex-col lg:flex-row h-auto min-h-[700px]">
                                <div className="lg:w-3/5 h-[500px] lg:h-auto relative overflow-hidden bg-surface group">
                                    <div className="absolute inset-0 transition-transform duration-[10s] group-hover:scale-110">
                                        <img 
                                            src="/3d-studio-animation.png" 
                                            alt="3D Studio Preview" 
                                            className="w-full h-full object-cover opacity-80"
                                        />
                                    </div>
                                    <div className="absolute inset-0 z-10 pointer-events-none">
                                        <div className="absolute inset-0 opacity-10 animate-blueprint">
                                            <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                                        </div>
                                        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_20px_rgba(29,97,114,0.8)] animate-scan-fast z-20" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent hidden lg:block" />
                                    <div className="absolute bottom-12 left-12 z-20">
                                        <div className="flex items-center gap-4 backdrop-blur-2xl bg-white/5 px-8 py-4 rounded-full border border-white/10 shadow-2xl">
                                            <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-[0_0_15px_rgba(29,97,114,1)]" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Internal Studio</span>
                                                <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Version 0.8.4</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 p-12 lg:p-16 flex flex-col relative bg-main/98">
                                    <div className="mb-10 w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                        <Lock size={20} />
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-px bg-accent/40" />
                                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.5em]">Upcoming Feature</span>
                                    </div>
                                    <h2 className="font-serif text-4xl lg:text-6xl font-black text-main leading-[0.9] italic mb-10 tracking-tighter">
                                         <span className="text-gradient-gold">3D Room</span><br />Planner
                                    </h2>
                                    <p className="text-muted text-base font-light leading-relaxed mb-12">
                                        Our 3D Room Planner is currently being updated. We are working on new tools to help you plan and see your space in high quality.
                                    </p>
                                    <div className="mt-auto space-y-8">
                                         {waitlistStatus.joined ? (
                                            <div className="space-y-6">
                                                <div className="p-8 rounded-[40px] bg-green-500/5 border border-green-500/20">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em]">You're on the waitlist</span>
                                                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/20">Active</span>
                                                    </div>
                                                    <div className="flex justify-between items-end mb-4">
                                                        <div>
                                                            <p className="text-[9px] text-green-700/70 uppercase tracking-[0.2em] font-black">Position</p>
                                                            <p className="font-serif text-3xl font-black text-main italic">{waitlistStatus.rank || '—'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] text-green-700/70 uppercase tracking-[0.2em] font-black">Total in Queue</p>
                                                            <p className="text-2xl font-black text-accent">{Number(waitlistStatus.totalWaitlist || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {waitlistStatus.inviteCode && (
                                                    <div className="p-6 rounded-[32px] bg-white border border-premium shadow-sm">
                                                        <p className="text-[9px] text-main uppercase tracking-[0.3em] font-black mb-3">Referral Code</p>
                                                        <div className="flex gap-3 items-center">
                                                            <div className="flex-1 px-4 py-3 rounded-xl bg-neutral-50 border border-premium font-mono text-sm text-main truncate">
                                                                {waitlistStatus.inviteCode}
                                                            </div>
                                                            <button onClick={copyWaitlistCode} className="px-4 py-3 rounded-xl border border-premium text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all">
                                                                {waitlistCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                                            </button>
                                                        </div>
                                                        <p className="text-[9px] text-muted mt-3 italic">Share to climb the waitlist and earn credits.</p>
                                                    </div>
                                                )}
                                            </div>
                                         ) : (
                                            <>
                                                <div className="p-8 rounded-[40px] bg-white/5 border border-white/5">
                                                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                        <Sparkles size={14} className="text-accent" />
                                                        New Features Coming
                                                    </h3>
                                                    <ul className="space-y-3">
                                                        {["AI-powered room checks", "Real-time furniture staging", "High-quality exports"].map((item, i) => (
                                                            <li key={i} className="text-xs text-muted flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-accent/30" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <button 
                                                    onClick={handleJoinWaitlist}
                                                    disabled={joiningWaitlist}
                                                    className="w-full btn-premium btn-premium-gold py-5 group disabled:opacity-50"
                                                >
                                                    <span>{joiningWaitlist ? 'Joining...' : 'Join Waitlist'}</span>
                                                    {!joiningWaitlist && <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                                </button>
                                            </>
                                         )}
                                         <button 
                                             onClick={() => setActiveView('overview')}
                                             className="w-full px-8 py-5 rounded-[24px] border border-premium text-[10px] font-black uppercase tracking-widest text-muted hover:text-white hover:border-white/20 transition-all"
                                         >
                                             Back to Dashboard
                                         </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isRefineModalOpen}
                onClose={() => setIsRefineModalOpen(false)}
                onConfirm={confirmRefineStyle}
                title="Reset Style Profile?"
                message="Are you sure you want to clear your style report? You will need to choose your favorite designs again."
                confirmText="Clear & Restart"
                cancelText="Keep Current"
                type="danger"
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDesignToDelete(null); }}
                onConfirm={confirmDeleteDesign}
                title="Delete Saved Item?"
                message="Are you sure you want to delete this from your saved list?"
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            <LockedFeatureOverlay 
                isOpen={is3DLockedOpen}
                onClose={() => setIs3DLockedOpen(false)}
                previewImage="/3d_studio_preview.png"
                featureName="3D Room Planner"
                featureDescription="Our staging tool is currently being updated for high-quality rendering. You will soon be able to plan your rooms in photorealistic quality."
            />
            <TutorialOverlay 
                isOpen={isTutorialOpen} 
                onClose={() => setIsTutorialOpen(false)} 
                onFinish={handleTutorialFinish}
            />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default Dashboard;
