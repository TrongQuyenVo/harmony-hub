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
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchTrendingSongs(): Promise<Song[]> {
  try { return await musicFetch<Song[]>("/trending?region=global"); }
  catch { return []; }
}

export async function fetchVietnameseChart(): Promise<Song[]> {
  try { return await musicFetch<Song[]>("/trending?region=viet"); }
  catch { return []; }
}

export async function fetchChineseChart(): Promise<Song[]> {
  try { return await musicFetch<Song[]>("/trending?region=chinese"); }
  catch { return []; }
}

export async function fetchTrendingArtists(): Promise<Artist[]> {
  try { return await musicFetch<Artist[]>("/trending-artists"); }
  catch { return []; }
}

export async function fetchTrendingPlaylists(): Promise<Playlist[]> {
  try { return await musicFetch<Playlist[]>("/trending-playlists"); }
  catch { return []; }
}

export async function searchSongs(query: string): Promise<Song[]> {
  try { return await musicFetch<Song[]>(`/search?q=${encodeURIComponent(query)}&type=songs`); }
  catch { return []; }
}

export async function searchArtists(query: string): Promise<Artist[]> {
  try { return await musicFetch<Artist[]>(`/search?q=${encodeURIComponent(query)}&type=artists`); }
  catch { return []; }
}

export async function fetchSongDetails(id: string): Promise<Song | null> {
  try { return await musicFetch<Song>(`/song/${id}`); }
  catch { return null; }
}

export async function fetchArtistDetails(artistId: string): Promise<Artist | null> {
  try { return await musicFetch<Artist>(`/artist/${artistId}`); }
  catch { return null; }
}

export async function fetchPlaylist(id: string): Promise<Playlist | null> {
  try { return await musicFetch<Playlist>(`/playlist/${id}`); }
  catch { return null; }
}

export interface LyricsResult {
  syncedLyrics: string;
  plainLyrics: string;
}

export async function fetchLyrics(title: string, artist: string): Promise<LyricsResult> {
  try {
    return await musicFetch<LyricsResult>(`/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
  } catch {
    return { syncedLyrics: "", plainLyrics: "" };
  }
}
