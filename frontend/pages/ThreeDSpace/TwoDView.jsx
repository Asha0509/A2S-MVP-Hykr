import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TwoDView = ({
    activeSurface,
    roomDimensions,
    snapToGrid,
    GRID_SIZE,
    items,
    renderItem,
    snapLines,
    setActiveSurface,
    canvasRef,
    handleMouseMove,
    handleMouseUp
}) => {
    return (
        <div
            className="flex-grow relative overflow-hidden flex items-center justify-center bg-gray-200/50 backdrop-blur-sm"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <button
                onClick={() => setActiveSurface('3d')}
                className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-bold flex items-center gap-2 hover:bg-gray-50 border border-gray-200 z-20"
            >
                <ArrowLeft size={16} /> Back to 3D
            </button>

            <div
                ref={canvasRef}
                className="bg-white shadow-2xl relative border-4 border-gray-300 transition-all duration-300"
                style={{
                    width: activeSurface === 'wall-e' || activeSurface === 'wall-w' ? roomDimensions.depth : roomDimensions.width,
                    height: activeSurface === 'floor' ? roomDimensions.depth : roomDimensions.height,
                    backgroundImage: activeSurface === 'floor'
                        ? snapToGrid
                            ? `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`
                            : 'radial-gradient(#e5e7eb 1px, transparent 1px)'
                        : 'linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)',
                    backgroundSize: activeSurface === 'floor' && snapToGrid ? `${GRID_SIZE}px ${GRID_SIZE}px` : '20px 20px'
                }}
            >
                {/* Items for active surface */}
                {items.filter(i => i.surface === activeSurface).map(item => renderItem(item, true))}

                {/* Snap Lines */}
                {snapLines?.vertical !== undefined && (
                    <div className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none" style={{ left: snapLines.vertical }} />
                )}
                {snapLines?.horizontal !== undefined && (
                    <div className="absolute left-0 right-0 h-px bg-red-500 z-50 pointer-events-none" style={{ top: snapLines.horizontal }} />
                )}

                {/* Placeholder Text */}
                {items.filter(i => i.surface === activeSurface).length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <p className="text-2xl font-serif text-gray-400">
                            {activeSurface === 'floor' ? 'Place Furniture Here' : 'Decorate Wall'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TwoDView;
