import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extended list of Piped API instances
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi-libre.kavin.rocks",
  "https://api-piped.mha.fi",
  "https://pipedapi.in.projectsegfau.lt",
  "https://pipedapi.r4fo.com",
  "https://pipedapi.leptons.xyz",
];

let cachedInstances: string[] | null = null;
let cacheTime = 0;

async function getWorkingInstances(): Promise<string[]> {
  // Cache for 10 minutes
  if (cachedInstances && Date.now() - cacheTime < 600000) {
    return cachedInstances;
  }

  // Try to fetch dynamic instance list
  try {
    const res = await fetch("https://piped-instances.kavin.rocks/", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const instances = await res.json();
      const apiUrls = instances
        .filter((i: any) => i.api_url && i.up_to_date)
        .map((i: any) => i.api_url.replace(/\/$/, ""));
      if (apiUrls.length > 0) {
        cachedInstances = apiUrls;
        cacheTime = Date.now();
        return apiUrls;
      }
    }
  } catch {
    // Fall through to static list
  }

  return PIPED_INSTANCES;
}

async function pipedFetch(path: string): Promise<any> {
  const instances = await getWorkingInstances();

  for (const instance of instances) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${instance}${path}`, {
        headers: { "User-Agent": "MusicApp/1.0" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return data;
      }
      // Consume body to prevent leak
      await res.text();
    } catch {
      continue;
    }
  }
  throw new Error("All Piped instances failed");
}

function extractVideoId(url: string): string {
  const match = url?.match(/[?&]v=([^&]+)/);
  return match ? match[1] : url?.replace("/watch?v=", "") || "";
}

function mapPipedItem(item: any) {
  const videoId = extractVideoId(item.url || "");
  return {
    id: videoId,
    title: item.title || "Unknown",
    artist:
      item.uploaderName?.replace(" - Topic", "") ||
      item.uploaderName ||
      "Unknown",
    artistId: item.uploaderUrl?.replace("/channel/", "") || "",
    album: "",
    albumId: "",
    cover:
      item.thumbnail ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    preview: "",
    duration: item.duration || 0,
    plays: item.views || 0,
  };
}

const TRENDING_PLAYLISTS: Record<string, { query: string }> = {
  global: { query: "top hits 2025 popular music" },
  viet: { query: "nhạc việt nam hot trending 2025" },
  chinese: { query: "华语流行 热门歌曲 2025" },
};

async function getTrending(region = "global") {
  const config = TRENDING_PLAYLISTS[region] || TRENDING_PLAYLISTS.global;

  // Try the /trending endpoint first for global
  if (region === "global") {
    try {
      const data = await pipedFetch("/trending?region=US");
      const items = data || [];
      const mapped = items
        .filter(
          (item: any) => item.url && item.duration > 0 && item.duration < 600
        )
        .map(mapPipedItem);
      if (mapped.length > 0) return mapped;
    } catch {
      // Fall through to search
    }
  }

  const data = await pipedFetch(
    `/search?q=${encodeURIComponent(config.query)}&filter=music_songs`
  );
  const items = data.items || [];
  return items
    .filter(
      (item: any) => item.url && item.duration > 0 && item.duration < 600
    )
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
    `/search?q=${encodeURIComponent(query)}&filter=channels`
  );
  return (data.items || []).map((item: any) => ({
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
    artist:
      data.uploader?.replace(" - Topic", "") || data.uploader || "Unknown",
    artistId: data.uploaderUrl?.replace("/channel/", "") || "",
    album: "",
    albumId: "",
    cover:
      data.thumbnailUrl ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    preview: "",
    duration: data.duration || 0,
    plays: data.views || 0,
    streamUrl:
      data.audioStreams
        ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
        ?.[0]?.url || "",
  };
}

async function getArtistDetails(channelId: string) {
  const data = await pipedFetch(`/channel/${channelId}`);
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
  const data = await pipedFetch(
    `/search?q=${encodeURIComponent(
      "popular music artists 2025"
    )}&filter=channels`
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
    `/search?q=${encodeURIComponent(
      "top hits 2025 playlist"
    )}&filter=playlists`
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
