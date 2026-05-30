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
// AI ROOM STAGING (Gemini 2.5 Flash Image)
// ============================================
export const stageRoom = async ({ image, style, roomType, hint }) => {
    const formData = new FormData();
    formData.append('image', image);
    if (style) formData.append('style', style);
    if (roomType) formData.append('roomType', roomType);
    if (hint) formData.append('hint', hint);

    try {
        const response = await api.post('/stage', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 180000,
        });
        return response.data;
    } catch (error) {
        const status = error.response?.status;
        const payload = error.response?.data || {};
        if (status === 429) {
            const wait = payload.retry_after ? `${payload.retry_after}s` : 'about a minute';
            throw {
                error: payload.error || `Gemini's free tier is rate-limited right now. Try again in ${wait}, or enable billing on Google AI Studio to remove the per-minute cap.`,
                retry_after: payload.retry_after,
                rateLimited: true,
            };
        }
        throw payload.error ? payload : { error: 'AI room staging failed. Please try again.' };
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
