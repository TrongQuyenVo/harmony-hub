import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchState {
  history: string[];
  addToHistory: (query: string) => void;
  removeFromHistory: (query: string) => void;
  clearHistory: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      history: [],
      addToHistory: (query) =>
        set((state) => ({
          history: [query, ...state.history.filter((h) => h !== query)].slice(0, 20),
        })),
      removeFromHistory: (query) =>
        set((state) => ({
          history: state.history.filter((h) => h !== query),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    { name: "search-history" }
  )
);
