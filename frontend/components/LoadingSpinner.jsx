import React from 'react';

const LoadingSpinner = ({ message = 'Unfolding beauty...', size = 'md' }) => {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-14 h-14',
        lg: 'w-20 h-20',
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4" role="status" aria-label={message}>
            <div className={`${sizes[size]} relative`}>
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-premium" />
                {/* Spinning accent ring */}
                <div className="absolute inset-0 rounded-full border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
                {/* Inner glow */}
                <div className="absolute inset-2 rounded-full bg-accent/5 animate-pulse" />
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-accent animate-pulse">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
