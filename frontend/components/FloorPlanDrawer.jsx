import React, { useState, useRef, useEffect } from 'react';
import {
    Plus, Trash2, Square, RotateCcw, Check, Ruler,
    Move, Grid as GridIcon, Info, MousePointer2, Layout
} from 'lucide-react';

const FloorPlanDrawer = ({ onComplete, initialPoints = null, gridSize = 20 }) => {
    const [points, setPoints] = useState(initialPoints || []);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [draggedPoint, setDraggedPoint] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [showMeasurements, setShowMeasurements] = useState(true);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const CM_TO_PX = 0.5; // 1cm = 0.5px for visualization

    const snap = (value) => snapToGrid ? Math.round(value / gridSize) * gridSize : value;

    const calculateArea = (pts) => {
        if (pts.length < 3) return 0;
        let area = 0;
        for (let i = 0; i < pts.length; i++) {
            const j = (i + 1) % pts.length;
            area += pts[i].x * pts[j].y;
            area -= pts[j].x * pts[i].y;
        }
        return Math.abs(area / 2) / (CM_TO_PX * CM_TO_PX);
    };

    const distance = (p1, p2) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy) / CM_TO_PX;
    };

    const isSelfIntersecting = (pts) => {
        if (pts.length < 4) return false;
        for (let i = 0; i < pts.length; i++) {
            const line1 = [pts[i], pts[(i + 1) % pts.length]];
            for (let j = i + 2; j < pts.length; j++) {
                if (j === pts.length - 1 && i === 0) continue;
                const line2 = [pts[j], pts[(j + 1) % pts.length]];
                if (linesIntersect(line1[0], line1[1], line2[0], line2[1])) return true;
            }
        }
        return false;
    };

    const linesIntersect = (p1, p2, p3, p4) => {
        const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
        return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    };

    const handleCanvasClick = (e) => {
        if (isCompleted || draggedPoint !== null) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = snap(e.clientX - rect.left);
        const y = snap(e.clientY - rect.top);
        if (points.length >= 3) {
            const firstPoint = points[0];
            const dist = Math.sqrt((x - firstPoint.x) ** 2 + (y - firstPoint.y) ** 2);
            if (dist < 20) { completePolygon(); return; }
        }
        setPoints([...points, { x, y }]);
    };

    const completePolygon = () => {
        if (points.length < 3) return;
        if (isSelfIntersecting(points)) return;
        setIsCompleted(true);
    };

    const handleMouseDown = (e, index) => {
        e.stopPropagation();
        setDraggedPoint(index);
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (draggedPoint !== null) {
            const snappedX = snap(Math.max(0, Math.min(CANVAS_WIDTH, x)));
            const snappedY = snap(Math.max(0, Math.min(CANVAS_HEIGHT, y)));
            setPoints(points.map((p, i) => i === draggedPoint ? { x: snappedX, y: snappedY } : p));
        }

        const hovered = points.findIndex(p => {
            const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
            return dist < 12;
        });
        setHoveredPoint(hovered >= 0 ? hovered : null);
    };

    const handleMouseUp = () => {
        setDraggedPoint(null);
    };

    const deletePoint = (index) => {
        if (points.length <= 3) return;
        setPoints(points.filter((_, i) => i !== index));
        setIsCompleted(false);
    };

    const reset = () => {
        setPoints([]);
        setIsCompleted(false);
    };

    const loadPreset = (shape) => {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const scale = 200;
        let p = [];
        if (shape === 'rectangle') p = [{ x: centerX - scale, y: centerY - scale * 0.75 }, { x: centerX + scale, y: centerY - scale * 0.75 }, { x: centerX + scale, y: centerY + scale * 0.75 }, { x: centerX - scale, y: centerY + scale * 0.75 }];
        else if (shape === 'l-shape') p = [{ x: centerX - scale, y: centerY - scale }, { x: centerX + scale * 0.5, y: centerY - scale }, { x: centerX + scale * 0.5, y: centerY }, { x: centerX + scale, y: centerY }, { x: centerX + scale, y: centerY + scale }, { x: centerX - scale, y: centerY + scale }];
        setPoints(p.map(pt => ({ x: snap(pt.x), y: snap(pt.y) })));
        setIsCompleted(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Grid
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
        for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

        if (points.length === 0) return;

        // Polygon
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = isCompleted ? '#10b981' : '#a2s-gold';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
        if (isCompleted) {
            ctx.closePath();
            ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
            ctx.fill();
        }
        ctx.stroke();

        // Measurements
        if (showMeasurements && points.length > 1) {
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 10px Inter, sans-serif';
            points.forEach((p, i) => {
                const next = points[(i + 1) % points.length];
                if (!isCompleted && i === points.length - 1) return;
                const d = distance(p, next);
                const midX = (p.x + next.x) / 2;
                const midY = (p.y + next.y) / 2;
                ctx.save();
                ctx.translate(midX, midY);
                ctx.rotate(Math.atan2(next.y - p.y, next.x - p.x));
                ctx.fillText(`${d.toFixed(0)}cm`, 0, -8);
                ctx.restore();
            });
        }

        // Points
        points.forEach((p, i) => {
            const isFirst = i === 0;
            const isHov = hoveredPoint === i;
            const isDrag = draggedPoint === i;
            ctx.beginPath();
            ctx.arc(p.x, p.y, isDrag ? 10 : isHov ? 8 : 6, 0, Math.PI * 2);
            ctx.fillStyle = isFirst ? '#f59e0b' : '#334155';
            ctx.shadowBlur = isHov ? 10 : 0;
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        if (points.length >= 3 && !isCompleted) {
            ctx.beginPath();
            ctx.arc(points[0].x, points[0].y, 16, 0, Math.PI * 2);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }, [points, isCompleted, hoveredPoint, draggedPoint, showMeasurements]);

    const area = calculateArea(points);

    return (
        <div className="flex flex-col h-full bg-slate-50 font-sans">
            <div className="glass-panel border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-a2s-charcoal rounded-lg text-a2s-gold shadow-md">
                        <Layout size={20} />
                    </div>
                    <div>
                        <h3 className="font-serif text-xl font-bold text-a2s-charcoal leading-none">Precision Architect</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Floor Plan Modeler</p>
                    </div>
                    {area > 0 && (
                        <div className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full">
                            <Check size={14} className="text-green-600" />
                            <span className="text-xs font-bold text-green-700">{(area / 10000).toFixed(2)} m² Total Area</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                        <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-2 rounded-lg transition-all ${snapToGrid ? 'bg-a2s-gold/10 text-a2s-gold font-bold' : 'text-gray-400 hover:text-gray-600'}`} title="Snap to Grid">
                            <GridIcon size={18} />
                        </button>
                        <button onClick={() => setShowMeasurements(!showMeasurements)} className={`p-2 rounded-lg transition-all ${showMeasurements ? 'bg-a2s-gold/10 text-a2s-gold font-bold' : 'text-gray-400 hover:text-gray-600'}`} title="Toggle Measurements">
                            <Ruler size={18} />
                        </button>
                    </div>
                    <button onClick={reset} className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                <div className="flex-grow relative flex items-center justify-center p-8 bg-slate-100/50">
                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-white">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            onClick={handleCanvasClick}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            className="bg-transparent cursor-crosshair"
                        />

                        {!isCompleted && (
                            <div className="absolute top-10 left-10 pointer-events-none animate-fade-in">
                                <div className="bg-a2s-charcoal/80 text-white px-4 py-2 rounded-full text-[10px] font-bold backdrop-blur-md flex items-center gap-2 shadow-xl border border-white/10">
                                    <MousePointer2 size={12} className="text-a2s-gold" />
                                    {points.length === 0 ? 'Click anywhere to start drawing' : 'Click orange point to close shape'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-80 border-l border-gray-200 bg-white flex flex-col shadow-sm">
                    <div className="p-5 border-b border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Geometry Presets</p>
                        <div className="space-y-2">
                            <button onClick={() => loadPreset('rectangle')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-a2s-gold hover:bg-a2s-gold/5 transition-all text-left shadow-sm group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-white transition-colors"><Square size={18} /></div>
                                    <span className="text-sm font-bold text-gray-700">Rectangle</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-300" />
                            </button>
                            <button onClick={() => loadPreset('l-shape')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-a2s-gold hover:bg-a2s-gold/5 transition-all text-left shadow-sm group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 text-purple-500 rounded-lg group-hover:bg-white transition-colors"><Layout size={18} /></div>
                                    <span className="text-sm font-bold text-gray-700">L-Shape</span>
                                </div>
                                <ChevronRight size={14} className="text-gray-300" />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 flex-grow overflow-y-auto custom-scrollbar">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Polygon Vertices</p>
                        <div className="space-y-1.5">
                            {points.map((p, i) => (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${hoveredPoint === i ? 'bg-a2s-gold/5 border-a2s-gold/30 ring-1 ring-a2s-gold/20' : 'bg-gray-50 border-gray-100'}`}>
                                    <span className="text-[11px] font-bold text-gray-600">Point #{i + 1}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-mono text-gray-400">{Math.round(p.x / CM_TO_PX)}×{Math.round(p.y / CM_TO_PX)}</span>
                                        <button onClick={() => deletePoint(i)} className="p-1 hover:text-red-500 transition-colors opacity-40 hover:opacity-100"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {points.length === 0 && <p className="text-xs text-center py-10 text-gray-400 italic">No points added yet.</p>}
                        </div>
                    </div>

                    <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                        {!isCompleted ? (
                            <button
                                onClick={completePolygon}
                                disabled={points.length < 3}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${points.length < 3 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-a2s-gold text-white hover:bg-a2s-gold/90 transform active:scale-95'}`}
                            >
                                <Check size={18} /> Finish Shape
                            </button>
                        ) : (
                            <button
                                onClick={() => onComplete(points, area)}
                                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-95"
                            >
                                <Check size={18} /> Initialize Room
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChevronRight = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);

export default FloorPlanDrawer;
