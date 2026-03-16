import { Song, Artist, Playlist } from "@/types/music";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function musicFetch<T>(path: string): Promise<T> {
  const url = `${SUPABASE_URL}/functions/v1/music-api${path}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${ANON_KEY}`,
      "apikey": ANON_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchTrendingSongs(): Promise<Song[]> {
  try {
    return await musicFetch<Song[]>("/trending?region=global");
  } catch (e) {
    console.warn("Failed to fetch trending songs:", e);
    return [];
  }
}

export async function fetchVietnameseChart(): Promise<Song[]> {
  try {
    return await musicFetch<Song[]>("/trending?region=viet");
  } catch (e) {
    console.warn("Failed to fetch Vietnamese chart:", e);
    return [];
  }
}

export async function fetchChineseChart(): Promise<Song[]> {
  try {
    return await musicFetch<Song[]>("/trending?region=chinese");
  } catch (e) {
    console.warn("Failed to fetch Chinese chart:", e);
    return [];
  }
}

export async function fetchTrendingArtists(): Promise<Artist[]> {
  try {
    return await musicFetch<Artist[]>("/trending-artists");
  } catch (e) {
    console.warn("Failed to fetch trending artists:", e);
    return [];
  }
}

export async function fetchTrendingPlaylists(): Promise<Playlist[]> {
  try {
    return await musicFetch<Playlist[]>("/trending-playlists");
  } catch (e) {
    console.warn("Failed to fetch trending playlists:", e);
    return [];
  }
}

export async function searchSongs(query: string): Promise<Song[]> {
  try {
    return await musicFetch<Song[]>(`/search?q=${encodeURIComponent(query)}&type=songs`);
  } catch (e) {
    console.warn("Search failed:", e);
    return [];
  }
}

export async function searchArtists(query: string): Promise<Artist[]> {
  try {
    return await musicFetch<Artist[]>(`/search?q=${encodeURIComponent(query)}&type=artists`);
  } catch (e) {
    console.warn("Artist search failed:", e);
    return [];
  }
}

export async function fetchSongDetails(id: string): Promise<Song | null> {
  try {
    return await musicFetch<Song>(`/song/${id}`);
  } catch (e) {
    console.warn("Failed to fetch song:", e);
    return null;
  }
}

export async function fetchArtistDetails(artistId: string): Promise<Artist | null> {
  try {
    return await musicFetch<Artist>(`/artist/${artistId}`);
  } catch (e) {
    console.warn("Failed to fetch artist:", e);
    return null;
  }
}

export async function fetchPlaylist(id: string): Promise<Playlist | null> {
  try {
    return await musicFetch<Playlist>(`/playlist/${id}`);
  } catch (e) {
    console.warn("Failed to fetch playlist:", e);
    return null;
  }
}
