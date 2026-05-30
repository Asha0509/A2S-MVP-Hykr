import { INITIAL_FILTER_STATE } from '../constants';

export const STORAGE_KEYS = {
    SAVED_DESIGNS: 'a2s_saved_designs',
    ONBOARDING_PREFERENCES: 'a2s_onboarding_preferences',
    SAVED_PRESETS: 'a2s_saved_presets',
    LATEST_PROJECT: 'a2s_latest_project',
};

export async function getUser() {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export async function setUser(user) {
    if (user && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('a2s-auth-change'));
    }
    return user;
}

export async function clearUser() {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('a2s-auth-change'));
        }
    } catch (e) {
        console.error('Failed to clear user', e);
    }
}

export async function isLoggedIn() {
    const user = await getUser();
    return user !== null && localStorage.getItem('token') !== null;
}

export function getSavedDesignIds() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SAVED_DESIGNS);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function toggleSavedDesign(designId) {
    const ids = getSavedDesignIds();
    const next = ids.includes(designId)
        ? ids.filter((id) => id !== designId)
        : [...ids, designId];
    try {
        localStorage.setItem(STORAGE_KEYS.SAVED_DESIGNS, JSON.stringify(next));
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('a2s-saved-update'));
        return next.includes(designId);
    } catch {
        return false;
    }
}

export function isDesignSaved(designId) {
    return getSavedDesignIds().includes(designId);
}

export function getOnboardingPreferences() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ONBOARDING_PREFERENCES);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        
        // Support new Style DNA schema
        if (parsed && parsed.styleDNA) {
            return parsed;
        }

        // Fallback for old schema
        if (parsed && (typeof parsed.room === 'string' || Array.isArray(parsed.styles))) {
            return {
                room: parsed.room || '',
                budget: parsed.budget || '',
                styles: parsed.styles || [],
                styleDNA: parsed.styles?.[0] || 'Modern' // Guessing DNA if old data exists
            };
        }
        return null;
    } catch {
        return null;
    }
}

export function setOnboardingPreferences(prefs) {
    try {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_PREFERENCES, JSON.stringify(prefs));
    } catch (e) {
        console.error('Failed to save onboarding preferences', e);
    }
}

const BUDGET_TO_MAX = {
    low: 50_000,
    mid: 150_000,
    high: 500_000,
    ultra: 200_000, // max filter cap
};

export function getInitialFiltersFromOnboarding() {
    const prefs = getOnboardingPreferences();
    if (!prefs) return { ...INITIAL_FILTER_STATE };

    const maxPrice = prefs.budget ? BUDGET_TO_MAX[prefs.budget] ?? INITIAL_FILTER_STATE.maxPrice : INITIAL_FILTER_STATE.maxPrice;
    const roomTypes = prefs.room ? [prefs.room] : [];
    const styles = prefs.styles?.length ? prefs.styles : [];

    return {
        minPrice: INITIAL_FILTER_STATE.minPrice,
        maxPrice,
        styles,
        roomTypes,
        productRoomTypes: [],
    };
}
