import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
            
            {/* Modal Card */}
            <div className="relative w-full max-w-md glass-premium rounded-[40px] border border-white/20 shadow-4xl overflow-hidden animate-scale-in">
                {/* Ambient Glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20 ${type === 'danger' ? 'bg-red-500' : 'bg-accent'}`} />
                
                <div className="p-10 relative z-10 flex flex-col items-center text-center">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-muted transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border ${type === 'danger' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
                        <AlertCircle size={32} />
                    </div>

                    <h2 className="font-serif text-2xl md:text-3xl font-black text-main italic mb-4 leading-tight">
                        {title}
                    </h2>
                    
                    <p className="text-muted text-sm font-light leading-relaxed mb-10 max-w-[280px]">
                        {message}
                    </p>

                    <div className="w-full flex flex-col gap-3">
                        <button 
                            onClick={onConfirm}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${type === 'danger' ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'btn-premium btn-premium-gold'}`}
                        >
                            {confirmText}
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted hover:text-main hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
