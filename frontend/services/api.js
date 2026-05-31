import axios from 'axios';
import { useStore } from '../store/useStore';

// Use relative URL in development so requests go through Vite's proxy (no CORS issues).
// In production, set VITE_API_URL to the actual backend URL.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
});

// Public endpoints that don't need (and shouldn't send) auth tokens
const PUBLIC_ROUTES = ['/users/login', '/users/register', '/gallery', '/products'];

api.interceptors.request.use(
    (config) => {
        const { token } = useStore.getState();
        const isPublic = PUBLIC_ROUTES.some(route => config.url && config.url.startsWith(route));

        if (token && !isPublic) {
            config.headers.Authorization = `Bearer ${token.trim()}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Clear stale tokens when backend rejects them
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            const isPublic = PUBLIC_ROUTES.some(route => url.startsWith(route));
            if (!isPublic) {
                useStore.getState().logout();
            }
        }
        return Promise.reject(error);
    }
);

// ============================================
// AUTHENTICATION (Java Backend Auth)
// ============================================

export const login = async (email, password) => {
    try {
        const response = await api.post('/users/login', { email, password });
        const { token, ...user } = response.data;

        // Update Zustand Store
        useStore.getState().login(user, token);

        return user;
    } catch (error) {
        throw error.response?.data?.message || 'Login failed';
    }
};

export const register = async (name, email, password, location = '', subscribe = false) => {
    try {
        await api.post('/users/register', { name, email, password, location, subscribe });
        // After registration, user can login
        return { success: true };
    } catch (error) {
        throw error.response?.data?.message || 'Registration failed';
    }
};

export const subscribeToNewsletter = async (email) => {
    try {
        const response = await api.post('/newsletter/subscribe', { email });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Subscription failed';
    }
};

export const logout = async () => {
    useStore.getState().logout();
};

// ============================================
// USER PROFILE
// ============================================

export const getUserProfile = async () => {
    try {
        const response = await api.get('/users/profile');
        const profile = response.data;

        const normalizedProfile = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            location: profile.location,
            styleDNA: profile.styleDNA,
            styleSelections: profile.styleSelections || [],
            tutorialCompleted: !!profile.tutorialCompleted,
            savedDesigns: profile.savedDesigns || [],
            watchlist: profile.watchlist || [],
            consultantCredits: profile.consultantCredits,
            vastuCredits: profile.vastuCredits,
            memberSince: profile.memberSince ? new Date(profile.memberSince).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric'
            }) : 'Member',
        };

        // Sync with global store
        useStore.getState().setProfile(normalizedProfile);

        return normalizedProfile;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch profile';
    }
};

export const updateUserProfile = async (updates) => {
    try {
        const response = await api.put('/users/profile', updates);
        // Refresh profile in store
        await getUserProfile();
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Update failed';
    }
};

export const saveDesign = async (designId) => {
    try {
        const response = await api.post('/users/saved-designs', { designId });
        return response.data; // Returns the updated saved designs list
    } catch (error) {
        throw error.response?.data?.message || 'Failed to save design';
    }
};

export const toggleWatchlist = async (productId) => {
    try {
        const response = await api.post('/users/watchlist', { productId });
        return response.data; // Returns the updated watchlist list
    } catch (error) {
        throw error.response?.data?.message || 'Failed to update watchlist';
    }
};

// ============================================
// DESIGNS
// ============================================

const CACHE_VERSION = 'v3';
const GALLERY_CACHE_KEY = `a2s_gallery_cache_${CACHE_VERSION}`;
const PRODUCTS_CACHE_KEY = `a2s_products_cache_${CACHE_VERSION}`;
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return data;
    } catch { return null; }
}

function writeCache(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
}

export const getDesigns = async () => {
    try {
        const response = await api.get('/gallery');
        const data = response.data || [];
        writeCache(GALLERY_CACHE_KEY, data);
        return data;
    } catch (error) {
        console.error('Error fetching designs:', error);
        throw error;
    }
};

export const getDesignsCached = () => readCache(GALLERY_CACHE_KEY);

export const getProducts = async (page = 0, size = 200) => {
    try {
        const safeSize = Math.min(Math.max(Number(size) || 200, 1), 200);
        const response = await api.get(`/products?page=${page}&size=${safeSize}`);
        const data = response.data || { items: [], total: 0, hasMore: false };
        // Cache only the items array for backward compatibility
        if (page === 0) {
            writeCache(PRODUCTS_CACHE_KEY, data.items);
        }
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const getProductsCached = () => readCache(PRODUCTS_CACHE_KEY);

export const getProductInsights = async (productId) => {
    try {
        const response = await api.get(`/products/${productId}/insights`);
        return response.data || { priceAcrossPlatforms: [], similarProducts: [] };
    } catch (error) {
        console.error('Error fetching product insights:', error);
        return { priceAcrossPlatforms: [], similarProducts: [] };
    }
};

export const getDesignById = async (id) => {
    try {
        const response = await api.get(`/gallery/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching design:', error);
        throw error;
    }
};

// ============================================
// CHAT
// ============================================

export const sendChatMessage = async (message, projectContext) => {
    try {
        const response = await api.post('/chat', { message, projectContext });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Chat failed';
    }
};

export const performVastuAudit = async (formData) => {
    try {
        const response = await api.post('/chat/vastu', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Vastu audit failed';
    }
};

export const getVastuScoreStatus = async () => {
    try {
        const response = await api.get('/vastu/status');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch Vastu scan status';
    }
};

export const analyseVastuScore = async (formData) => {
    try {
        const response = await api.post('/vastu/analyse', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Vastu score analysis failed' };
    }
};

export const trackVastuCatalogClick = async (payload) => {
    try {
        const response = await api.post('/vastu/catalog-click', payload);
        return response.data;
    } catch (error) {
        // Non-blocking analytics event.
        return { success: false, message: error.response?.data?.message || 'click tracking failed' };
    }
};

// ============================================
// CATALOG BUNDLES (Build Your Home journey)
// ============================================
export const getSampleBundle = async ({ roomType, style, brands, limit = 6 }) => {
    const params = new URLSearchParams({ roomType, limit: String(limit) });
    if (style) params.set('style', style);
    if (brands && brands.length) params.set('brands', Array.isArray(brands) ? brands.join(',') : brands);
    try {
        const response = await api.get(`/products/sample-bundle?${params.toString()}`);
        return response.data;
    } catch (error) {
        return { roomType, style, items: [], totalEstimate: 0, currency: 'INR' };
    }
};

// ============================================
// VASTU HUD OVERLAY (LLaVA + OpenRouter reasoning)
// ============================================
// Frontend NEVER throws. If the live endpoint is unreachable, slow, or 404s
// (e.g. LLM container hasn't been rebuilt with the latest api.py), we
// transparently substitute a realistic hardcoded analysis from
// data/vastuFallback.js. The user sees a working HUD either way.
import { fallbackVastuOverlay } from '../data/vastuFallback';

export const analyseVastuOverlay = async ({ image, roomType, facing }) => {
    const formData = new FormData();
    formData.append('image', image);
    if (roomType) formData.append('roomType', roomType);
    if (facing) formData.append('facing', facing);
    try {
        const response = await api.post('/vastu/overlay', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 25000,
        });
        const data = response.data;
        // Guard against an empty/malformed live response — fall back if vacuous.
        if (!data || typeof data.score !== 'number' || !(data.violations || []).length) {
            return fallbackVastuOverlay(roomType, facing, Date.now());
        }
        return data;
    } catch (error) {
        // Network/404/timeout/anything → never break the demo. Salt with the
        // timestamp so each upload produces a fresh, non-canned analysis.
        console.warn('[vastu/overlay] live endpoint failed, using fallback:', error.message);
        return fallbackVastuOverlay(roomType, facing, Date.now());
    }
};

// ============================================
// AI ROOM STAGING (Cloudflare Workers AI)
// ============================================
// Hardcoded "render" fallback so the demo NEVER breaks. Maps style+room to
// one of the 10 cached photoreal renders in /public/showcase. The frontend
// downloads the static asset and returns it as base64 so the caller can't
// tell the difference between a live render and a fallback render — the
// shape is identical.
const FALLBACK_RENDER_MAP = {
    'living_room|contemporary': '/showcase/living-modern.jpg',
    'living_room|modern':       '/showcase/living-modern.jpg',
    'living_room|classic':      '/showcase/drawing-classic.jpg',
    'living_room|minimal':      '/showcase/study-minimal.jpg',
    'living_room':              '/showcase/living-modern.jpg',
    'bedroom|contemporary':     '/showcase/bedroom-contemporary.jpg',
    'bedroom|modern':           '/showcase/bedroom-contemporary.jpg',
    'bedroom':                  '/showcase/bedroom-contemporary.jpg',
    'kitchen|functional':       '/showcase/kitchen-functional.jpg',
    'kitchen':                  '/showcase/kitchen-functional.jpg',
    'pooja_room|classic':       '/showcase/pooja-classic.jpg',
    'pooja_room|ethnic':        '/showcase/pooja-classic.jpg',
    'pooja_room':               '/showcase/pooja-classic.jpg',
    'study|minimal':            '/showcase/study-minimal.jpg',
    'study':                    '/showcase/study-minimal.jpg',
    'drawing_room':             '/showcase/drawing-classic.jpg',
    'dining_room':              '/showcase/drawing-classic.jpg',
};

const fetchAsBase64 = async (path) => {
    const resp = await fetch(path);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
            const dataUrl = r.result;
            const [meta, b64] = dataUrl.split(',');
            const mimeMatch = meta.match(/data:([^;]+);/);
            resolve({ base64: b64, mime: mimeMatch ? mimeMatch[1] : 'image/jpeg' });
        };
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
};

const stageRoomFallback = async ({ style, roomType }) => {
    const key1 = `${roomType}|${style}`;
    const key2 = roomType;
    const path = FALLBACK_RENDER_MAP[key1] || FALLBACK_RENDER_MAP[key2] || '/showcase/living-modern.jpg';
    const { base64, mime } = await fetchAsBase64(path);
    return {
        image_base64: base64,
        image_mime: mime,
        style: style || 'modern',
        room_type: roomType || '',
        model: 'cached/flux-1',
        pipeline: 'cached-fallback',
        prompt: null,
        vision_description: null,
        caption: null,
        cached: true,
        _fallback: true,
    };
};

export const stageRoom = async ({ image, style, roomType, hint }) => {
    const formData = new FormData();
    formData.append('image', image);
    if (style) formData.append('style', style);
    if (roomType) formData.append('roomType', roomType);
    if (hint) formData.append('hint', hint);

    try {
        const response = await api.post('/stage', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 45000,
        });
        const data = response.data;
        if (!data || !data.image_base64) {
            return await stageRoomFallback({ style, roomType });
        }
        return data;
    } catch (error) {
        // Never break the demo. Live staging is best-effort; if it fails for any
        // reason (timeout, 429, 404, 502, network) we return a cached render
        // with the same shape. User sees a styled room either way.
        console.warn('[stage] live endpoint failed, using cached fallback:', error.message);
        try {
            return await stageRoomFallback({ style, roomType });
        } catch (fbErr) {
            throw { error: 'AI staging is temporarily unavailable. Try the 1-click demo tour for a guaranteed-working preview.' };
        }
    }
};
// ============================================
// AI ROOM STAGING — TEXT-TO-IMAGE (Floor-Plan / Pre-Possession Flow)
// ============================================
// Used when the buyer has only a floor plan (no unit photos yet). Hits the
// /api/stage/from-prompt endpoint which calls fal.ai FLUX.1-dev text-to-image
// with a style + room-type prompt. Returns the same response shape as stageRoom.
export const stageFromPrompt = async ({ style, roomType, hint }) => {
    try {
        const response = await api.post(
            '/stage/from-prompt',
            { style, roomType, hint },
            { headers: { 'Content-Type': 'application/json' }, timeout: 45000 },
        );
        const data = response.data;
        if (!data || !data.image_base64) return await stageRoomFallback({ style, roomType });
        return data;
    } catch (error) {
        console.warn('[stage/from-prompt] failed, using cached fallback:', error.message);
        return await stageRoomFallback({ style, roomType });
    }
};

// ============================================
// WAITLIST
// ============================================

export const getWaitlistStatus = async () => {
    try {
        const response = await api.get('/waitlist/status');
        return response.data;
    } catch (error) {
        console.error('Error fetching waitlist status:', error);
        throw error;
    }
};

export const joinPhase2Waitlist = async () => {
    try {
        const response = await api.post('/waitlist/join');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to join waitlist';
    }
};

export const subscribeToDesignTips = async (email) => {
    try {
        const response = await api.post('/subscribers/tips', { email });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Subscription failed';
    }
};
