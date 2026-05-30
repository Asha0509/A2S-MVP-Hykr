import React, { useState, useEffect } from 'react';
import { 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Play, 
    Layout, 
    Box, 
    Search, 
    Palette,
    CheckCircle2
} from 'lucide-react';

const TUTORIAL_STEPS = [
    {
        title: "Welcome to A2S",
        description: "Welcome! Let's take a quick tour of your dashboard.",
        icon: Play,
        target: "header",
        position: "center"
    },
    {
        title: "Explore Gallery",
        description: "Explore curated spaces and save individual products or entire looks to your collection.",
        icon: Search,
        target: "nav-gallery",
        position: "bottom"
    },
    {
        title: "3D Room Planner",
        description: "Plan and see your rooms in 3D. Choose furniture and layouts that work for you.",
        icon: Box,
        target: "nav-3d",
        position: "bottom"
    },
    {
        title: "Theme Settings",
        description: "Change the look of the app. Switch between Light and Dark mode from your settings.",
        icon: Palette,
        target: "nav-account",
        position: "bottom"
    },
    {
        title: "Style Report",
        description: "We analyze your favorite designs to help you find your unique style.",
        icon: Layout,
        target: "dashboard-dna",
        position: "top"
    }
];

const TutorialGuide = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            document.body.style.overflow = 'auto';
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const step = TUTORIAL_STEPS[currentStep];
    const isLast = currentStep === TUTORIAL_STEPS.length - 1;

    const handleNext = () => {
        if (isLast) {
            handleComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    };

    const handleComplete = () => {
        localStorage.setItem('a2s_tutorial_completed', 'true');
        onClose();
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            
            {/* Tutorial Card */}
            <div className="relative w-full max-w-lg glass-premium rounded-[48px] border border-white/20 shadow-4xl overflow-hidden animate-scale-in">
                {/* Ambient Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="p-10 md:p-12 relative z-10">
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/10 text-muted transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center text-accent mb-10 border border-accent/20">
                            <step.icon size={32} />
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                             <div className="w-2 h-0.5 bg-accent" />
                             <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
                             <div className="w-2 h-0.5 bg-accent" />
                        </div>

                        <h2 className="font-serif text-3xl md:text-4xl font-black text-main italic mb-6 leading-tight">
                            {step.title}
                        </h2>
                        
                        <p className="text-muted text-base font-light leading-relaxed mb-12 max-w-sm">
                            {step.description}
                        </p>

                        <div className="w-full flex items-center justify-between gap-4">
                            <button 
                                onClick={onClose}
                                className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-main transition-colors"
                            >
                                Skip Tour
                            </button>

                            <div className="flex items-center gap-3">
                                {currentStep > 0 && (
                                    <button 
                                        onClick={handleBack}
                                        className="w-12 h-12 rounded-full border border-premium flex items-center justify-center text-muted hover:text-main hover:bg-white/5 transition-all"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                )}
                                
                                <button 
                                    onClick={handleNext}
                                    className="btn-premium btn-premium-gold px-8 py-4 min-w-[140px]"
                                >
                                    <span>{isLast ? "Get Started" : "Next"}</span>
                                    {isLast ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5 shadow-inner">
                    <div 
                        className="h-full bg-accent transition-all duration-700 ease-out"
                        style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TutorialGuide;
