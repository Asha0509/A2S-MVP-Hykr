import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
    const icons = {
        success: <CheckCircle size={20} className="text-green-600" />,
        error: <XCircle size={20} className="text-red-600" />,
        warning: <AlertCircle size={20} className="text-yellow-600" />,
        info: <Info size={20} className="text-blue-600" />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200'
    };

    const textColors = {
        success: 'text-green-800',
        error: 'text-red-800',
        warning: 'text-yellow-800',
        info: 'text-blue-800'
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${bgColors[type]} border ${textColors[type]} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in-right`}>
            {icons[type]}
            <p className="text-sm font-medium flex-grow">{message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-black/10 rounded-lg transition"
            >
                <XCircle size={16} />
            </button>
        </div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
