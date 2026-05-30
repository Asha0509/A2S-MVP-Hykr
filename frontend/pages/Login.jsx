import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    Mail, User, MapPin, ArrowRight, Sparkles, Lock, 
    Eye, EyeOff, CheckCircle2, Chrome, Command,
    LogIn, UserPlus
} from 'lucide-react';
import { login, register } from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { useStore } from '../store/useStore';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, removeToast, toast } = useToast();
    
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        location: '',
        subscribe: true
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validation, setValidation] = useState({
        hasUpper: false,
        hasMinLen: false,
        hasLower: false,
        hasNumber: false
    });

    // Password strength validation
    useEffect(() => {
        const pass = formData.password;
        setValidation({
            hasUpper: /[A-Z]/.test(pass),
            hasMinLen: pass.length >= 8,
            hasLower: /[a-z]/.test(pass),
            hasNumber: /[0-9]/.test(pass)
        });
    }, [formData.password]);
    
    // Handle OAuth2 redirect token for both HashRouter and normal URLs
    useEffect(() => {
        const routerQueryToken = new URLSearchParams(location.search).get('token');
        const urlQueryToken = new URLSearchParams(window.location.search).get('token');

        let hashQueryToken = null;
        if (window.location.hash.includes('?')) {
            const hashQuery = window.location.hash.split('?')[1] || '';
            hashQueryToken = new URLSearchParams(hashQuery).get('token');
        }

        const token = routerQueryToken || urlQueryToken || hashQueryToken;
        if (token) {
            handleOAuth2Success(token);
        }
    }, [location]);

    const handleOAuth2Success = async (token) => {
        setLoading(true);
        try {
            localStorage.setItem('token', token);
            useStore.getState().login({}, token);
            const { getUserProfile } = await import('../services/api');
            await getUserProfile();
            toast.success('Successfully authenticated.');
            
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 800);
        } catch (err) {
            setError('Social authentication failed to retrieve profile.');
            toast.error('Social authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGoogleLogin = () => {
        const oauthBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
        window.location.href = `${oauthBaseUrl}/oauth2/authorization/google`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const trimmedEmail = formData.email.trim().toLowerCase();
        const trimmedPassword = formData.password.trim();

        if (!isLogin) {
            if (!validation.hasUpper || !validation.hasMinLen || !validation.hasLower || !validation.hasNumber) {
                toast.error('Please fulfill all security requirements.');
                setLoading(false);
                return;
            }
        }

        try {
            let userData;
            if (isLogin) {
                userData = await login(trimmedEmail, trimmedPassword);
                toast.success('Access granted. Welcome back.');
            } else {
                await register(formData.name.trim(), trimmedEmail, trimmedPassword, formData.location.trim(), formData.subscribe);
                toast.success('Identity registered successfully.');
                userData = await login(trimmedEmail, trimmedPassword);
            }

            const targetPath = location.state?.from?.pathname || '/dashboard';

            setTimeout(() => {
                navigate(targetPath, { replace: true });
            }, 600);
        } catch (err) {
            const errorMsg = typeof err === 'string' ? err : (err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <main className="min-h-screen pt-28 pb-20 px-4 relative overflow-hidden flex items-center justify-center bg-main">
                
                {/* Subtle decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full opacity-30"
                         style={{ background: 'radial-gradient(circle, hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.08) 0%, transparent 70%)' }} />
                    <div className="absolute bottom-[-20%] left-[-15%] w-[50%] h-[50%] rounded-full opacity-20"
                         style={{ background: 'radial-gradient(circle, hsla(var(--accent-h), var(--accent-s), var(--accent-l), 0.06) 0%, transparent 70%)' }} />
                </div>

                <div className="w-full max-w-md relative" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-accent mb-4 animate-fade-in-up stagger-1">
                            {isLogin ? 'Welcome Back' : 'Welcome'}
                        </p>
                        <h1 className="text-4xl md:text-6xl font-black text-main animate-fade-in-up stagger-2 mb-6">
                            Luxury <span className="text-gradient-gold italic">Awaits</span>
                        </h1>
                        <p className="text-base text-muted font-light leading-relaxed animate-fade-in-up stagger-3">
                            {isLogin 
                                ? 'Access your saved designs and personal dashboard.' 
                                : 'Join us to start your interior design journey.'}
                        </p>
                    </div>

                    {/* Card */}
                    <div className="rounded-3xl overflow-hidden"
                         style={{ 
                             background: '#FFFFFF', 
                             boxShadow: '0 4px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                             border: '1px solid rgba(0,0,0,0.06)'
                         }}>
                        
                        {/* Tab Switcher */}
                        <div className="flex p-1.5 bg-offset">
                            <button
                                onClick={() => setIsLogin(true)}
                                className="flex-1 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all duration-300"
                                style={{ 
                                    background: isLogin ? 'var(--base-white)' : 'transparent',
                                    color: isLogin ? 'var(--text-main)' : 'var(--text-muted)',
                                    boxShadow: isLogin ? 'var(--shadow-premium)' : 'none'
                                }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <LogIn size={14} /> {isLogin ? 'Sign In' : 'Sign In'}
                                </span>
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className="flex-1 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all duration-300"
                                style={{ 
                                    background: !isLogin ? 'var(--base-white)' : 'transparent',
                                    color: !isLogin ? 'var(--text-main)' : 'var(--text-muted)',
                                    boxShadow: !isLogin ? 'var(--shadow-premium)' : 'none'
                                }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <UserPlus size={14} /> Join
                                </span>
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8 md:p-10">
                            {error && (
                                <div className="mb-6 p-4 rounded-xl text-sm font-semibold"
                                     style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)', color: '#DC2626' }}>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-5">
                                {/* Name Field (Register only) */}
                                {!isLogin && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 pl-1 text-muted">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required={!isLogin}
                                                placeholder="Anjali Verma"
                                                className="w-full rounded-xl text-sm font-medium transition-all duration-200 outline-none bg-offset border border-premium text-main focus:border-accent/40 focus:ring-4 focus:ring-accent/5"
                                                style={{ 
                                                    padding: '14px 16px 14px 44px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email Field */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 pl-1 text-muted">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl text-sm font-medium transition-all duration-200 outline-none bg-offset border border-premium text-main focus:border-accent/40 focus:ring-4 focus:ring-accent/5"
                                            style={{ 
                                                padding: '14px 16px 14px 44px'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Location Field (Register only) */}
                                {!isLogin && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 pl-1 text-muted">
                                            Location
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40">
                                                <MapPin size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="Mumbai, India"
                                                className="w-full rounded-xl text-sm font-medium transition-all duration-200 outline-none bg-offset border border-premium text-main focus:border-accent/40 focus:ring-4 focus:ring-accent/5"
                                                style={{ 
                                                    padding: '14px 16px 14px 44px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Password Field */}
                                <div>
                                    <div className="flex justify-between items-center mb-2 pl-1">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                                            Password
                                        </label>
                                        {isLogin && (
                                            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline transition-colors">
                                                Forgot?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            placeholder="••••••••"
                                            className="w-full rounded-xl text-sm font-medium transition-all duration-200 outline-none bg-offset border border-premium text-main focus:border-accent/40 focus:ring-4 focus:ring-accent/5"
                                            style={{ 
                                                padding: '14px 48px 14px 44px'
                                            }}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted/40 hover:text-main transition-colors duration-200"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {/* Password Requirements (Register only) */}
                                    {!isLogin && (
                                        <div className="mt-3 p-4 rounded-xl" style={{ background: '#F9F8F6', border: '1px solid #F0EDEA' }}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#AAA' }}>
                                                Security Requirements
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { ok: validation.hasUpper, text: 'Uppercase' },
                                                    { ok: validation.hasLower, text: 'Lowercase' },
                                                    { ok: validation.hasMinLen, text: '8+ Characters' },
                                                    { ok: validation.hasNumber, text: 'Number' },
                                                ].map((req, i) => (
                                                    <span key={i} className="flex items-center gap-1.5 text-xs font-semibold transition-colors duration-300"
                                                          style={{ color: req.ok ? '#22C55E' : '#D4D4D4' }}>
                                                        <CheckCircle2 size={13} /> {req.text}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Newsletter (Register only) */}
                            {!isLogin && (
                                <div className="mt-5 flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 bg-offset border border-premium"
                                     onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(29,97,114,0.3)'}
                                     onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                                    <input
                                        type="checkbox"
                                        name="subscribe"
                                        id="subscribe"
                                        checked={formData.subscribe}
                                        onChange={handleChange}
                                        className="mt-0.5 w-4 h-4 rounded cursor-pointer accent-accent"
                                    />
                                    <label htmlFor="subscribe" className="cursor-pointer">
                                        <span className="block text-sm font-bold text-main">Subscribe to Design Insights</span>
                                        <span className="block text-xs mt-0.5 text-muted">Curated interior tips & artisan stories.</span>
                                    </label>
                                </div>
                            )}

                             {/* Submit Button */}
                             <button
                                 type="submit"
                                 disabled={loading}
                                 className="w-full mt-7 flex items-center justify-center gap-3 rounded-xl py-5 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 bg-accent text-white shadow-lg hover:shadow-accent/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 <span>{loading ? (isLogin ? 'Granting Access...' : 'Registering...') : (isLogin ? 'Sign In' : 'Join A2S')}</span>
                                 {!loading && <ArrowRight size={18} />}
                             </button>

                             {/* OAuth Divider */}
                             <div className="flex items-center gap-4 mt-8">
                                 <div className="flex-1 h-px bg-premium" />
                                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Or continue with</span>
                                 <div className="flex-1 h-px bg-premium" />
                             </div>

                             {/* OAuth Buttons */}
                             <div className="flex gap-4 mt-6">
                                 <button
                                     type="button"
                                     onClick={handleGoogleLogin}
                                     className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-premium bg-offset text-main text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:border-accent/30 hover:shadow-md active:scale-95"
                                 >
                                     <Chrome size={18} /> Google
                                 </button>
                             </div>

                            </form>
                        </div>

                    {/* Footer Link */}
                    <div className="mt-10 text-center">
                        <Link to="/" className="text-xs font-semibold tracking-wider transition-colors duration-300 inline-flex items-center gap-1"
                              style={{ color: '#AAA' }}
                              onMouseEnter={e => e.currentTarget.style.color = '#B8963E'}
                              onMouseLeave={e => e.currentTarget.style.color = '#AAA'}>
                            ← Return to Home
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Login;
