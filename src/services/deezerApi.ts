import { Song, Artist, Playlist } from "@/types/music";

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
      delete (globalThis as any)[callbackName];
      script.remove();
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("JSONP timeout"));
    }, 8000);

    (globalThis as any)[callbackName] = (data: T) => {
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
      return data.data.filter(t => t.preview).map(mapDeezerTrack);
    }
  } catch (e) {
    console.warn("Failed to load trending songs", e);
  }
  return [];
}

export async function searchDeezer(query: string): Promise<Song[]> {
  try {
    const data = await fetchJsonp<{ data: DeezerTrack[] }>(
      `${DEEZER_BASE}/search?q=${encodeURIComponent(query)}&limit=20`
    );
    if (data.data && Array.isArray(data.data)) {
      return data.data.filter(t => t.preview).map(mapDeezerTrack);
    }
  } catch (e) {
    console.warn("Deezer search failed", e);
  }
  return [];
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



export async function fetchArtistDetails(artistId: string): Promise<Artist | null> {
  const dzId = artistId.replace("dz-a-", "");
  try {
    const data = await fetchJsonp<any>(`${DEEZER_BASE}/artist/${dzId}`);
    const topData = await fetchJsonp<{ data: DeezerTrack[] }>(
      `${DEEZER_BASE}/artist/${dzId}/top?limit=10`
    );

    return {
      id: artistId,
      name: data.name || "Unknown",
      image: data.picture_xl || data.picture_big || "/placeholder.svg",
      bio: data.nb_fan ? `${data.name} has ${data.nb_fan.toLocaleString()} fans worldwide.` : "",
      followers: data.nb_fan || 0,
      topSongs: topData.data?.filter((t: DeezerTrack) => t.preview).map(mapDeezerTrack) || [],
      albums: [],
    };
  } catch {
    return null;
  }
}


// helpers for artist/playlist mapping
function mapDeezerArtist(d: any): Artist {
  return {
    id: `dz-a-${d.id}`,
    name: d.name,
    image: d.picture_xl || d.picture_big || "/placeholder.svg",
    bio: "",
    followers: d.nb_fan || 0,
    topSongs: [],
    albums: [],
  };
}

function mapDeezerPlaylist(p: any): Playlist {
  return {
    id: `dz-p-${p.id}`,
    name: p.title,
    description: p.description || "",
    cover: p.picture_xl || p.picture_medium || "/placeholder.svg",
    songs: [],
    createdAt: "",
    isPublic: true,
  };
}

export async function fetchTrendingArtists(): Promise<Artist[]> {
  try {
    const data = await fetchJsonp<{ data: any[] }>(
      `${DEEZER_BASE}/chart/0/artists?limit=20`
    );
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(mapDeezerArtist);
    }
  } catch (e) {
    console.warn("Failed to load trending artists", e);
  }
  return [];
}

export async function fetchTrendingPlaylists(): Promise<Playlist[]> {
  try {
    const data = await fetchJsonp<{ data: any[] }>(
      `${DEEZER_BASE}/chart/0/playlists?limit=20`
    );
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(mapDeezerPlaylist);
    }
  } catch (e) {
    console.warn("Failed to load trending playlists", e);
  }
  return [];
}

export async function fetchVietnameseChart(): Promise<Song[]> {
  try {
    const data = await fetchJsonp<{ data: DeezerTrack[] }>(
      `${DEEZER_BASE}/search?q=${encodeURIComponent("nhạc việt nam hot")}&limit=20`
    );
    if (data.data && Array.isArray(data.data)) {
      return data.data.filter(t => t.preview).map(mapDeezerTrack);
    }
  } catch (e) {
    console.warn("Failed to load Vietnamese chart", e);
  }
  return [];
}

export async function fetchChineseChart(): Promise<Song[]> {
  try {
    const data = await fetchJsonp<{ data: DeezerTrack[] }>(
      `${DEEZER_BASE}/search?q=${encodeURIComponent("华语流行 热门")}&limit=20`
    );
    if (data.data && Array.isArray(data.data)) {
      return data.data.filter(t => t.preview).map(mapDeezerTrack);
    }
  } catch (e) {
    console.warn("Failed to load Chinese chart", e);
  }
  return [];
}

export async function searchArtists(query: string): Promise<Artist[]> {
  try {
    const data = await fetchJsonp<{ data: any[] }>(
      `${DEEZER_BASE}/search/artist?q=${encodeURIComponent(query)}&limit=20`
    );
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(mapDeezerArtist);
    }
  } catch (e) {
    console.warn("Artist search failed", e);
  }
  return [];
}

export async function fetchPlaylist(id: string): Promise<Playlist | null> {
  const dzId = id.replace("dz-p-", "");
  try {
    const data = await fetchJsonp<any>(`${DEEZER_BASE}/playlist/${dzId}`);
    const songs: Song[] = [];
    if (data.tracks && Array.isArray(data.tracks.data)) {
      data.tracks.data.forEach((t: DeezerTrack) => {
        if (t.preview) songs.push(mapDeezerTrack(t));
      });
    }
    return {
      id: `dz-p-${data.id}`,
      name: data.title,
      description: data.description || "",
      cover: data.picture_xl || data.picture_medium || "/placeholder.svg",
      songs,
      createdAt: data.creation_date || "",
      isPublic: true,
    };
  } catch (e) {
    console.warn("Failed to fetch playlist", e);
    return null;
  }
}
