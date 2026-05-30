import React from 'react';

const SkeletonCard = ({ type = 'room' }) => {
    if (type === 'product') {
        return (
            <div className="skeleton-card bg-surface" role="status" aria-label="Loading product">
                <div className="aspect-square skeleton" />
                <div className="p-5 space-y-3">
                    <div className="h-4 skeleton w-3/4" />
                    <div className="h-3 skeleton w-1/2" />
                    <div className="h-8 skeleton w-full rounded-full mt-4" />
                </div>
            </div>
        );
    }

    return (
        <div className="skeleton-card bg-surface" role="status" aria-label="Loading design">
            <div className="aspect-[4/5] skeleton" />
            <div className="p-6 space-y-3">
                <div className="flex justify-between">
                    <div className="h-3 skeleton w-24" />
                    <div className="h-3 skeleton w-16" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
