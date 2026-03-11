import { create } from "zustand";

interface VisibleItemsState {
  visibleIds: number[];
  setVisibleIds: (ids: number[]) => void;
}

export const useVisibleItemsStore = create<VisibleItemsState>()((set) => ({
  visibleIds: [],
  setVisibleIds: (ids) => set({ visibleIds: ids }),
}));

