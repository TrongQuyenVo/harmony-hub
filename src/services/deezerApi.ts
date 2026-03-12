import { Song, Artist } from "@/types/music";
import { mockSongs, mockArtists } from "@/data/mockData";

const CORS_PROXY = "https://corsproxy.io/?";
const DEEZER_BASE = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: { id: number; name: string; picture_xl: string };
  album: { id: number; title: string; cover_xl: string };
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
    cover: track.album.cover_xl || track.album.cover_xl,
    preview: track.preview,
    duration: track.duration,
    plays: track.rank,
  };
}

export async function fetchTrendingSongs(): Promise<Song[]> {
  try {
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(`${DEEZER_BASE}/chart/0/tracks?limit=20`)}`);
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    if (data.data) {
      return data.data.map(mapDeezerTrack);
    }
    return mockSongs;
  } catch {
    return mockSongs;
  }
}

export async function searchDeezer(query: string): Promise<Song[]> {
  try {
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(`${DEEZER_BASE}/search?q=${encodeURIComponent(query)}&limit=20`)}`);
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    if (data.data) {
      return data.data.map(mapDeezerTrack);
    }
    return mockSongs.filter(s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase())
    );
  } catch {
    return mockSongs.filter(s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export async function fetchArtistDetails(artistId: string): Promise<Artist | null> {
  const mockArtist = mockArtists.find(a => a.id === artistId);
  if (mockArtist) return mockArtist;

  if (artistId.startsWith("dz-a-")) {
    const dzId = artistId.replace("dz-a-", "");
    try {
      const res = await fetch(`${CORS_PROXY}${encodeURIComponent(`${DEEZER_BASE}/artist/${dzId}`)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      const topRes = await fetch(`${CORS_PROXY}${encodeURIComponent(`${DEEZER_BASE}/artist/${dzId}/top?limit=10`)}`);
      const topData = await topRes.json();

      return {
        id: artistId,
        name: data.name,
        image: data.picture_xl,
        bio: `${data.name} has ${data.nb_fan?.toLocaleString()} fans on Deezer.`,
        followers: data.nb_fan || 0,
        topSongs: topData.data?.map(mapDeezerTrack) || [],
        albums: [],
      };
    } catch {
      return null;
    }
  }
  return null;
}
