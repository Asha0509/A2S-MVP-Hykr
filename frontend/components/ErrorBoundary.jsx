import React, { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-a2s-cream/50 flex flex-col items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-2xl luxury-shadow border border-gray-100 p-8 text-center">
                        <AlertCircle className="mx-auto text-a2s-gold mb-4" size={48} />
                        <h1 className="font-serif text-2xl font-bold text-a2s-charcoal mb-2">Something went wrong</h1>
                        <span className="section-underline block mb-4" aria-hidden="true" />
                        <p className="text-gray-600 text-sm mb-6">
                            We've run into an error. Try refreshing the page.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <RefreshCw size={18} /> Refresh page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
