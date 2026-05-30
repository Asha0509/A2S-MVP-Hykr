import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { useStore } from './store/useStore';

// Lazy-loaded pages for route-based code splitting
const Home = lazy(() => import('./pages/Home'));
const Gallery = lazy(() => import('./pages/Gallery'));
const DesignDetail = lazy(() => import('./pages/DesignDetail'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ThreeDSpace = lazy(() => import('./pages/ThreeDSpace'));
const VastuScore = lazy(() => import('./pages/VastuScore'));
const StageRoom = lazy(() => import('./pages/StageRoom'));
const BuilderPortal = lazy(() => import('./pages/BuilderPortal'));
const EmbedDemo = lazy(() => import('./pages/EmbedDemo'));
const DesignJourney = lazy(() => import('./pages/DesignJourney'));
const DesignSummary = lazy(() => import('./pages/DesignSummary'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Scroll to top on route change
const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

// Capture ?builderId=... from the URL (any position) and pin it in localStorage
// so the rest of the buyer session is attributed to the builder embedding A2S.
const BuilderAttributionBootstrap = () => {
    const { search, hash } = useLocation();
    useEffect(() => {
        const fromSearch = new URLSearchParams(search).get('builderId');
        const fromWindow = new URLSearchParams(window.location.search).get('builderId');
        let fromHash = null;
        if (hash.includes('?')) {
            fromHash = new URLSearchParams(hash.split('?')[1] || '').get('builderId');
        }
        const builderId = fromSearch || fromWindow || fromHash;
        if (builderId && !/^[a-z0-9-]{3,80}$/.test(builderId)) return;
        if (builderId) {
            localStorage.setItem('a2s-attributed-builder', builderId);
        }
    }, [search, hash]);
    return null;
};

// Accept OAuth token from query/hash on any route, then normalize to dashboard.
const OAuthTokenBootstrap = () => {
    const { search, hash } = useLocation();
    const isAuthenticated = useStore((state) => state.isAuthenticated);

    useEffect(() => {
        const routerQueryToken = new URLSearchParams(search).get('token');
        const urlQueryToken = new URLSearchParams(window.location.search).get('token');

        let hashQueryToken = null;
        if (hash.includes('?')) {
            const hashQuery = hash.split('?')[1] || '';
            hashQueryToken = new URLSearchParams(hashQuery).get('token');
        }

        const token = routerQueryToken || urlQueryToken || hashQueryToken;
        if (!token || isAuthenticated) {
            return;
        }

        localStorage.setItem('token', token);
        useStore.getState().login({}, token);
        window.location.replace('/#/dashboard');
    }, [search, hash, isAuthenticated]);

    return null;
};

import AIStylistWidget from './components/AIStylistWidget';
import ProtectedRoute from './components/ProtectedRoute';

// Branded loading fallback for Suspense
const PageLoader = () => (
    <div className="min-h-screen bg-main flex flex-col items-center justify-center gap-6 transition-all duration-500">
        <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-4 border-premium" />
            <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent animate-pulse">Loading...</p>
    </div>
);

const App = () => {
    return (
        <ErrorBoundary>
            <Router>
                <ScrollToTop />
                <BuilderAttributionBootstrap />
                <OAuthTokenBootstrap />
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-grow">
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                
                                {/* Protected Routes */}
                                <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
                                <Route path="/design/:id" element={<ProtectedRoute><DesignDetail /></ProtectedRoute>} />
                                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                <Route path="/vastu-score" element={<ProtectedRoute><VastuScore /></ProtectedRoute>} />
                                <Route path="/vinsight" element={<ProtectedRoute><VastuScore /></ProtectedRoute>} />
                                <Route path="/stage" element={<ProtectedRoute><StageRoom /></ProtectedRoute>} />
                                <Route path="/builder" element={<BuilderPortal />} />
                                <Route path="/embed-demo" element={<EmbedDemo />} />
                                <Route path="/design" element={<DesignJourney />} />
                                <Route path="/design/summary" element={<DesignSummary />} />
                                <Route path="/3d-space" element={<ProtectedRoute><ThreeDSpace /></ProtectedRoute>} />
                                <Route path="/waitlist" element={<ProtectedRoute><Waitlist /></ProtectedRoute>} />
                                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                <Route path="/terms-of-service" element={<TermsOfService />} />
                                
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </main>
                    <Footer />
                    <AIStylistWidget />
                </div>
            </Router>
        </ErrorBoundary>
    );
};

export default App;

