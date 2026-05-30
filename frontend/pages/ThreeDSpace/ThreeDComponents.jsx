import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Float, Html } from '@react-three/drei';

export const FurnitureModel = ({ item, catItem, isSelected, onSelect, roomDimensions }) => {
    const { id, x, y, rotation, surface } = item;
    const { width, depth, zHeight, placement, category } = catItem;

    const meshRef = useRef();

    // Material properties based on category
    const materialProps = useMemo(() => {
        if (category === 'Furniture') return { color: '#ffffff', roughness: 0.3, metalness: 0.1 };
        if (category === 'Rugs') return { color: '#8b0000', roughness: 0.9, metalness: 0.0 };
        if (category === 'Plants') return { color: '#2d5a27', roughness: 0.6, metalness: 0.0 };
        if (category === 'Lighting') return { color: '#ffcc00', roughness: 0.1, metalness: 0.8, emissive: '#ffcc00', emissiveIntensity: 0.2 };
        if (category === 'Structural') return { color: '#f8f9fa', roughness: 0.4, metalness: 0.2 };
        return { color: '#444444', roughness: 0.5, metalness: 0.1 };
    }, [category]);

    // Handle orientation and wall placing
    const isWallitem = placement === 'wall';
    const isVerticalWall = surface === 'wall-e' || surface === 'wall-w';

    let rX = 0, rY = 0, rZ = 0;
    let pX = x, pY = 0, pZ = y;

    if (surface === 'wall-n') {
        pX = x + width / 2;
        pY = roomDimensions.height - y - zHeight / 2;
        pZ = depth / 2;
    } else if (surface === 'wall-s') {
        pX = x + width / 2;
        pY = roomDimensions.height - y - zHeight / 2;
        pZ = roomDimensions.depth - depth / 2;
    } else if (surface === 'wall-e') {
        pX = roomDimensions.width - depth / 2;
        pY = roomDimensions.height - y - width / 2;
        pZ = x + depth / 2;
        rY = Math.PI / 2;
    } else if (surface === 'wall-w') {
        pX = depth / 2;
        pY = roomDimensions.height - y - width / 2;
        pZ = x + depth / 2;
        rY = -Math.PI / 2;
    } else {
        // Floor placement
        pX = x + width / 2;
        pY = zHeight / 2;
        pZ = y + (depth || 0) / 2;
        rY = (rotation * Math.PI) / 180;
    }

    const meshArgs = [
        width,
        isWallitem ? (catItem.height || zHeight) : zHeight,
        isWallitem ? depth : (depth || 1)
    ];

    useFrame((state) => {
        if (isSelected && meshRef.current) {
            meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.02);
        }
    });

    return (
        <group position={[pX, pY, pZ]} rotation={[rX, rY, rZ]}>
            <RoundedBox
                ref={meshRef}
                args={meshArgs}
                radius={id === 'c-rug' ? 0.2 : 2}
                smoothness={8}
                onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial
                    {...materialProps}
                    color={isSelected ? '#fee2e2' : materialProps.color}
                    emissive={isSelected ? '#ef4444' : materialProps.emissive}
                    emissiveIntensity={isSelected ? 0.3 : materialProps.emissiveIntensity}
                />
            </RoundedBox>

            {/* Visual indicator for selection */}
            {isSelected && (
                <Float speed={5} rotationIntensity={0.5} floatIntensity={0.5}>
                    <mesh position={[0, (isWallitem ? zHeight : zHeight) / 2 + 20, 0]}>
                        <octahedronGeometry args={[5, 0]} />
                        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
                    </mesh>
                </Float>
            )}

            {/* Detail for Specific Items */}
            {id === 'c-window' && (
                <mesh position={[0, 0, 0.1]}>
                    <planeGeometry args={[width - 10, (catItem.height || zHeight) - 10]} />
                    <meshStandardMaterial color="#93c5fd" transparent opacity={0.6} metalness={0.9} roughness={0} />
                </mesh>
            )}

            {id === 'c-tv' && (
                <mesh position={[0, 0, depth / 2 + 0.5]}>
                    <planeGeometry args={[width - 10, (catItem.height || zHeight) - 10]} />
                    <meshStandardMaterial color="#000000" metalness={1} roughness={0.1} />
                </mesh>
            )}
        </group>
    );
};

export const CustomRoomStructure = ({ points, height, hideCeiling }) => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        if (!points || points.length < 3) return s;
        s.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) s.lineTo(points[i].x, points[i].y);
        s.closePath();
        return s;
    }, [points]);

    const extrudeSettings = useMemo(() => ({
        steps: 1,
        depth: height,
        bevelEnabled: false
    }), [height]);

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <shapeGeometry args={[shape]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.8} metalness={0.05} />
            </mesh>

            {/* Walls */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]} castShadow receiveShadow>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.05} side={THREE.BackSide} />
            </mesh>

            {/* Ceiling */}
            {!hideCeiling && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]} receiveShadow>
                    <shapeGeometry args={[shape]} />
                    <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} />
                </mesh>
            )}

            {/* Decorative Skirting */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
                <extrudeGeometry args={[shape, { depth: 10, bevelEnabled: false }]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.1} />
            </mesh>

            <gridHelper args={[2000, 100, 0x000000, 0x000000]} position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
                <meshBasicMaterial opacity={0.05} transparent />
            </gridHelper>
        </group>
    );
};

export const RoomStructure = ({ dimensions, hideCeiling, invisibleWalls, onWallClick, floorPlanPoints }) => {
    const { width, depth, height } = dimensions;

    if (floorPlanPoints && floorPlanPoints.length >= 3) {
        return <CustomRoomStructure points={floorPlanPoints} height={height} hideCeiling={hideCeiling} />;
    }

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.8} metalness={0.05} />
            </mesh>

            {/* Walls */}
            {/* North Wall */}
            {!invisibleWalls.includes('wall-n') && (
                <mesh position={[width / 2, height / 2, 0]} onClick={() => onWallClick('wall-n')} castShadow receiveShadow>
                    <boxGeometry args={[width, height, 2]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
            )}
            {/* South Wall */}
            {!invisibleWalls.includes('wall-s') && (
                <mesh position={[width / 2, height / 2, depth]} onClick={() => onWallClick('wall-s')} castShadow receiveShadow>
                    <boxGeometry args={[width, height, 2]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
            )}
            {/* East Wall */}
            {!invisibleWalls.includes('wall-e') && (
                <mesh position={[width, height / 2, depth / 2]} rotation={[0, -Math.PI / 2, 0]} onClick={() => onWallClick('wall-e')} castShadow receiveShadow>
                    <boxGeometry args={[depth, height, 2]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
            )}
            {/* West Wall */}
            {!invisibleWalls.includes('wall-w') && (
                <mesh position={[0, height / 2, depth / 2]} rotation={[0, Math.PI / 2, 0]} onClick={() => onWallClick('wall-w')} castShadow receiveShadow>
                    <boxGeometry args={[depth, height, 2]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>
            )}

            {/* Ceiling */}
            {!hideCeiling && (
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[width / 2, height, depth / 2]} receiveShadow>
                    <planeGeometry args={[width, depth]} />
                    <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} />
                </mesh>
            )}

            {/* Skirting boards */}
            <group position={[width / 2, 5, depth / 2]}>
                <mesh position={[0, 0, -depth / 2 + 1]}>
                    <boxGeometry args={[width, 10, 1]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[0, 0, depth / 2 - 1]}>
                    <boxGeometry args={[width, 10, 1]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[-width / 2 + 1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[depth, 10, 1]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[width / 2 - 1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[depth, 10, 1]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
            </group>

            <gridHelper args={[2000, 100, 0x000000, 0x000000]} position={[width / 2, 0.5, depth / 2]} rotation={[0, 0, 0]}>
                <meshBasicMaterial opacity={0.05} transparent />
            </gridHelper>
        </group>
    );
};
