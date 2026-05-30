import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Send, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '../services/geminiService';
import ProductCard from './ProductCard';
import VastuDisplay from './VastuDisplay';
import { useStore } from '../store/useStore';
import { getUserProfile } from '../services/api';

/**
 * Derives a contextual AI prompt prefix based on the current page route.
 */
function getPageContext(pathname) {
    if (pathname.startsWith('/design/')) {
        const designId = pathname.split('/design/')[1];
        return `User is viewing design detail page (ID: ${designId}). Provide advice specific to this design's style and elements. Keep tone editorial and "Quiet Luxury".`;
    }
    if (pathname === '/gallery') {
        return 'User is browsing the curated gallery. Offer style suggestions, trending looks, and filtering tips. Keep tone editorial, "Quiet Luxury".';
    }
    if (pathname === '/3d-space') {
        return 'User is in the 3D Studio. Help with room layout, furniture placement, and Vastu considerations. Keep tone concise and "Quiet Luxury".';
    }
    return 'User is browsing A2S. Act as the A2S Design Architect. Responses must be formatted in Markdown, with a "Quiet Luxury" and highly editorial tone.';
}

const AIStylistWidget = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    
    // Auto-open on initial load slightly after everything renders
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) {
                setIsOpen(true);
                setIsMinimized(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const [messages, setMessages] = useState([{
        id: '1', 
        role: 'ai', 
        text: "Namaste. I am your **A2S Design Architect**.\n\nI curate sanctuaries that transcend the ordinary. How may I assist your vision today?"
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Zustand Store Hooks
    const consultantCredits = useStore(state => state.consultantCredits);
    const vastuCredits = useStore(state => state.vastuCredits);
    const updateCredits = useStore(state => state.updateCredits);

    const scrollRef = useRef(null);

    // Fetch credits on mount or when opened (Sync with backend)
    useEffect(() => {
        const { token } = useStore.getState();
        if (isOpen && token) {
            getUserProfile().catch(err => console.error("Failed to sync profile:", err));
        }
    }, [isOpen]);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || consultantCredits <= 0) return;
        
        const userText = input.trim();
        const userMsg = { id: Date.now().toString(), role: 'user', text: userText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const context = getPageContext(location.pathname);
            const isVastu = /vastu|audit|layout|direction|north|south|east|west|prana|feng shui/i.test(userText);
            
            let response;
            if (isVastu) {
                if (vastuCredits <= 0) {
                    throw new Error("You have exhausted your Vastu Audit credits.");
                }
                // Route Vastu-specific queries to the dedicated endpoint
                response = await geminiService.performVastuAudit('general', userText);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    text: response.response_text || `Your Vastu audit is complete. **Score: ${response.score ?? 'N/A'}/100**`,
                    vastu: (response.score !== undefined) ? response : null,
                    products: null
                }]);
                updateCredits('vastu', Math.max(0, vastuCredits - 1));
            } else {
                // Standard design/product query
                response = await geminiService.getDesignAdvice(userText, context);
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'ai',
                    text: response.response_text || 'Thank you for your vision.',
                    products: response.products,
                    vastu: response.vastu
                }]);
                updateCredits('consultant', Math.max(0, consultantCredits - 1));
            }
        } catch (err) {
            console.error('Widget error:', err);
            const errorMsg = err.message || "A disruption in my reflections. The inspiration is momentarily blocked.";
            setMessages(prev => [...prev, { 
                id: 'err-' + Date.now(), 
                role: 'ai', 
                text: `**${errorMsg}**`
            }]);
            
            // Error handled visually in chat
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none font-sans">
            {/* Chat Window */}
            {isOpen && !isMinimized && (
                <div className="w-[450px] h-[650px] max-h-[85vh] glass-premium rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col overflow-hidden animate-scale-in pointer-events-auto origin-bottom-right transition-all duration-700 backdrop-blur-xl">
                    <header className="px-8 py-6 border-b border-glass flex items-center justify-between bg-surface/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-main flex items-center justify-center text-accent shadow-premium border border-white/20 animate-pulse-glow">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-main">Design Architect</span>
                                <div className="flex items-center gap-3">
                                    <p className="text-[9px] text-muted uppercase tracking-widest">A2S Context AI</p>
                                    <span className="w-1 h-1 rounded-full bg-accent/30" />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${consultantCredits > 0 ? 'text-accent' : 'text-red-500'}`}>
                                        Credits: {consultantCredits}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsMinimized(true)} className="p-1.5 text-gray-400 hover:text-main transition-colors rounded-lg hover:bg-white/5" aria-label="Minimize chat">
                                <Minimize2 size={16} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-main transition-colors rounded-lg hover:bg-white/5" aria-label="Close chat">
                                <X size={16} />
                            </button>
                        </div>
                    </header>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface/10 no-scrollbar scroll-smooth">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col animate-fade-in-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {/* User Message */}
                                {msg.role === 'user' && (
                                    <div className="max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm bg-main text-on-accent rounded-br-sm">
                                        {msg.text}
                                    </div>
                                )}

                                {/* AI Message */}
                                {msg.role === 'ai' && (
                                    <div className="w-full">
                                        <div className="px-5 py-4 rounded-2xl text-[13.5px] leading-relaxed shadow-sm bg-surface/90 backdrop-blur-md border border-glass text-main rounded-bl-sm">
                                            <div className="markdown-content">
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                        </div>
                                        
                                        {/* Vastu Audit */}
                                        {msg.vastu && (
                                            <div className="mt-4 transform scale-95 origin-top-left -ml-2">
                                                <VastuDisplay vastu={msg.vastu} />
                                            </div>
                                        )}

                                        {/* Product Gallery */}
                                        {msg.products && msg.products.length > 0 && (
                                            <div className="mt-6">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent mb-3 ml-2">Curated Selections</p>
                                                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 -mx-1 custom-scrollbar">
                                                    {msg.products.map((product, idx) => (
                                                        <div className="transform scale-[0.85] origin-top-left -ml-4 -mr-6 hover:z-10 transition-all" key={product.product_id || idx}>
                                                            <ProductCard product={product} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-fade-in-up pt-2">
                                <div className="px-5 py-3 bg-surface/80 rounded-2xl border border-premium flex items-center gap-3 shadow-sm rounded-bl-none">
                                    <Loader2 size={14} className="animate-spin text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Architect is reflecting...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-surface/40 border-t border-glass backdrop-blur-md">
                        <div className="relative flex items-center bg-surface/90 rounded-[1.5rem] border border-glass shadow-inner">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={consultantCredits > 0 ? "Refine your vision..." : "Exhausted your credits. Refer friends to refill."}
                                disabled={consultantCredits <= 0 || isLoading}
                                className="w-full bg-transparent py-4 pl-6 pr-14 text-sm font-medium focus:outline-none transition-all text-main placeholder:text-muted/60 disabled:cursor-not-allowed"
                                aria-label="Chat message input"
                            />
                            <button 
                                onClick={handleSend} 
                                disabled={!input.trim() || isLoading || consultantCredits <= 0}
                                className="absolute right-2 w-10 h-10 rounded-[1rem] bg-accent flex items-center justify-center hover:opacity-90 hover:shadow-md transition-all text-on-accent disabled:opacity-50 disabled:bg-gray-400" 
                                aria-label="Send message"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Minimized Bar */}
            {isOpen && isMinimized && (
                <button
                    onClick={() => setIsMinimized(false)}
                    className="pointer-events-auto flex items-center gap-3 px-6 py-3 glass-premium rounded-full border border-premium shadow-premium hover:shadow-premium-hover transition-all animate-scale-in"
                    aria-label="Expand AI Stylist chat"
                >
                    <Sparkles size={16} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-main">Consult Architect</span>
                    <Maximize2 size={14} className="text-muted ml-2" />
                </button>
            )}

            {/* Toggle Button (When Closed completely) */}
            {!isOpen && (
                <button
                    onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-premium hover:shadow-premium-hover transition-all duration-300 pointer-events-auto group border border-glass focus-premium bg-main hover:scale-105 hover:-translate-y-1"
                    aria-label="Open AI Architect"
                >
                    <div className="relative">
                        <Sparkles size={26} className="text-accent group-hover:scale-110 transition-transform duration-500" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500/80 rounded-full border-2 border-main animate-pulse" />
                    </div>
                </button>
            )}
        </div>
    );
};

export default AIStylistWidget;
