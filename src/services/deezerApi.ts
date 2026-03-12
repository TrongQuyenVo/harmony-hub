import { Song, Artist } from "@/types/music";
import { mockSongs, mockArtists } from "@/data/mockData";

const DEEZER_BASE = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: { id: number; name: string; picture_xl?: string };
  album: { id: number; title: string; cover_xl?: string; cover_big?: string };
  rank: number;
}

function mapDeezerTrack(track: DeezerTrack): Song {
  return {
    id: `dz-${track.id}`,
    title: track.title,
    artist: track.artist.name,
    artistId: `dz-a-${track.artist.id}`,
    album: track.album.title,
    albumId: `dz-al-${track.album.id}`,
    cover: track.album.cover_xl || track.album.cover_big || "/placeholder.svg",
    preview: track.preview,
    duration: track.duration,
    plays: track.rank,
  };
}

// Try multiple CORS proxies, fallback to mock data
async function fetchWithProxy(url: string): Promise<Response | null> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return res;
    } catch {
      continue;
    }
  }

  // Try direct (some Deezer endpoints allow CORS)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return res;
  } catch {
    // ignore
  }

  return null;
}

export async function fetchTrendingSongs(): Promise<Song[]> {
  try {
    const res = await fetchWithProxy(`${DEEZER_BASE}/chart/0/tracks?limit=20`);
    if (res) {
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const songs = data.data
          .filter((t: DeezerTrack) => t.preview)
          .map(mapDeezerTrack);
        if (songs.length > 0) return songs;
      }
    }
  } catch {
    // fallback
  }
  return mockSongs;
}

export async function searchDeezer(query: string): Promise<Song[]> {
  try {
    const res = await fetchWithProxy(`${DEEZER_BASE}/search?q=${encodeURIComponent(query)}&limit=20`);
    if (res) {
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const songs = data.data
          .filter((t: DeezerTrack) => t.preview)
          .map(mapDeezerTrack);
        if (songs.length > 0) return songs;
      }
    }
  } catch {
    // fallback
  }
  return mockSongs.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.artist.toLowerCase().includes(query.toLowerCase())
  );
}

export async function fetchArtistDetails(artistId: string): Promise<Artist | null> {
  const mockArtist = mockArtists.find(a => a.id === artistId);
  if (mockArtist) return mockArtist;

  if (artistId.startsWith("dz-a-")) {
    const dzId = artistId.replace("dz-a-", "");
    try {
      const res = await fetchWithProxy(`${DEEZER_BASE}/artist/${dzId}`);
      if (!res) return null;
      const data = await res.json();

      const topRes = await fetchWithProxy(`${DEEZER_BASE}/artist/${dzId}/top?limit=10`);
      const topSongs = topRes
        ? (await topRes.json()).data?.filter((t: DeezerTrack) => t.preview).map(mapDeezerTrack) || []
        : [];

      return {
        id: artistId,
        name: data.name,
        image: data.picture_xl || data.picture_big || "/placeholder.svg",
        bio: `${data.name} has ${data.nb_fan?.toLocaleString()} fans on Deezer.`,
        followers: data.nb_fan || 0,
        topSongs,
        albums: [],
      };
    } catch {
      return null;
    }
  }
  return null;
}
