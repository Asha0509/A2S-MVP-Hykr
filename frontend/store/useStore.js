import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // --- Auth Slice ---
      user: null,
      token: localStorage.getItem('token') || null, // Initial sync from legacy
      isAuthenticated: !!localStorage.getItem('token'),
      
      login: (user, token) => {
        set({ 
          user, 
          token, 
          isAuthenticated: !!token,
          consultantCredits: user.consultantCredits ?? 5,
          vastuCredits: user.vastuCredits ?? 3,
          styleDNA: user.styleDNA || null,
          savedDesigns: user.savedDesigns || [],
          savedProducts: user.watchlist || []
        });
        if (token) localStorage.setItem('token', token);
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, consultantCredits: 0, vastuCredits: 0, styleDNA: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      // --- Profile Slice ---
      consultantCredits: 5,
      vastuCredits: 3,
      styleDNA: null,
      savedDesigns: [],
      savedProducts: [],
      atmosphere: 'parchment',
      
      setProfile: (profileData) => {
        set((state) => ({
          ...state,
          consultantCredits: profileData.consultantCredits ?? state.consultantCredits,
          vastuCredits: profileData.vastuCredits ?? state.vastuCredits,
          styleDNA: profileData.styleDNA ?? state.styleDNA,
          savedDesigns: profileData.savedDesigns ?? state.savedDesigns,
          savedProducts: profileData.watchlist ?? profileData.savedProducts ?? state.savedProducts,
          user: { ...state.user, ...profileData }
        }));
      },

      toggleSavedDesign: (designId) => {
        set((state) => {
          const next = state.savedDesigns.includes(designId)
            ? state.savedDesigns.filter((id) => id !== designId)
            : [...state.savedDesigns, designId];
          return { savedDesigns: next };
        });
      },

      toggleSavedProduct: (productId) => {
        set((state) => {
          const next = state.savedProducts.includes(productId)
            ? state.savedProducts.filter((id) => id !== productId)
            : [...state.savedProducts, productId];
          return { savedProducts: next };
        });
      },

      updateCredits: (type, remaining) => {
        if (type === 'consultant') set({ consultantCredits: remaining });
        if (type === 'vastu') set({ vastuCredits: remaining });
      },

      // --- Waitlist Slice ---
      isJoinedWaitlist: false,
      waitlistRank: null,
      
      setWaitlist: (joined, rank) => {
        set({ isJoinedWaitlist: joined, waitlistRank: rank });
      },

      setAtmosphere: (atmosphere) => {
        // Only parchment is allowed
        set({ atmosphere: 'parchment' });
        document.documentElement.setAttribute('data-atmosphere', 'parchment');
      },

      // --- Sync Logic ---
      hydrate: () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (token && user) {
          set({ token, user, isAuthenticated: true });
        }
      }
    }),
    {
      name: 'a2s-global-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Cross-tab synchronization
window.addEventListener('storage', (event) => {
  if (event.key === 'a2s-global-store') {
    useStore.persist.rehydrate();
  }
});
