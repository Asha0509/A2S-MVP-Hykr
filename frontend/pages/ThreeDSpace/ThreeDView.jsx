import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { FurnitureModel, RoomStructure } from './ThreeDComponents';
import { Move } from 'lucide-react';

const ThreeDView = ({
    roomDimensions,
    items,
    CATALOG,
    selectedId,
    setSelectedId,
    hideCeiling,
    invisibleWalls,
    setActiveSurface,
    floorPlanPoints
}) => {
    return (
        <div className="absolute inset-0 w-full h-full bg-[#f8fafc]">
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera
                    makeDefault
                    position={[roomDimensions.width, roomDimensions.height * 1.5, roomDimensions.depth]}
                    fov={45}
                />
                <OrbitControls
                    makeDefault
                    minDistance={100}
                    maxDistance={2500}
                    maxPolarAngle={Math.PI / 2.1}
                    enableDamping={true}
                />

                {/* High-End Lighting & Environment */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[500, 1000, 500]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-camera-left={-2000}
                    shadow-camera-right={2000}
                    shadow-camera-top={2000}
                    shadow-camera-bottom={-2000}
                    shadow-bias={-0.0001}
                />
                <pointLight position={[-500, 800, -500]} intensity={0.4} color="#ffd1a9" />
                <Environment preset="apartment" />

                <group position={[-roomDimensions.width / 2, 0, -roomDimensions.depth / 2]}>
                    <RoomStructure
                        dimensions={roomDimensions}
                        hideCeiling={hideCeiling}
                        invisibleWalls={invisibleWalls}
                        onWallClick={(wallId) => setActiveSurface(wallId)}
                        floorPlanPoints={floorPlanPoints}
                    />

                    {items.map(item => {
                        const catItem = CATALOG.find(c => c.id === item.catalogId);
                        if (!catItem) return null;
                        return (
                            <FurnitureModel
                                key={item.id}
                                item={item}
                                catItem={catItem}
                                isSelected={selectedId === item.id}
                                onSelect={setSelectedId}
                                roomDimensions={roomDimensions}
                            />
                        );
                    })}
                </group>

                <ContactShadows
                    position={[0, 0, 0]}
                    opacity={0.4}
                    scale={2000}
                    blur={2}
                    far={10}
                    color="#000000"
                />
            </Canvas>

            {/* HUD Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                <span className="bg-a2s-charcoal/80 text-white px-4 py-2 rounded-full text-[10px] font-bold backdrop-blur-md shadow-2xl flex items-center gap-2">
                    <Move size={14} className="text-a2s-gold" /> Left Click: Orbit · Right Click: Pan · Scroll: Zoom
                </span>
            </div>
        </div>
    );
};

export default ThreeDView;
