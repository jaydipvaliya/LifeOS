import { create } from 'zustand';

interface AppUiState {
  isOffline: boolean;
  lastSyncedAt: string | null;
  setOffline: (offline: boolean) => void;
  setLastSyncedAt: (timestamp: string | null) => void;
}

export const useAppUiStore = create<AppUiState>((set) => ({
  isOffline: false,
  lastSyncedAt: null,
  setOffline: (isOffline) => set({ isOffline }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));
