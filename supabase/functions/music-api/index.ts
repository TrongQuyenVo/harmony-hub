import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Invidious instances (more server-friendly than Piped)
const INVIDIOUS_INSTANCES = [
  "https://invidious.darkness.services",
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://invidious.jing.rocks",
  "https://invidious.privacyredirect.com",
  "https://inv.tux.pizza",
  "https://invidious.protokoll-11.de",
  "https://iv.datura.network",
];

async function invFetch(path: string): Promise<any> {
  const errors: string[] = [];

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const url = `${instance}/api/v1${path}`;
      console.log(`Trying: ${url}`);

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        return await res.json();
      }
      const body = await res.text();
      errors.push(`${instance}: ${res.status} - ${body.substring(0, 100)}`);
    } catch (e) {
      errors.push(`${instance}: ${e.message || e}`);
      continue;
    }
  }
  console.error("All instances failed:", JSON.stringify(errors));
  throw new Error("All API instances failed");
}

function mapInvidiousVideo(item: any) {
  return {
    id: item.videoId || "",
    title: item.title || "Unknown",
    artist: item.author?.replace(" - Topic", "") || item.author || "Unknown",
    artistId: item.authorId || "",
    album: "",
    albumId: "",
    cover:
      item.videoThumbnails?.find((t: any) => t.quality === "medium")?.url ||
      item.videoThumbnails?.[0]?.url ||
      `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
    preview: "",
    duration: item.lengthSeconds || 0,
    plays: item.viewCount || 0,
  };
}

const TRENDING_QUERIES: Record<string, string> = {
  global: "top hits 2025 popular songs",
  viet: "nhạc việt nam hot trending 2025",
  chinese: "华语流行 热门歌曲 2025",
};

async function getTrending(region = "global") {
  // Try /trending endpoint first for global
  if (region === "global") {
    try {
      const data = await invFetch("/trending?type=music&region=US");
      if (Array.isArray(data) && data.length > 0) {
        return data
          .filter((v: any) => v.lengthSeconds > 0 && v.lengthSeconds < 600)
          .slice(0, 30)
          .map(mapInvidiousVideo);
      }
    } catch {
      // Fall through to search
    }
  }

  const query = TRENDING_QUERIES[region] || TRENDING_QUERIES.global;
  const data = await invFetch(
    `/search?q=${encodeURIComponent(query)}&type=video&sort=views&date=month`
  );
  return (data || [])
    .filter((v: any) => v.type === "video" && v.lengthSeconds > 0 && v.lengthSeconds < 600)
    .slice(0, 30)
    .map(mapInvidiousVideo);
}

async function searchSongs(query: string) {
  const data = await invFetch(
    `/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`
  );
  return (data || [])
    .filter((v: any) => v.type === "video" && v.lengthSeconds > 0)
    .slice(0, 30)
    .map(mapInvidiousVideo);
}

async function searchArtists(query: string) {
  const data = await invFetch(
    `/search?q=${encodeURIComponent(query)}&type=channel`
  );
  return (data || [])
    .filter((v: any) => v.type === "channel")
    .slice(0, 20)
    .map((item: any) => ({
      id: item.authorId || "",
      name: item.author || "Unknown",
      image:
        item.authorThumbnails?.find((t: any) => t.width >= 100)?.url ||
        item.authorThumbnails?.[0]?.url ||
        "/placeholder.svg",
      bio: item.description || "",
      followers: item.subCount || 0,
      topSongs: [],
      albums: [],
    }));
}

async function getSongDetails(videoId: string) {
  const data = await invFetch(`/videos/${videoId}`);

  // Get best audio stream
  const audioStream = (data.adaptiveFormats || [])
    .filter((f: any) => f.type?.startsWith("audio/"))
    .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

  return {
    id: videoId,
    title: data.title || "Unknown",
    artist:
      data.author?.replace(" - Topic", "") || data.author || "Unknown",
    artistId: data.authorId || "",
    album: "",
    albumId: "",
    cover:
      data.videoThumbnails?.find((t: any) => t.quality === "medium")?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    preview: "",
    duration: data.lengthSeconds || 0,
    plays: data.viewCount || 0,
    streamUrl: audioStream?.url || "",
  };
}

async function getArtistDetails(channelId: string) {
  const data = await invFetch(`/channels/${channelId}`);
  const videos = (data.latestVideos || [])
    .filter((v: any) => v.lengthSeconds > 0 && v.lengthSeconds < 600)
    .slice(0, 15)
    .map(mapInvidiousVideo);

  return {
    id: channelId,
    name: data.author?.replace(" - Topic", "") || data.author || "Unknown",
    image:
      data.authorThumbnails?.find((t: any) => t.width >= 100)?.url ||
      "/placeholder.svg",
    bio: data.description || "",
    followers: data.subCount || 0,
    topSongs: videos,
    albums: [],
  };
}

async function getPlaylistDetails(playlistId: string) {
  const data = await invFetch(`/playlists/${playlistId}`);
  const songs = (data.videos || [])
    .filter((v: any) => v.lengthSeconds > 0)
    .map(mapInvidiousVideo);

  return {
    id: playlistId,
    name: data.title || "Playlist",
    description: data.description || "",
    cover: songs[0]?.cover || "/placeholder.svg",
    songs,
    createdAt: "",
    isPublic: true,
  };
}

async function getTrendingArtists() {
  const data = await invFetch(
    `/search?q=${encodeURIComponent("popular music artists 2025")}&type=channel`
  );
  return (data || [])
    .filter((item: any) => item.type === "channel" && item.author)
    .slice(0, 20)
    .map((item: any) => ({
      id: item.authorId || "",
      name: item.author || "Unknown",
      image:
        item.authorThumbnails?.find((t: any) => t.width >= 100)?.url ||
        "/placeholder.svg",
      bio: "",
      followers: item.subCount || 0,
      topSongs: [],
      albums: [],
    }));
}

async function getTrendingPlaylists() {
  const data = await invFetch(
    `/search?q=${encodeURIComponent("top hits 2025 playlist")}&type=playlist`
  );
  return (data || [])
    .filter((item: any) => item.type === "playlist")
    .slice(0, 20)
    .map((item: any) => ({
      id: item.playlistId || "",
      name: item.title || "Playlist",
      description: "",
      cover:
        item.playlistThumbnail ||
        item.videos?.[0]?.videoThumbnails?.[0]?.url ||
        "/placeholder.svg",
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
