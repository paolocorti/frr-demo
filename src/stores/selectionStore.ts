import { create } from "zustand";

interface SelectionState {
  selectedIndices: number[];
  primaryIndex: number | null;

  setCurationSelection: (indices: number[]) => void;
  setPrimaryIndex: (index: number | null) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedIndices: [],
  primaryIndex: null,

  setCurationSelection: (indices) =>
    set({
      selectedIndices: indices,
      primaryIndex: indices.length > 0 ? indices[0] : null,
    }),

  setPrimaryIndex: (index) =>
    set({
      primaryIndex: index,
    }),

  clearSelection: () =>
    set({
      selectedIndices: [],
      primaryIndex: null,
    }),
}));

