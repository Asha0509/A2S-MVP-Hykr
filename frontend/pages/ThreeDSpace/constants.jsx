import React from 'react';
import {
    Armchair, Bed, Monitor, DoorOpen, Trash2,
    Square, Flower2, Tv, Fan, Frame, Lightbulb, CloudSun
} from 'lucide-react';

export const GRID_SIZE = 20;

export const CATALOG = [
    // Floor Items (category: Furniture, Rugs, Plants)
    { id: 'c-sofa', name: 'Modern Sofa', category: 'Furniture', placement: 'floor', width: 210, depth: 90, zHeight: 85, icon: <Armchair size={30} className="text-gray-700" />, supportedRooms: ['Living Room', 'Office'] },
    { id: 'c-bed', name: 'Queen Bed', category: 'Furniture', placement: 'floor', width: 160, depth: 200, zHeight: 60, icon: <Bed size={30} className="text-gray-700" />, supportedRooms: ['Bedroom'] },
    { id: 'c-table', name: 'Coffee Table', category: 'Furniture', placement: 'floor', width: 100, depth: 60, zHeight: 45, icon: <Square size={30} className="text-amber-800" />, supportedRooms: ['Living Room', 'Bedroom', 'Office'] },
    { id: 'c-wardrobe', name: 'Wardrobe', category: 'Furniture', placement: 'floor', width: 120, depth: 60, zHeight: 200, icon: <div className="w-full h-full bg-amber-100 flex items-center justify-center border-2 border-amber-900/30 font-bold text-[10px]">WARDROBE</div>, supportedRooms: ['Bedroom'] },
    { id: 'c-rug', name: 'Persian Rug', category: 'Rugs', placement: 'floor', width: 240, depth: 170, zHeight: 2, icon: <div className="w-full h-full bg-red-900/40 rounded border border-red-800 flex items-center justify-center text-xs opacity-50 font-bold">RUG</div>, supportedRooms: ['Living Room', 'Bedroom', 'Dining Room'] },
    { id: 'c-plant-l', name: 'Monstera Large', category: 'Plants', placement: 'floor', width: 50, depth: 50, zHeight: 120, icon: <Flower2 size={24} className="text-green-600" />, supportedRooms: ['Living Room', 'Bedroom', 'Office', 'Dining Room'] },
    { id: 'c-plant-s', name: 'Snake Plant', category: 'Plants', placement: 'floor', width: 30, depth: 30, zHeight: 40, icon: <Flower2 size={20} className="text-emerald-700" />, supportedRooms: ['Living Room', 'Bedroom', 'Office', 'Bathroom'] },

    // Wall Items (category: Decor, Lighting)
    { id: 'c-tv', name: '55" Wall TV', category: 'Decor', placement: 'wall', width: 123, depth: 71, zHeight: 5, icon: <Tv size={24} className="text-black" />, supportedRooms: ['Living Room', 'Bedroom'] },
    { id: 'c-ac', name: '1.5T Split AC', category: 'Decor', placement: 'wall', width: 90, depth: 30, zHeight: 22, icon: <Fan size={20} className="text-gray-400" />, supportedRooms: ['Living Room', 'Bedroom', 'Office', 'Dining Room'] },
    { id: 'c-art', name: 'Abstract Art', category: 'Decor', placement: 'wall', width: 70, depth: 90, zHeight: 3, icon: <Frame size={24} className="text-pink-600" />, supportedRooms: ['Living Room', 'Bedroom', 'Office', 'Dining Room'] },
    { id: 'c-sconce', name: 'Wall Sconce', category: 'Lighting', placement: 'wall', width: 25, depth: 35, zHeight: 15, icon: <Lightbulb size={20} className="text-yellow-500" />, supportedRooms: ['Living Room', 'Bedroom', 'Bathroom', 'Dining Room'] },

    // Structural Items (category: Structural)
    { id: 'c-window', name: 'Standard Window', category: 'Structural', placement: 'wall', width: 120, depth: 100, zHeight: 10, icon: <CloudSun size={24} className="text-blue-300" />, supportedRooms: ['Living Room', 'Bedroom', 'Office', 'Dining Room', 'Bathroom'] },
    { id: 'c-door', name: 'Standard Door', category: 'Structural', placement: 'wall', width: 90, depth: 210, zHeight: 12, icon: <DoorOpen size={24} className="text-amber-900" />, supportedRooms: ['Living Room', 'Bedroom', 'Office', 'Dining Room', 'Bathroom'] },
];

export const AVAILABLE_CATEGORIES = ['All', 'Furniture', 'Decor', 'Plants', 'Lighting', 'Structural', 'Rugs'];

// Point-in-polygon validation helper
export const isPointInPolygon = (point, polygon) => {
    if (!polygon || polygon.length < 3) return true; // No polygon = allow all

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};
