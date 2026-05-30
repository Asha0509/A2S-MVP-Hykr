import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorDisplay = ({
    message = 'Something unexpected happened',
    details = null,
    onRetry = null,
    showIcon = true,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {showIcon && (
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-red-500" />
                </div>
            )}
            <h3 className="font-serif text-xl font-bold text-a2s-charcoal mb-2">
                {message}
            </h3>
            {details && (
                <p className="text-sm text-gray-500 mb-6 max-w-md">
                    {details}
                </p>
            )}
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="btn-primary inline-flex items-center gap-2"
                >
                    <RefreshCw size={16} />
                    Try Again
                </button>
            )}
        </div>
    );
};

export default ErrorDisplay;
