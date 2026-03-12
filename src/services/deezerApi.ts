import { Song, Artist } from "@/types/music";
import { mockSongs, mockArtists, DEEZER_TRACK_IDS } from "@/data/mockData";

const DEEZER_BASE = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: { id: number; name: string; picture_xl?: string; picture_big?: string };
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
    preview: track.preview || "",
    duration: track.duration,
    plays: track.rank,
  };
}

// Use JSONP to bypass CORS - Deezer supports ?output=jsonp&callback=
let jsonpCounter = 0;

function fetchJsonp<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = `__deezer_cb_${++jsonpCounter}_${Date.now()}`;
    const script = document.createElement("script");
    
    const cleanup = () => {
      delete (window as any)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("JSONP timeout"));
    }, 8000);

    (window as any)[callbackName] = (data: T) => {
      clearTimeout(timeout);
      cleanup();
      resolve(data);
    };

    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}output=jsonp&callback=${callbackName}`;
    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("JSONP error"));
    };
    document.head.appendChild(script);
  });
}

export async function fetchTrendingSongs(): Promise<Song[]> {
  try {
    const data = await fetchJsonp<{ data: DeezerTrack[] }>(
      `${DEEZER_BASE}/chart/0/tracks?limit=20`
    );
    if (data.data && Array.isArray(data.data)) {
      const songs = data.data.filter(t => t.preview).map(mapDeezerTrack);
      if (songs.length > 0) return songs;
    }
  } catch (e) {
    console.log("Deezer chart fetch failed, using mock data", e);
  }
  // Fallback: try to fetch individual tracks to get preview URLs
  return fetchTrackPreviews(mockSongs);
}

export async function searchDeezer(query: string): Promise<Song[]> {
  try {
    const data = await fetchJsonp<{ data: DeezerTrack[] }>(
      `${DEEZER_BASE}/search?q=${encodeURIComponent(query)}&limit=20`
    );
    if (data.data && Array.isArray(data.data)) {
      const songs = data.data.filter(t => t.preview).map(mapDeezerTrack);
      if (songs.length > 0) return songs;
    }
  } catch (e) {
    console.log("Deezer search failed, using mock filter", e);
  }
  const q = query.toLowerCase();
  return mockSongs.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q)
  );
}

// Fetch a single track to get its fresh preview URL
export async function fetchTrackPreview(trackId: string): Promise<string> {
  const numericId = trackId.replace("dz-", "");
  try {
    const data = await fetchJsonp<DeezerTrack>(
      `${DEEZER_BASE}/track/${numericId}`
    );
    if (data.preview) return data.preview;
  } catch {
    // ignore
  }
  return "";
}

// Batch fetch preview URLs for mock songs
async function fetchTrackPreviews(songs: Song[]): Promise<Song[]> {
  const results = await Promise.allSettled(
    songs.map(async (song) => {
      const numericId = song.id.replace("dz-", "");
      try {
        const data = await fetchJsonp<DeezerTrack>(
          `${DEEZER_BASE}/track/${numericId}`
        );
        return { ...song, preview: data.preview || "" };
      } catch {
        return song;
      }
    })
  );

  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : songs[i]
  );
}

export async function fetchArtistDetails(artistId: string): Promise<Artist | null> {
  const mockArtist = mockArtists.find(a => a.id === artistId);

  const dzId = artistId.replace("dz-a-", "");
  
  try {
    const data = await fetchJsonp<any>(`${DEEZER_BASE}/artist/${dzId}`);
    const topData = await fetchJsonp<{ data: DeezerTrack[] }>(
      `${DEEZER_BASE}/artist/${dzId}/top?limit=10`
    );

    return {
      id: artistId,
      name: data.name || mockArtist?.name || "Unknown",
      image: data.picture_xl || data.picture_big || mockArtist?.image || "/placeholder.svg",
      bio: data.nb_fan
        ? `${data.name} has ${data.nb_fan.toLocaleString()} fans worldwide.`
        : mockArtist?.bio || "",
      followers: data.nb_fan || mockArtist?.followers || 0,
      topSongs: topData.data?.filter((t: DeezerTrack) => t.preview).map(mapDeezerTrack) || mockArtist?.topSongs || [],
      albums: [],
    };
  } catch {
    if (mockArtist) return mockArtist;
    return null;
  }
}
