import { create } from "zustand";
import { Song } from "@/types/music";

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  showLyrics: boolean;

  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLyrics: () => void;
  addToQueue: (song: Song) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  volume: 0.7,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: "off",
  showLyrics: false,

  playSong: (song, queue) => {
    const newQueue = queue || get().queue;
    const index = newQueue.findIndex((s) => s.id === song.id);
    set({
      currentSong: song,
      queue: queue || get().queue.length === 0 ? (queue || [song]) : get().queue,
      queueIndex: index >= 0 ? index : 0,
      isPlaying: true,
      progress: 0,
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),

  nextSong: () => {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (queue.length === 0) return;

    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (queueIndex < queue.length - 1) {
      nextIndex = queueIndex + 1;
    } else if (repeat === "all") {
      nextIndex = 0;
    } else {
      return;
    }

    set({
      currentSong: queue[nextIndex],
      queueIndex: nextIndex,
      isPlaying: true,
      progress: 0,
    });
  },

  prevSong: () => {
    const { queue, queueIndex, progress } = get();
    if (queue.length === 0) return;

    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    set({
      currentSong: queue[prevIndex],
      queueIndex: prevIndex,
      isPlaying: true,
      progress: 0,
    });
  },

  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  toggleRepeat: () =>
    set((state) => ({
      repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off",
    })),
  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
  addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
}));
