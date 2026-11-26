import { create } from 'zustand';

interface AppUiState {
  isOffline: boolean;
  lastSyncedAt: string | null;
  pendingSyncCount: number;
  setOffline: (offline: boolean) => void;
  setLastSyncedAt: (timestamp: string | null) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useAppUiStore = create<AppUiState>((set) => ({
  isOffline: false,
  lastSyncedAt: null,
  pendingSyncCount: 0,
  setOffline: (isOffline) => set({ isOffline }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
}));
