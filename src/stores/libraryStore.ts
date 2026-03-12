import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song, Playlist } from "@/types/music";

interface LibraryState {
  likedSongs: Song[];
  playlists: Playlist[];
  recentlyPlayed: Song[];

  toggleLike: (song: Song) => void;
  isLiked: (songId: string) => boolean;
  createPlaylist: (name: string, description?: string) => Playlist;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addToRecentlyPlayed: (song: Song) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedSongs: [],
      playlists: [],
      recentlyPlayed: [],

      toggleLike: (song) =>
        set((state) => {
          const isLiked = state.likedSongs.some((s) => s.id === song.id);
          return {
            likedSongs: isLiked
              ? state.likedSongs.filter((s) => s.id !== song.id)
              : [...state.likedSongs, song],
          };
        }),

      isLiked: (songId) => get().likedSongs.some((s) => s.id === songId),

      createPlaylist: (name, description = "") => {
        const playlist: Playlist = {
          id: `user-${Date.now()}`,
          name,
          description,
          cover: "",
          songs: [],
          createdAt: new Date().toISOString(),
          isPublic: false,
        };
        set((state) => ({ playlists: [...state.playlists, playlist] }));
        return playlist;
      },

      addToPlaylist: (playlistId, song) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId && !p.songs.some((s) => s.id === song.id)
              ? { ...p, songs: [...p.songs, song] }
              : p
          ),
        })),

      removeFromPlaylist: (playlistId, songId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
              : p
          ),
        })),

      deletePlaylist: (playlistId) =>
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        })),

      addToRecentlyPlayed: (song) =>
        set((state) => ({
          recentlyPlayed: [
            song,
            ...state.recentlyPlayed.filter((s) => s.id !== song.id),
          ].slice(0, 50),
        })),
    }),
    { name: "music-library" }
  )
);
