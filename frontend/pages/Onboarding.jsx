import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    Sparkles, 
    Layout, 
    Home, 
    Zap, 
    Fingerprint, 
    Dna,
    Palette,
    Gem,
    Landmark,
    Leaf,
    Hammer,
    Sun,
    Maximize,
    Minimize
} from 'lucide-react';
import { updateUserProfile } from '../services/api';
import { useStore } from '../store/useStore';

const STYLES = [
    { id: 'Minimal', label: 'Minimalist', icon: Minimize, color: '#F3F4F6', desc: 'Sleek lines and purposeful simplicity.' },
    { id: 'Scandinavian', label: 'Nordic', icon: Home, color: '#E5E7EB', desc: 'Warm wood tones and cozy functionalism.' },
    { id: 'Indian Contemporary', label: 'Modern India', icon: Landmark, color: '#FEF3C7', desc: 'Heritage motifs meeting global standards.' },
    { id: 'Mid-Century Modern', label: 'Mid-Century', icon: Palette, color: '#FDE68A', desc: 'Organic shapes and functional teak.' },
    { id: 'Luxury', label: 'Luxury', icon: Gem, color: '#FDF2F2', desc: 'Opulent textures and high-gloss finishes.' },
    { id: 'Boho', label: 'Bohemian', icon: Sun, color: '#ECFDF5', desc: 'Artisanal layers and spirited patterns.' },
    { id: 'Industrial', label: 'Industrial', icon: Hammer, color: '#F3F4F6', desc: 'Raw materials and architectural honesty.' },
];

const ROOMS = [
    { id: 'living', label: 'Living Room' },
    { id: 'bedroom', label: 'Main Bedroom' },
    { id: 'kitchen', label: 'Gourmet Kitchen' },
    { id: 'dining', label: 'Dining Area' },
    { id: 'office', label: 'Private Office' },
];

// Direct image URLs for each combination (Room x Style)
const STYLE_DATA = {
    'living': {
        'Minimal': 'https://www.marthastewart.com/thmb/JSJwSMsolMumuoCAHHIjICbzYgs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/BradRamseyInteriors_credit_CarolineSharpnack-dee35c1fab554898af7c549697c2f592.jpg',
        'Scandinavian': 'https://online.majuhome.com.my/cdn/shop/articles/scandiblog1big.jpg?v=1632986284',
        'Indian Contemporary': 'https://thearchitectsdiary.com/wp-content/uploads/2023/01/Prana-Design-Studio-6-1.jpg',
        'Mid-Century Modern': 'https://cdn.home-designing.com/wp-content/uploads/2024/08/Graceful-Mid-Century-Modern-Living-Rooms.jpg',
        'Luxury': 'https://germaniaconstruction.com/wp-content/uploads/2022/11/park-city-custom-home-builder-great-room.jpg',
        'Boho': 'https://hips.hearstapps.com/hmg-prod/images/hbx030118buzz05-66f3009999065.jpg?crop=0.675xw:1.00xh;0.188xw,0&resize=640:*',
        'Industrial': 'https://www.beautifulhomes.asianpaints.com/content/dam/asianpaintsbeautifulhomes/gallery/living-room/industrial-modern-living-room-with-exposed-brick-wall/sophisticated-living-room-with-chic-accents.jpg.transform/bh-gallery-listing/image.webp'
    },
    'bedroom': {
        'Minimal': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/09d0d7aded4eac7a1b22b7c3f088d54c7036f245.jpg',
        'Scandinavian': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/9f081b0dd63401646a5e26506952589c156f822f.jpg',
        'Indian Contemporary': 'https://images.woodenstreet.de/image/data%2FLooks%2F8.jpg',
        'Mid-Century Modern': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/31a5d0728781afeb9518d5987d77eff1dcbca9a3.jpg',
        'Luxury': 'https://centuryply.com/blogimage/bedroom_1.png',
        'Boho': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/d58e036e5a340dd9392b992429f96b04e58b7947.jpg',
        'Industrial': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/268c97242ce75e9550c42cf33233d22fd24e18c4.jpg'
    },
    'kitchen': {
        'Minimal': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/4fc54bbfd0fe9ec3923e5456d8587e543b7afc46.jpg',
        'Scandinavian': 'https://www.rehome.co.uk/media/wysiwyg/nordic_kitchen.jpg',
        'Indian Contemporary': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/88dd02a069f6c3bc047264d15788764573fa516f.jpg',
        'Mid-Century Modern': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/ff8864c35699736ced0726c6155031619a0c9548.jpg',
        'Luxury': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/5d28887b5981d5315654136fd1562638ee392147.jpg',
        'Boho': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSofTJfDF2eu98TOdqB_CBnmQ9TcXz96aMfOQ&s',
        'Industrial': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/d3559db0d6bff31300aec5ccef4b06e13c7454f5.jpg'
    },
    'dining': {
        'Minimal': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/7fc35cc91ddc913945666ef090435c644083a4c4.jpg',
        'Scandinavian': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/596109fc780a6df8de5f32a1683f35965254a874.jpg',
        'Indian Contemporary': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/904028665aca0d2217fc3ee57f7fd11d095b1727.jpg',
        'Mid-Century Modern': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR581MFuD6lLTfJ3-_0ph-DIYakr-ewnS7boQ&s',
        'Luxury': 'https://i.pinimg.com/736x/6f/b1/21/6fb12197e7be488c070b8fda3801343e.jpg',
        'Boho': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/aa6d108f85c45a01a48c92cdf0dfe73c65e07438.jpg',
        'Industrial': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/3e535e382351418a1c6f908f03613272e742a392.jpg'
    },
    'office': {
        'Minimal': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/a79ccf83871d69da6c6304277607d159a738cf8a.jpg',
        'Scandinavian': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/e8691be244295b122f4e4ed43828c7246d7d77a6.jpg',
        'Indian Contemporary': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/d460397c0210bb09ed88d10cf50db59f52b678eb.jpg',
        'Mid-Century Modern': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/1169fd9dc1a73350089376ba47eea3cea9b2372b.jpg',
        'Luxury': 'https://pplx-res.cloudinary.com/image/upload/pplx_search_images/a67bc01145e9de208575bc6fcf6758c989eff6fc.jpg',
        'Boho': 'https://static.asianpaints.com/content/dam/asianpaintsbeautifulhomes/gallery/home-office-design/small-bohemian-home-office-with-wooden-furniture/compact-wooden-office-setup.jpg',
        'Industrial': 'https://officesnapshots.com/wp-content/uploads/2016/01/cameron-industrial-office-design-3.jpg'
    },
};

const getImageUrl = (room, style) => {
    return STYLE_DATA[room]?.[style] || 'https://picsum.photos/seed/a2s-default/800/1000';
};

const getFallbackImageUrl = (room, style) => {
    return `https://picsum.photos/seed/a2s-${room}-${encodeURIComponent(style)}/800/1000`;
};

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0); 
    const [selections, setSelections] = useState([]);
    const [result, setResult] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const setProfile = useStore(state => state.setProfile);

    const handleSelect = (styleId) => {
        if (isTransitioning) return;
        
        const newSelections = [...selections, styleId];
        setSelections(newSelections);

        if (currentStep < ROOMS.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(currentStep + 1);
                setIsTransitioning(false);
            }, 500);
        } else {
            calculateResult(newSelections);
        }
    };

    const calculateResult = (finalSelections) => {
        const counts = {};
        finalSelections.forEach(s => counts[s] = (counts[s] || 0) + 1);
        
        let maxCount = 0;
        let dominantStyle = null;
        let isMixed = false;

        Object.entries(counts).forEach(([style, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantStyle = style;
                isMixed = false;
            } else if (count === maxCount) {
                isMixed = true;
            }
        });

        const finalResult = isMixed ? 'Diverse' : dominantStyle;
        setResult(finalResult);
        setCurrentStep(ROOMS.length);

        // Save result and sync with store
        setProfile({ styleDNA: finalResult });

        // Sync with backend if logged in
        if (localStorage.getItem('token')) {
            updateUserProfile({
                styleDNA: finalResult,
                styleSelections: finalSelections
            }).catch(err => console.error("Failed to sync design DNA:", err));
        }
    };

    const currentRoom = ROOMS[currentStep];

    return (
        <div className="min-h-screen bg-main text-main flex flex-col items-center justify-center p-4 pt-24 pb-16 relative overflow-hidden transition-all duration-1000">
            {/* Ambient Background */}
            <div className="ambient-orb ambient-orb-1 opacity-20 blur-[120px]" />
            <div className="ambient-orb ambient-orb-2 opacity-20 blur-[120px]" />

            <div className="w-full max-w-[1400px] relative z-10">
                {currentStep < ROOMS.length ? (
                    <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-98 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}>
                        {/* Progress Header */}
                        <div className="text-center mb-16">
                            <span className="section-tag mb-4">Aesthetic Onboarding</span>
                            <h2 className="font-serif text-5xl md:text-7xl font-black text-main leading-tight mb-6">
                                The <span className="text-gradient-gold italic">{currentRoom.label}</span>
                            </h2>
                            <p className="text-muted text-xl font-light mb-10 max-w-2xl mx-auto">
                                Select the design that resonates most with your personal philosophy.
                            </p>
                            
                            <div className="flex gap-3 justify-center mt-8">
                                {ROOMS.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 rounded-full transition-all duration-700 ${i <= currentStep ? 'w-16 bg-accent' : 'w-4 bg-premium'}`} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Style Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
                            {STYLES.map((style, idx) => (
                                <button
                                    key={style.id}
                                    onClick={() => handleSelect(style.id)}
                                    className="group relative aspect-[4/5] rounded-[48px] overflow-hidden border border-premium hover:border-accent transition-all duration-1000 hover-tilt shadow-premium hover:shadow-accent/20"
                                >
                                    <img 
                                        src={getImageUrl(currentRoom.id, style.id)} 
                                        alt={style.label}
                                        onError={(e) => {
                                            if (e.currentTarget.dataset.fallbackApplied === 'true') return;
                                            e.currentTarget.dataset.fallbackApplied = 'true';
                                            e.currentTarget.src = getFallbackImageUrl(currentRoom.id, style.id);
                                        }}
                                        className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-accent/90 transition-all duration-1000" />
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-end p-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-1000">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 mb-6 group-hover:bg-white/20 flex items-center justify-center transition-all">
                                            <style.icon size={24} className="text-white group-hover:scale-110 transition-transform" />
                                        </div>
                                        <h4 className="font-serif text-3xl font-black text-white italic text-center">{style.label}</h4>
                                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-center leading-relaxed">
                                            {style.desc}
                                        </p>
                                    </div>
                                    
                                    {/* Scanline Effect */}
                                    <div className="absolute left-0 right-0 h-px bg-white/40 shadow-glow-white animate-scan-fast opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Result Screen */
                    <div className="max-w-4xl mx-auto text-center animate-scale-in">
                        <div className="relative mb-16 h-32 w-32 mx-auto">
                            <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse" />
                            <div className="relative w-32 h-32 rounded-full glass-premium flex items-center justify-center border-2 border-accent shadow-glow-accent">
                                <Fingerprint size={64} className="text-accent animate-float" />
                            </div>
                        </div>
                        
                        <span className="section-tag mb-4">Identity Unlocked</span>
                        <h2 className="font-serif text-6xl md:text-9xl font-black text-main leading-[0.9] tracking-tighter mb-10">
                            You are <br />
                            <span className="text-gradient-gold italic">
                                {result === 'Diverse' ? 'Multilayered' : result}
                            </span> <br />
                        </h2>
                        
                        <p className="text-muted text-2xl font-light mb-20 max-w-2xl mx-auto leading-relaxed italic">
                            {result === 'Diverse' 
                                ? "Your taste transcends boundaries. You find beauty in the unexpected fusion of cultures, eras, and textures. An architect of complexity."
                                : `You embody the pure essence of ${result}. Your space is a reflection of ${result.toLowerCase()} principles, curated with intention and architectural clarity.`
                            }
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-8 justify-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn-premium btn-premium-gold px-12 py-5 group"
                            >
                                <Dna size={20} />
                                <span>Enter Dashboard</span>
                                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-premium btn-premium-outline px-12 py-5"
                            >
                                Restart Journey
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
