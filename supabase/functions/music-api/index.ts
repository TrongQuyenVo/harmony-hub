import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Multiple Piped instances for fallback
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.in.projectsegfau.lt",
];

async function pipedFetch(path: string): Promise<any> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}${path}`, {
        headers: { "User-Agent": "MusicApp/1.0" },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      continue;
    }
  }
  throw new Error("All Piped instances failed");
}

function extractVideoId(url: string): string {
  // Piped returns /watch?v=VIDEO_ID
  const match = url?.match(/[?&]v=([^&]+)/);
  return match ? match[1] : url?.replace("/watch?v=", "") || "";
}

function mapPipedItem(item: any) {
  const videoId = extractVideoId(item.url || "");
  return {
    id: videoId,
    title: item.title || "Unknown",
    artist: item.uploaderName?.replace(" - Topic", "") || item.uploaderName || "Unknown",
    artistId: item.uploaderUrl?.replace("/channel/", "") || "",
    album: "",
    albumId: "",
    cover:
      item.thumbnail ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    preview: "", // playback via YouTube IFrame
    duration: item.duration || 0,
    plays: item.views || 0,
  };
}

// Curated trending playlists (YouTube Music official playlists)
const TRENDING_PLAYLISTS: Record<string, { query: string }> = {
  global: { query: "top hits 2025 popular music" },
  viet: { query: "nhạc việt nam hot trending 2025" },
  chinese: { query: "华语流行 热门歌曲 2025" },
};

async function getTrending(region = "global") {
  const config = TRENDING_PLAYLISTS[region] || TRENDING_PLAYLISTS.global;
  // Use search with music_songs filter for better results
  const data = await pipedFetch(
    `/search?q=${encodeURIComponent(config.query)}&filter=music_songs`
  );
  const items = data.items || [];
  return items
    .filter((item: any) => item.url && item.duration > 0 && item.duration < 600)
    .map(mapPipedItem);
}

async function searchSongs(query: string) {
  const data = await pipedFetch(
    `/search?q=${encodeURIComponent(query)}&filter=music_songs`
  );
  const items = data.items || [];
  return items
    .filter((item: any) => item.url && item.duration > 0)
    .map(mapPipedItem);
}

async function searchArtists(query: string) {
  const data = await pipedFetch(
    `/search?q=${encodeURIComponent(query)}&filter=music_artists`
  );
  const items = data.items || [];
  // Fallback: also try channels filter
  if (items.length === 0) {
    const data2 = await pipedFetch(
      `/search?q=${encodeURIComponent(query)}&filter=channels`
    );
    return (data2.items || []).map((item: any) => ({
      id: item.url?.replace("/channel/", "") || "",
      name: item.name || "Unknown",
      image: item.thumbnail || "/placeholder.svg",
      bio: item.description || "",
      followers: item.subscribers || 0,
      topSongs: [],
      albums: [],
    }));
  }
  return items.map((item: any) => ({
    id: item.url?.replace("/channel/", "") || "",
    name: item.name || "Unknown",
    image: item.thumbnail || "/placeholder.svg",
    bio: item.description || "",
    followers: item.subscribers || 0,
    topSongs: [],
    albums: [],
  }));
}

async function getSongDetails(videoId: string) {
  const data = await pipedFetch(`/streams/${videoId}`);
  return {
    id: videoId,
    title: data.title || "Unknown",
    artist: data.uploader?.replace(" - Topic", "") || data.uploader || "Unknown",
    artistId: data.uploaderUrl?.replace("/channel/", "") || "",
    album: "",
    albumId: "",
    cover: data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    preview: "",
    duration: data.duration || 0,
    plays: data.views || 0,
    // Include audio stream URL for direct playback
    streamUrl: data.audioStreams?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))?.[0]?.url || "",
  };
}

async function getArtistDetails(channelId: string) {
  const data = await pipedFetch(`/channel/${channelId}`);
  // Get top videos as songs
  const videos = (data.relatedStreams || [])
    .filter((v: any) => v.duration > 0 && v.duration < 600)
    .slice(0, 15)
    .map(mapPipedItem);

  return {
    id: channelId,
    name: data.name?.replace(" - Topic", "") || data.name || "Unknown",
    image: data.avatarUrl || "/placeholder.svg",
    bio: data.description || "",
    followers: data.subscriberCount || 0,
    topSongs: videos,
    albums: [],
  };
}

async function getPlaylistDetails(playlistId: string) {
  const data = await pipedFetch(`/playlists/${playlistId}`);
  const songs = (data.relatedStreams || [])
    .filter((v: any) => v.duration > 0)
    .map(mapPipedItem);

  return {
    id: playlistId,
    name: data.name || "Playlist",
    description: "",
    cover: data.thumbnailUrl || songs[0]?.cover || "/placeholder.svg",
    songs,
    createdAt: "",
    isPublic: true,
  };
}

async function getTrendingArtists() {
  // Search for popular artists
  const data = await pipedFetch(
    `/search?q=${encodeURIComponent("popular music artists 2025")}&filter=channels`
  );
  return (data.items || [])
    .filter((item: any) => item.name && item.subscribers > 0)
    .slice(0, 20)
    .map((item: any) => ({
      id: item.url?.replace("/channel/", "") || "",
      name: item.name || "Unknown",
      image: item.thumbnail || "/placeholder.svg",
      bio: "",
      followers: item.subscribers || 0,
      topSongs: [],
      albums: [],
    }));
}

async function getTrendingPlaylists() {
  const data = await pipedFetch(
    `/search?q=${encodeURIComponent("top hits 2025 playlist")}&filter=playlists`
  );
  return (data.items || []).slice(0, 20).map((item: any) => ({
    id: item.url?.replace("/playlist?list=", "") || "",
    name: item.name || "Playlist",
    description: "",
    cover: item.thumbnail || "/placeholder.svg",
    songs: [],
    createdAt: "",
    isPublic: true,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/music-api/, "");

    let result: any;

    if (path === "/trending" || path === "/trending/") {
      const region = url.searchParams.get("region") || "global";
      result = await getTrending(region);
    } else if (path === "/trending-artists") {
      result = await getTrendingArtists();
    } else if (path === "/trending-playlists") {
      result = await getTrendingPlaylists();
    } else if (path === "/search") {
      const q = url.searchParams.get("q") || "";
      const type = url.searchParams.get("type") || "songs";
      if (type === "artists") {
        result = await searchArtists(q);
      } else {
        result = await searchSongs(q);
      }
    } else if (path.startsWith("/song/")) {
      const id = path.replace("/song/", "");
      result = await getSongDetails(id);
    } else if (path.startsWith("/artist/")) {
      const id = path.replace("/artist/", "");
      result = await getArtistDetails(id);
    } else if (path.startsWith("/playlist/")) {
      const id = path.replace("/playlist/", "");
      result = await getPlaylistDetails(id);
    } else {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Music API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
