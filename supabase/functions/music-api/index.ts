import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Only instances known to have working API endpoints
// Official instances have api:false, so we use community ones
const INVIDIOUS_INSTANCES = [
  "https://invidious.darkness.services",
  "https://yewtu.be",
  "https://vid.puffyan.us",
  "https://invidious.snopyta.org",
  "https://invidious.kavin.rocks",
];

// Piped instances as secondary fallback
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi-libre.kavin.rocks",
];

async function tryFetch(url: string, timeoutMs = 6000): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: controller.signal,
    });
    if (res.ok) return res;
    await res.text(); // consume body
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Try Invidious first, then Piped
async function fetchFromAnySource(
  invPath: string,
  pipedPath?: string
): Promise<any> {
  // Try Invidious instances
  for (const instance of INVIDIOUS_INSTANCES) {
    const res = await tryFetch(`${instance}/api/v1${invPath}`);
    if (res) {
      const data = await res.json();
      return { source: "invidious", data };
    }
  }

  // Try Piped instances as fallback
  if (pipedPath) {
    for (const instance of PIPED_INSTANCES) {
      const res = await tryFetch(`${instance}${pipedPath}`);
      if (res) {
        const data = await res.json();
        return { source: "piped", data };
      }
    }
  }

  return null;
}

function fixThumb(url: string, videoId?: string): string {
  if (!url) return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "/placeholder.svg";
  if (url.startsWith("http")) return url;
  return `https://i.ytimg.com${url}`;
}

function mapInvVideo(item: any) {
  return {
    id: item.videoId || "",
    title: item.title || "Unknown",
    artist: (item.author || "Unknown").replace(" - Topic", ""),
    artistId: item.authorId || "",
    album: "", albumId: "",
    cover: fixThumb(
      item.videoThumbnails?.find((t: any) => t.quality === "medium")?.url ||
      item.videoThumbnails?.[0]?.url || "",
      item.videoId
    ),
    preview: "",
    duration: item.lengthSeconds || 0,
    plays: item.viewCount || 0,
  };
}

function extractPipedId(url: string): string {
  return url?.match(/[?&]v=([^&]+)/)?.[1] || url?.replace("/watch?v=", "") || "";
}

function mapPipedVideo(item: any) {
  const id = extractPipedId(item.url || "");
  return {
    id,
    title: item.title || "Unknown",
    artist: (item.uploaderName || "Unknown").replace(" - Topic", ""),
    artistId: item.uploaderUrl?.replace("/channel/", "") || "",
    album: "", albumId: "",
    cover: item.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    preview: "",
    duration: item.duration || 0,
    plays: item.views || 0,
  };
}

function mapResult(source: string, item: any) {
  return source === "invidious" ? mapInvVideo(item) : mapPipedVideo(item);
}

const SEARCH_QUERIES: Record<string, string> = {
  global: "top hits 2025 trending music",
  viet: "nhạc việt nam hot trending 2025",
  chinese: "华语流行 热门歌曲 2025",
};

async function getTrending(region = "global") {
  const query = SEARCH_QUERIES[region] || SEARCH_QUERIES.global;

  const result = await fetchFromAnySource(
    `/search?q=${encodeURIComponent(query)}&type=video&sort=views&date=month`,
    `/search?q=${encodeURIComponent(query)}&filter=music_songs`
  );

  if (!result) return [];

  const items = result.source === "invidious"
    ? (result.data || []).filter((v: any) => v.type === "video" && v.lengthSeconds > 0 && v.lengthSeconds < 600)
    : (result.data.items || []).filter((v: any) => v.url && v.duration > 0 && v.duration < 600);

  return items.slice(0, 30).map((item: any) => mapResult(result.source, item));
}

async function searchSongs(query: string) {
  const result = await fetchFromAnySource(
    `/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`,
    `/search?q=${encodeURIComponent(query)}&filter=music_songs`
  );
  if (!result) return [];

  const items = result.source === "invidious"
    ? (result.data || []).filter((v: any) => v.type === "video" && v.lengthSeconds > 0)
    : (result.data.items || []).filter((v: any) => v.url && v.duration > 0);

  return items.slice(0, 30).map((item: any) => mapResult(result.source, item));
}

async function searchArtists(query: string) {
  const result = await fetchFromAnySource(
    `/search?q=${encodeURIComponent(query)}&type=channel`,
    `/search?q=${encodeURIComponent(query)}&filter=channels`
  );
  if (!result) return [];

  if (result.source === "invidious") {
    return (result.data || [])
      .filter((v: any) => v.type === "channel")
      .slice(0, 20)
      .map((item: any) => ({
        id: item.authorId || "",
        name: item.author || "Unknown",
        image: fixThumb(item.authorThumbnails?.find((t: any) => t.width >= 100)?.url || ""),
        bio: item.description || "",
        followers: item.subCount || 0,
        topSongs: [], albums: [],
      }));
  } else {
    return (result.data.items || [])
      .slice(0, 20)
      .map((item: any) => ({
        id: item.url?.replace("/channel/", "") || "",
        name: item.name || "Unknown",
        image: item.thumbnail || "/placeholder.svg",
        bio: item.description || "",
        followers: item.subscribers || 0,
        topSongs: [], albums: [],
      }));
  }
}

async function getSongDetails(videoId: string) {
  const result = await fetchFromAnySource(
    `/videos/${videoId}`,
    `/streams/${videoId}`
  );
  if (!result) return null;

  if (result.source === "invidious") {
    const d = result.data;
    const audio = (d.adaptiveFormats || [])
      .filter((f: any) => f.type?.startsWith("audio/"))
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    return {
      id: videoId,
      title: d.title || "Unknown",
      artist: (d.author || "Unknown").replace(" - Topic", ""),
      artistId: d.authorId || "",
      album: "", albumId: "",
      cover: fixThumb(d.videoThumbnails?.find((t: any) => t.quality === "medium")?.url || "", videoId),
      preview: "", duration: d.lengthSeconds || 0,
      plays: d.viewCount || 0,
      streamUrl: audio?.url || "",
    };
  } else {
    const d = result.data;
    const audio = d.audioStreams?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))?.[0];
    return {
      id: videoId,
      title: d.title || "Unknown",
      artist: (d.uploader || "Unknown").replace(" - Topic", ""),
      artistId: d.uploaderUrl?.replace("/channel/", "") || "",
      album: "", albumId: "",
      cover: d.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      preview: "", duration: d.duration || 0,
      plays: d.views || 0,
      streamUrl: audio?.url || "",
    };
  }
}

async function getArtistDetails(channelId: string) {
  const result = await fetchFromAnySource(
    `/channels/${channelId}`,
    `/channel/${channelId}`
  );
  if (!result) return null;

  if (result.source === "invidious") {
    const d = result.data;
    const videos = (d.latestVideos || [])
      .filter((v: any) => v.lengthSeconds > 0 && v.lengthSeconds < 600)
      .slice(0, 15).map(mapInvVideo);
    return {
      id: channelId,
      name: (d.author || "Unknown").replace(" - Topic", ""),
      image: fixThumb(d.authorThumbnails?.find((t: any) => t.width >= 100)?.url || ""),
      bio: d.description || "", followers: d.subCount || 0,
      topSongs: videos, albums: [],
    };
  } else {
    const d = result.data;
    const videos = (d.relatedStreams || [])
      .filter((v: any) => v.duration > 0 && v.duration < 600)
      .slice(0, 15).map(mapPipedVideo);
    return {
      id: channelId,
      name: (d.name || "Unknown").replace(" - Topic", ""),
      image: d.avatarUrl || "/placeholder.svg",
      bio: d.description || "", followers: d.subscriberCount || 0,
      topSongs: videos, albums: [],
    };
  }
}

async function getPlaylistDetails(playlistId: string) {
  const result = await fetchFromAnySource(
    `/playlists/${playlistId}`,
    `/playlists/${playlistId}`
  );
  if (!result) return null;

  if (result.source === "invidious") {
    const d = result.data;
    const songs = (d.videos || []).filter((v: any) => v.lengthSeconds > 0).map(mapInvVideo);
    return {
      id: playlistId, name: d.title || "Playlist",
      description: d.description || "",
      cover: songs[0]?.cover || "/placeholder.svg",
      songs, createdAt: "", isPublic: true,
    };
  } else {
    const d = result.data;
    const songs = (d.relatedStreams || []).filter((v: any) => v.duration > 0).map(mapPipedVideo);
    return {
      id: playlistId, name: d.name || "Playlist",
      description: "",
      cover: d.thumbnailUrl || songs[0]?.cover || "/placeholder.svg",
      songs, createdAt: "", isPublic: true,
    };
  }
}

async function getTrendingArtists() {
  return searchArtists("popular music artists 2025");
}

async function getTrendingPlaylists() {
  const result = await fetchFromAnySource(
    `/search?q=${encodeURIComponent("top hits 2025 playlist")}&type=playlist`,
    `/search?q=${encodeURIComponent("top hits 2025 playlist")}&filter=playlists`
  );
  if (!result) return [];

  if (result.source === "invidious") {
    return (result.data || [])
      .filter((item: any) => item.type === "playlist")
      .slice(0, 20)
      .map((item: any) => ({
        id: item.playlistId || "",
        name: item.title || "Playlist", description: "",
        cover: fixThumb(item.playlistThumbnail || item.videos?.[0]?.videoThumbnails?.[0]?.url || ""),
        songs: [], createdAt: "", isPublic: true,
      }));
  } else {
    return (result.data.items || [])
      .slice(0, 20)
      .map((item: any) => ({
        id: item.url?.replace("/playlist?list=", "") || "",
        name: item.name || "Playlist", description: "",
        cover: item.thumbnail || "/placeholder.svg",
        songs: [], createdAt: "", isPublic: true,
      }));
  }
}

// Safe wrapper
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch (e) { console.error("safe fallback:", e); return fallback; }
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
      result = await safe(() => getTrending(region), []);
    } else if (path === "/trending-artists") {
      result = await safe(() => getTrendingArtists(), []);
    } else if (path === "/trending-playlists") {
      result = await safe(() => getTrendingPlaylists(), []);
    } else if (path === "/search") {
      const q = url.searchParams.get("q") || "";
      const type = url.searchParams.get("type") || "songs";
      if (!q.trim()) { result = []; }
      else if (type === "artists") { result = await safe(() => searchArtists(q), []); }
      else { result = await safe(() => searchSongs(q), []); }
    } else if (path.startsWith("/song/")) {
      result = await safe(() => getSongDetails(path.replace("/song/", "")), null);
    } else if (path.startsWith("/artist/")) {
      result = await safe(() => getArtistDetails(path.replace("/artist/", "")), null);
    } else if (path.startsWith("/playlist/")) {
      result = await safe(() => getPlaylistDetails(path.replace("/playlist/", "")), null);
    } else {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Music API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
