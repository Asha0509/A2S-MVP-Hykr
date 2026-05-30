import React, { useState, useEffect } from 'react';
import { 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Sparkles, 
    Compass, 
    Box, 
    Lock,
    Zap
} from 'lucide-react';

const TutorialOverlay = ({ isOpen, onClose, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'auto';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const steps = [
        {
            title: "Welcome to A2S",
            description: "Experience the future of interior design. Let us guide you through your new premium dashboard.",
            icon: <Sparkles className="text-accent" size={32} />,
            highlight: "hero"
        },
        {
            title: "The Design DNA",
            description: "We analyze your preferences to build a unique aesthetic profile. Refine it anytime to keep your vision fresh.",
            icon: <Zap className="text-accent" size={32} />,
            highlight: "dna"
        },
        {
            title: "Expert Consultation",
            description: "Access AI-driven Vastu audits and architectural advice directly from your workspace.",
            icon: <Compass className="text-accent" size={32} />,
            highlight: "vastu"
        },
        {
            title: "3D Visualisation",
            description: "Coming soon: Plan and stage your rooms in photorealistic 3D using our blueprint-to-reality engine.",
            icon: <Box className="text-accent" size={32} />,
            highlight: "3d"
        }
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFinish = () => {
        onFinish();
    };

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-main/80 backdrop-blur-md" onClick={onClose} />
            
            {/* Content Card */}
            <div className="relative w-full max-w-lg mx-4 overflow-hidden rounded-[40px] bg-white shadow-2xl border border-premium transition-transform duration-500"
                 style={{ transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)' }}>
                
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-offset">
                    <div className="h-full bg-accent transition-all duration-500 ease-out"
                         style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
                </div>

                <div className="p-10 pt-12 text-center">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-offset transition-colors text-muted">
                        <X size={20} />
                    </button>

                    <div className="mb-8 flex justify-center scale-110 animate-pulse-slow">
                        <div className="p-5 rounded-[24px] bg-accent/5">
                            {steps[currentStep].icon}
                        </div>
                    </div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-4">
                        Step {currentStep + 1} of {steps.length}
                    </h3>
                    
                    <h2 className="text-4xl font-serif font-black text-main leading-[1.1] mb-6 italic">
                        {steps[currentStep].title}
                    </h2>

                    <p className="text-base text-muted font-light leading-relaxed mb-10 max-w-sm mx-auto">
                        {steps[currentStep].description}
                    </p>

                    <div className="flex items-center justify-between gap-4">
                        <button 
                            onClick={onClose}
                            className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-main transition-colors"
                        >
                            Skip Tutorial
                        </button>

                        <div className="flex gap-3">
                            {currentStep > 0 && (
                                <button onClick={prevStep} className="p-4 rounded-full border border-premium text-muted hover:bg-offset transition-all">
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <button 
                                onClick={nextStep}
                                className="btn-premium btn-premium-gold px-8 py-4"
                            >
                                <span>{currentStep === steps.length - 1 ? 'Start Experience' : 'Next Step'}</span>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            </div>
        </div>
    );
};

export default TutorialOverlay;
