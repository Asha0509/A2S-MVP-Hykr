import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Heart, User, Search, Box, X, LogOut, Palette, ChevronDown, PlayCircle, Sparkles, Lock, Wand2, Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import TutorialGuide from './TutorialGuide';
import ConfirmationModal from './ConfirmationModal';
import { useNavigate } from 'react-router-dom';

const NAV_LINKS = [
    { to: '/', label: 'Home', authRequired: true },
    { to: '/gallery', label: 'Gallery' },
    { to: '/stage', label: 'AI Staging', icon: Wand2 },
    { to: '/vastu-score', label: 'Vastu Score', icon: Sparkles },
    { to: '/3d-space', label: '3D Space', icon: Box },
    { to: '/builder', label: 'For Builders', icon: Building2 },
    { to: '/dashboard', label: 'Dashboard', authRequired: true },
];

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Zustand Store Hooks
    const user = useStore(state => state.user);
    const logout = useStore(state => state.logout);
    const savedCount = useStore(state => (state.savedDesigns?.length || 0) + (state.savedProducts?.length || 0));
    const atmosphere = useStore(state => state.atmosphere);
    const setAtmosphere = useStore(state => state.setAtmosphere);
    
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    // Track scroll for Navbar style change
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Atmosphere effect
    useEffect(() => {
        document.documentElement.setAttribute('data-atmosphere', atmosphere);
    }, [atmosphere]);

    const ATMOSPHERES = [
        { id: 'parchment', label: 'Light Mode', color: '#F5F1E9', emoji: '☀️' },
    ];

    // Global keyboard handler for closing dropdowns
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            setAccountOpen(false);
            setMobileOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const performLogout = async () => {
        logout();
        setIsLogoutModalOpen(false);
        navigate('/');
    };

    const initiateLogout = () => {
        setIsLogoutModalOpen(true);
        setAccountOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav 
            className={`sticky top-0 left-0 right-0 z-[100] border-b transition-all duration-500 ${scrolled ? 'glass-premium border-white/20 shadow-premium' : 'bg-[#F9F5F0] border-transparent'}`}
            style={{ backgroundColor: '#F9F5F0' }}
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="max-w-full mx-auto px-8 lg:px-12">
                <div className="flex justify-between items-center h-[60px] md:h-[68px]">
                    <div className="flex items-center -ml-8 h-full" aria-label="A2S Logo">
                        <img 
                            src="/A2S.jpeg" 
                            alt="A2S Logo" 
                            className="h-full w-auto object-contain mix-blend-multiply px-4" 
                        />
                    </div>

                    <div className="hidden md:flex items-center gap-2" role="menubar">
                        {NAV_LINKS.filter(link => !link.authRequired || user).map(({ to, label, icon: Icon }) => (
                            to === '/3d-space' ? (
                                <Link
                                    key={to}
                                    id="nav-3d-space"
                                    to="/dashboard"
                                    state={{ activeView: '3d-studio' }}
                                    className={`relative px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all focus-premium flex items-center gap-2 group ${isActive('/dashboard') && location.state?.activeView === '3d-studio' ? 'text-main bg-accent/10' : 'text-gray-500 hover:text-main hover:bg-gray-50'}`}
                                >
                                    <span>{label}</span>
                                    <Lock size={10} className="text-accent/40" />
                                </Link>
                            ) : (
                                <Link
                                    key={to}
                                    id={`nav-${label.toLowerCase().replace(' ', '-')}`}
                                    to={to}
                                    role="menuitem"
                                    className={`relative px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all focus-premium ${isActive(to)
                                        ? 'text-main bg-accent/10'
                                        : 'text-gray-500 hover:text-main hover:bg-gray-50'
                                        }`}
                                    aria-current={isActive(to) ? 'page' : undefined}
                                >
                                    {Icon ? <span className="flex items-center gap-2"><Icon size={14} /> {label}</span> : label}
                                    {isActive(to) && (
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
                                    )}
                                </Link>
                            )
                        ))}
                    </div>

                    <div className="flex items-center gap-1">
                        <button type="button" className="p-2.5 text-gray-500 hover:text-accent hover:bg-gray-100 rounded-lg transition focus-premium" aria-label="Search designs and products">
                            <Search size={20} />
                        </button>

                        {user && (
                            <Link to="/dashboard" className="p-2.5 text-gray-500 hover:text-accent rounded-lg transition relative focus-premium" aria-label={`Saved designs${savedCount > 0 ? `, ${savedCount} items` : ''}`}>
                                <Heart size={20} />
                                {savedCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 animate-scale-in">
                                        {savedCount > 99 ? '99+' : savedCount}
                                    </span>
                                )}
                            </Link>
                        )}
                        {user ? (
                            <div className="relative hidden sm:block">
                                <button
                                    type="button"
                                    onClick={() => setAccountOpen(!accountOpen)}
                                    className="w-10 h-10 rounded-full bg-accent text-xs font-black transition hover:opacity-90 flex items-center justify-center focus-premium text-on-accent"
                                    aria-label="Account menu"
                                    aria-expanded={accountOpen}
                                    aria-haspopup="true"
                                    id="nav-account"
                                >
                                    <span>{(user.name || user.email || 'U').charAt(0).toUpperCase()}</span>
                                </button>
                                {accountOpen && (
                                    <div className="absolute right-0 top-full mt-3 py-3 w-64 glass-premium rounded-3xl shadow-2xl z-50 animate-scale-in border border-white/20" role="menu">
                                        <div className="px-5 py-2 border-b border-white/5 mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Your Account</p>
                                        </div>
                                        <div className="px-5 py-3 border-b border-white/5 mb-2 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-main/5 flex items-center justify-center text-accent border border-white/5">
                                                <User size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-main uppercase tracking-widest truncate">{user.name || 'Member'}</p>
                                                <p className="text-[10px] text-muted truncate">{user.email}</p>
                                            </div>
                                        </div>



                                        <div className="py-2 border-b border-white/5 mb-2">
                                            <Link
                                                id="nav-dashboard-menu"
                                                to="/dashboard"
                                                role="menuitem"
                                                className="block px-5 py-3 text-[11px] font-black text-main opacity-80 hover:opacity-100 hover:bg-white/5 transition uppercase tracking-[0.2em]"
                                                onClick={() => setAccountOpen(false)}
                                            >
                                                My Dashboard
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => { setIsTutorialOpen(true); setAccountOpen(false); }}
                                                className="w-full flex items-center gap-3 px-5 py-3 text-[10px] font-black text-accent hover:bg-white/5 transition uppercase tracking-[0.2em] text-left"
                                            >
                                                <PlayCircle size={14} className="animate-pulse" />
                                                Show Tour
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={initiateLogout}
                                            role="menuitem"
                                            className="w-full flex items-center gap-2 px-5 py-3 text-[11px] font-bold text-red-400 hover:bg-red-500/10 transition text-left uppercase tracking-widest"
                                        >
                                            <LogOut size={14} /> Log out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-accent hover:opacity-90 transition shadow-lg focus-premium animate-pulse-glow"
                                style={{ color: '#131A20' }}
                            >
                                Sign In
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition focus-premium"
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden animate-slide-down py-4 border-t border-gray-200/80 bg-main/95 backdrop-blur-sm -mx-4 px-4 rounded-b-2xl shadow-lg" role="menu">
                        <div className="flex flex-col gap-1">
                            {NAV_LINKS.filter(link => !link.authRequired || user).map(({ to, label, icon: Icon }) => (
                                to === '/3d-space' ? (
                                    <Link
                                        key={to}
                                        to="/dashboard"
                                        state={{ activeView: '3d-studio' }}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-accent/10 hover:text-main w-full text-left transition-all"
                                    >
                                        {Icon && <Icon size={18} className="text-accent" />}
                                        <div className="flex items-center gap-2">
                                            <span>{label}</span>
                                            <Lock size={10} className="text-accent/40" />
                                        </div>
                                    </Link>
                                ) : (
                                    <Link
                                        key={to}
                                        to={to}
                                        role="menuitem"
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(to) ? 'bg-accent/20 text-main font-semibold' : 'text-gray-700 hover:bg-accent/10 hover:text-main'
                                            }`}
                                        aria-current={isActive(to) ? 'page' : undefined}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {Icon && <Icon size={18} />}
                                        {label}
                                    </Link>
                                )
                            ))}

                            {user ? (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="px-4 py-1 text-xs text-gray-500 truncate">{user.name}</p>
                                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-accent/10" onClick={() => setMobileOpen(false)}>
                                        Dashboard
                                    </Link>
                                    <button type="button" onClick={() => { initiateLogout(); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left">
                                        <LogOut size={18} /> Log out
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-accent mt-2 border-t border-gray-200 pt-2" onClick={() => setMobileOpen(false)}>
                                    Sign in
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Close account dropdown on outside click */}
            {accountOpen && <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />}

            {/* Tutorial Mode Protocol */}
            <TutorialGuide
                isOpen={isTutorialOpen}
                onClose={() => {
                    setIsTutorialOpen(false);
                    if (user) localStorage.setItem(`a2s_tutorial_completed_${user.email}`, 'true');
                }}
            />

            {/* Logout Confirmation Protocol */}
            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={performLogout}
                title="Log out?"
                message="Are you sure you want to log out of your account?"
                confirmText="Log out"
                cancelText="Cancel"
                type="danger"
            />

        </nav>
    );
};

export default Navbar;
