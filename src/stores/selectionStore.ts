import { create } from "zustand";
import type { DataItem } from "../hooks/useDataItems";

interface SelectionState {
  selectedIndices: number[];
  primaryIndex: number | null;

  setCurationSelection: (ids: number[], items: DataItem[]) => void;
  setPrimaryIndex: (index: number | null) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedIndices: [],
  primaryIndex: null,

  setCurationSelection: (ids, items) => {
    const selectedIndices = items
      .map((item, index) => ({ id: item.id, index }))
      .filter((entry) => ids.includes(entry.id))
      .map((entry) => entry.index);

    set({
      selectedIndices,
      primaryIndex: selectedIndices.length > 0 ? selectedIndices[0] : null,
    });
  },

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

