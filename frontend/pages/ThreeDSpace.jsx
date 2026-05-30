import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { STORAGE_KEYS } from '../utils/storage';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';
import { CATALOG, GRID_SIZE, isPointInPolygon } from './ThreeDSpace/constants';

// Modular Components
import Toolbar from './ThreeDSpace/Toolbar';
import Sidebar from './ThreeDSpace/Sidebar';
import AssetLibrary from './ThreeDSpace/AssetLibrary';
import ThreeDView from './ThreeDSpace/ThreeDView';
import TwoDView from './ThreeDSpace/TwoDView';
import { LoadModal, SetupModal, VastuModal } from './ThreeDSpace/Modals';

const ThreeDSpace = () => {
    const { toasts, addToast, removeToast, toast } = useToast();
    const [items, setItems] = useState([]);
    const [activeSurface, setActiveSurface] = useState('3d');
    const [selectedId, setSelectedId] = useState(null);
    const [snapLines, setSnapLines] = useState(null);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [roomDimensions, setRoomDimensions] = useState({ width: 800, depth: 600, height: 400 });
    const [roomType, setRoomType] = useState('Bedroom');
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(true);
    const [hideCeiling, setHideCeiling] = useState(true);
    const [invisibleWalls, setInvisibleWalls] = useState([]);

    const [setupMode, setSetupMode] = useState(null);
    const [setupStep, setSetupStep] = useState(1);
    const [floorPlanPoints, setFloorPlanPoints] = useState(null);
    const [floorPlanArea, setFloorPlanArea] = useState(0);

    const [activeCategory, setActiveCategory] = useState('All');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [vastuResult, setVastuResult] = useState(null);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [savedPresets, setSavedPresets] = useState([]);
    const [isImmersive, setIsImmersive] = useState(false);

    const canvasRef = useRef(null);
    const dragItemRef = useRef(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    // Global mouse up
    useEffect(() => {
        const onUp = () => {
            dragItemRef.current = null;
            setSnapLines(null);
        };
        document.addEventListener('mouseup', onUp);
        return () => document.removeEventListener('mouseup', onUp);
    }, []);

    // Keyboard controls
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedId(null);
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                e.preventDefault();
                setItems(prev => prev.filter(i => i.id !== selectedId));
                setSelectedId(null);
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [selectedId]);

    const snap = (v) => (snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v);

    const filteredCatalog = CATALOG.filter(item => {
        const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
        const roomMatch = item.supportedRooms && item.supportedRooms.includes(roomType);
        if (activeSurface === '3d') return categoryMatch && roomMatch;
        const isWall = activeSurface.startsWith('wall');
        const placementMatch = isWall ? item.placement === 'wall' : item.placement === 'floor';
        return categoryMatch && roomMatch && placementMatch;
    });

    const addItem = (catalogItem) => {
        let targetSurface = activeSurface === '3d'
            ? (catalogItem.placement === 'floor' ? 'floor' : 'wall-s')
            : activeSurface;

        if (activeSurface === '3d') {
            setActiveSurface(targetSurface);
        }

        const isWallEW = targetSurface === 'wall-e' || targetSurface === 'wall-w';
        const isFloor = targetSurface === 'floor';
        const viewWidth = isWallEW ? roomDimensions.depth : roomDimensions.width;
        const viewHeight = isFloor ? roomDimensions.depth : roomDimensions.height;

        let cx = viewWidth / 2 - catalogItem.width / 2;
        let cy = viewHeight / 2 - (catalogItem.depth || catalogItem.height || 0) / 2;
        cx = Math.max(0, Math.min(viewWidth - catalogItem.width, cx));
        cy = Math.max(0, Math.min(viewHeight - (catalogItem.depth || catalogItem.height || 0), cy));

        const newItem = {
            id: Date.now().toString(),
            catalogId: catalogItem.id,
            surface: targetSurface,
            x: snap(cx),
            y: snap(cy),
            rotation: 0
        };

        setItems(prev => [...prev, newItem]);
        setSelectedId(newItem.id);
        setVastuResult(null);
    };

    const handleMouseDown = (e, id) => {
        e.stopPropagation();
        if (activeSurface === '3d') return;
        const item = items.find(i => i.id === id);
        if (!item || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        dragItemRef.current = id;
        dragOffsetRef.current = {
            x: e.clientX - rect.left - item.x,
            y: e.clientY - rect.top - item.y
        };
        setSelectedId(id);
    };

    const handleMouseMove = (e) => {
        if (!dragItemRef.current || !canvasRef.current) return;
        const draggedItem = items.find(i => i.id === dragItemRef.current);
        if (!draggedItem) return;
        const catItem = CATALOG.find(c => c.id === draggedItem.catalogId);
        if (!catItem) return;

        const rect = canvasRef.current.getBoundingClientRect();
        let newX = e.clientX - rect.left - dragOffsetRef.current.x;
        let newY = e.clientY - rect.top - dragOffsetRef.current.y;

        const SNAP_THRESHOLD = 25;
        let containerW = roomDimensions.width;
        let containerH = roomDimensions.height;

        if (activeSurface === 'floor') {
            containerW = roomDimensions.width; containerH = roomDimensions.depth;
        } else if (activeSurface === 'wall-e' || activeSurface === 'wall-w') {
            containerW = roomDimensions.depth; containerH = roomDimensions.height;
        }

        const isVertical = Math.abs((draggedItem.rotation || 0) % 180) === 90;
        const w = catItem.width;
        const h = catItem.depth || catItem.height || 0;
        const visualW = isVertical ? h : w;
        const visualH = isVertical ? w : h;

        const cx = newX + w / 2;
        const cy = newY + h / 2;
        const leftEdge = cx - visualW / 2;
        const rightEdge = cx + visualW / 2;
        const topEdge = cy - visualH / 2;
        const bottomEdge = cy + visualH / 2;

        let snappedX = false;
        let snappedY = false;
        if (Math.abs(leftEdge) < SNAP_THRESHOLD) { newX = visualW / 2 - w / 2; snappedX = true; }
        else if (Math.abs(rightEdge - containerW) < SNAP_THRESHOLD) { newX = containerW - visualW / 2 - w / 2; snappedX = true; }
        if (Math.abs(topEdge) < SNAP_THRESHOLD) { newY = visualH / 2 - h / 2; snappedY = true; }
        else if (Math.abs(bottomEdge - containerH) < SNAP_THRESHOLD) { newY = containerH - visualH / 2 - h / 2; snappedY = true; }

        newX = Math.max(visualW / 2 - w / 2, Math.min(containerW - visualW / 2 - w / 2, newX));
        newY = Math.max(visualH / 2 - h / 2, Math.min(containerH - visualH / 2 - h / 2, newY));

        setSnapLines({
            vertical: snappedX ? (Math.abs(leftEdge) < SNAP_THRESHOLD ? 0 : containerW) : undefined,
            horizontal: snappedY ? (Math.abs(topEdge) < SNAP_THRESHOLD ? 0 : containerH) : undefined
        });

        setItems(prev => prev.map(item =>
            item.id === dragItemRef.current ? { ...item, x: snap(newX), y: snap(newY) } : item
        ));
    };

    const rotateItem = () => {
        if (!selectedId) return;
        setItems(prev => prev.map(item =>
            item.id === selectedId ? { ...item, rotation: (item.rotation + 90) % 360 } : item
        ));
    };

    const rotateItemCcw = () => {
        if (!selectedId) return;
        setItems(prev => prev.map(item =>
            item.id === selectedId ? { ...item, rotation: (item.rotation - 90 + 360) % 360 } : item
        ));
    };

    const deleteItem = () => {
        if (!selectedId) return;
        setItems(prev => prev.filter(i => i.id !== selectedId));
        setSelectedId(null);
    };

    const saveProject = () => {
        const name = window.prompt("Name your design preset:", "My Dream Room " + new Date().toLocaleDateString());
        if (!name) return;
        const newPreset = {
            id: Date.now().toString(),
            name,
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items,
            itemCount: items.length,
            roomType
        };
        try {
            const existingRaw = localStorage.getItem(STORAGE_KEYS.SAVED_PRESETS);
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            localStorage.setItem(STORAGE_KEYS.SAVED_PRESETS, JSON.stringify([newPreset, ...existing]));
            toast.success(`Saved "${name}" successfully!`);
        } catch (err) {
            toast.error("Failed to save project.");
        }
    };

    const fetchPresets = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PRESETS);
            setSavedPresets(raw ? JSON.parse(raw) : []);
        } catch (e) {
            setSavedPresets([]);
        }
    };

    const performVastuAudit = async () => {
        setIsAnalyzing(true);
        const descriptions = items.map(item => {
            const catItem = CATALOG.find(c => c.id === item.catalogId);
            if (!catItem) return "";
            if (item.surface === 'floor') {
                const cx = item.x + catItem.width / 2;
                const cy = item.y + (catItem.depth || 0) / 2;
                let loc = "";
                if (cy < roomDimensions.depth / 3) loc = cx < roomDimensions.width / 3 ? "North-West" : cx > (roomDimensions.width * 2) / 3 ? "North-East" : "North";
                else if (cy > (roomDimensions.depth * 2) / 3) loc = cx < roomDimensions.width / 3 ? "South-West" : cx > (roomDimensions.width * 2) / 3 ? "South-East" : "South";
                else loc = cx < roomDimensions.width / 3 ? "West" : cx > (roomDimensions.width * 2) / 3 ? "East" : "Center";
                return `Floor Item: ${catItem.name} in ${loc}.`;
            }
            return `Wall Item: ${catItem.name} on ${item.surface.replace('wall-', '').toUpperCase()} wall.`;
        }).filter(Boolean);

        try {
            const result = await geminiService.performVastuAudit(roomType, descriptions.join(" "));
            setVastuResult(result);
        } catch (err) {
            console.error('Vastu audit failed:', err);
            toast.error(err?.message || 'Failed to perform Vastu audit');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderItem = (item, isInteractive) => {
        const catItem = CATALOG.find(c => c.id === item.catalogId);
        if (!catItem) return null;
        const isSelected = selectedId === item.id;
        const w = catItem.width;
        const h = catItem.depth || catItem.height || 0;

        return (
            <div
                key={item.id}
                onMouseDown={(e) => isInteractive && handleMouseDown(e, item.id)}
                className={`absolute flex items-center justify-center transition-all shadow-sm
                    ${isInteractive ? 'cursor-move' : 'pointer-events-none'}
                    ${isSelected ? 'border-2 border-a2s-gold z-50 shadow-lg ring-2 ring-a2s-gold/50' : 'border border-gray-300/50 hover:border-blue-400'}
                    ${item.surface === 'floor' ? 'bg-white/90' : 'bg-white/80'}
                `}
                style={{
                    left: item.x,
                    top: item.y,
                    width: w,
                    height: h,
                    transform: `rotate(${item.rotation}deg)`,
                }}
            >
                <div className="text-gray-600 scale-75 md:scale-100 pointer-events-none">{catItem.icon}</div>
            </div>
        );
    };

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="h-screen bg-main overflow-hidden transition-all duration-1000 relative">
                {/* Ambient Background Orbs */}
                <div className="ambient-orb ambient-orb-1 opacity-40 blur-[120px]" />
                <div className="ambient-orb ambient-orb-2 opacity-40 blur-[120px]" />

                {/* Floating Command Center */}
                {!isImmersive && (
                    <Toolbar
                        snapToGrid={snapToGrid} setSnapToGrid={setSnapToGrid}
                        setIsSetupModalOpen={setIsSetupModalOpen}
                        openLoadModal={() => { fetchPresets(); setIsLoadModalOpen(true); }}
                        saveProject={saveProject}
                        performVastuAudit={performVastuAudit}
                        isAnalyzing={isAnalyzing}
                        activeSurface={activeSurface}
                        hideCeiling={hideCeiling} setHideCeiling={setHideCeiling}
                        invisibleWalls={invisibleWalls} setInvisibleWalls={setInvisibleWalls}
                    />
                )}

                {/* Main Viewport - Now spans full screen */}
                <div className="absolute inset-0 z-0">
                    {activeSurface === '3d' ? (
                        <ThreeDView
                            roomDimensions={roomDimensions}
                            items={items} CATALOG={CATALOG}
                            selectedId={selectedId} setSelectedId={setSelectedId}
                            hideCeiling={hideCeiling} invisibleWalls={invisibleWalls}
                            setActiveSurface={setActiveSurface}
                            floorPlanPoints={floorPlanPoints}
                        />
                    ) : (
                        <TwoDView
                            activeSurface={activeSurface}
                            roomDimensions={roomDimensions}
                            snapToGrid={snapToGrid} GRID_SIZE={GRID_SIZE}
                            items={items} renderItem={renderItem}
                            snapLines={snapLines} setActiveSurface={setActiveSurface}
                            canvasRef={canvasRef}
                            handleMouseMove={handleMouseMove}
                            handleMouseUp={() => { dragItemRef.current = null; setSnapLines(null); }}
                        />
                    )}
                </div>

                {/* Floating Studio Panels */}
                {!isImmersive && (
                    <>
                        <Sidebar
                            items={items} setItems={setItems}
                            selectedId={selectedId} setSelectedId={setSelectedId}
                            CATALOG={CATALOG}
                            activeSurface={activeSurface} setActiveSurface={setActiveSurface}
                            rotateItem={rotateItem} rotateItemCcw={rotateItemCcw}
                            deleteItem={deleteItem}
                        />
                        <AssetLibrary
                            activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                            activeSurface={activeSurface}
                            addItem={addItem}
                            filteredCatalog={filteredCatalog}
                        />
                    </>
                )}
                <LoadModal
                    isLoadModalOpen={isLoadModalOpen} setIsLoadModalOpen={setIsLoadModalOpen}
                    savedPresets={savedPresets}
                    loadPresetIntoScene={(p) => { setItems(p.items); setIsLoadModalOpen(false); }}
                    deletePreset={(e, id) => {
                        e.stopPropagation();
                        const updated = savedPresets.filter(p => p.id !== id);
                        setSavedPresets(updated);
                        localStorage.setItem(STORAGE_KEYS.SAVED_PRESETS, JSON.stringify(updated));
                    }}
                />

                <SetupModal
                    isSetupModalOpen={isSetupModalOpen} setIsSetupModalOpen={setIsSetupModalOpen}
                    setupStep={setupStep} setSetupStep={setSetupStep}
                    setupMode={setupMode} setSetupMode={setSetupMode}
                    roomType={roomType} setRoomType={setRoomType}
                    roomDimensions={roomDimensions} setRoomDimensions={setRoomDimensions}
                    setFloorPlanPoints={setFloorPlanPoints} setFloorPlanArea={setFloorPlanArea}
                    floorPlanPoints={floorPlanPoints} floorPlanArea={floorPlanArea}
                    hasItems={items.length > 0}
                />

                <VastuModal vastuResult={vastuResult} setVastuResult={setVastuResult} />
            </div>
        </>
    );
};

export default ThreeDSpace;
