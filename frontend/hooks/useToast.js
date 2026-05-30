// Toast notification hook
import { useState, useCallback } from 'react';

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return {
        toasts,
        addToast,
        removeToast,
        toast: {
            success: (msg) => addToast(msg, 'success'),
            error: (msg) => addToast(msg, 'error'),
            warning: (msg) => addToast(msg, 'warning'),
            info: (msg) => addToast(msg, 'info'),
        }
    };
};
