import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-main flex flex-col items-center justify-center px-4 pt-24 relative overflow-hidden transition-all duration-1000">
            {/* Ambient Background Orbs */}
            <div className="ambient-orb ambient-orb-1 opacity-60" />
            <div className="ambient-orb ambient-orb-2 opacity-60" />
            <h1 className="font-serif text-7xl md:text-9xl font-bold text-a2s-charcoal mb-3 tracking-tight">404</h1>
            <span className="section-underline mb-6" aria-hidden="true" />
            <p className="text-gray-600 text-xl mb-10">Page not found.</p>
            <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/" className="btn-primary inline-flex items-center gap-2">
                    <Home size={18} /> Home
                </Link>
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm border-2 border-a2s-charcoal text-a2s-charcoal hover:bg-a2s-charcoal hover:text-white transition-all"
                >
                    <ArrowLeft size={18} /> Back
                </button>
            </div>
        </div>
    );
};

export default NotFound;
