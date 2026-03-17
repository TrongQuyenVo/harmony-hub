import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INVIDIOUS_INSTANCES = [
  "https://invidious.darkness.services",
  "https://yewtu.be",
];

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi-libre.kavin.rocks",
];

const APPLE_COUNTRY_BY_REGION: Record<string, string> = {
  global: "us",
  viet: "vn",
  chinese: "cn",
};

async function tryFetchJson(url: string, timeoutMs = 7000): Promise<any | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      await res.text();
      return null;
    }

    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractPipedId(url: string): string {
  return url?.match(/[?&]v=([^&]+)/)?.[1] || url?.replace("/watch?v=", "") || "";
}

function fixThumb(url: string, fallbackId?: string): string {
  if (!url) return fallbackId ? `https://i.ytimg.com/vi/${fallbackId}/hqdefault.jpg` : "/placeholder.svg";
  if (url.startsWith("http")) return url;
  return `https://i.ytimg.com${url}`;
}

function mapInvVideo(item: any) {
  const id = item.videoId || "";
  return {
    id,
    title: item.title || "Unknown",
    artist: (item.author || "Unknown").replace(" - Topic", ""),
    artistId: item.authorId || "",
    album: "",
    albumId: "",
    cover: fixThumb(
      item.videoThumbnails?.find((t: any) => t.quality === "medium")?.url ||
        item.videoThumbnails?.[0]?.url ||
        "",
      id,
    ),
    preview: "",
    duration: item.lengthSeconds || 0,
    plays: item.viewCount || 0,
  };
}

function mapPipedVideo(item: any) {
  const id = extractPipedId(item.url || "");
  return {
    id,
    title: item.title || "Unknown",
    artist: (item.uploaderName || "Unknown").replace(" - Topic", ""),
    artistId: item.uploaderUrl?.replace("/channel/", "") || "",
    album: "",
    albumId: "",
    cover: item.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    preview: "",
    duration: item.duration || 0,
    plays: item.views || 0,
  };
}

async function searchBestSongMatch(query: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    const data = await tryFetchJson(
      `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`,
    );

    const match = (data || []).find(
      (item: any) => item.type === "video" && item.videoId && item.lengthSeconds > 60 && item.lengthSeconds < 900,
    );

    if (match) return mapInvVideo(match);
  }

  for (const instance of PIPED_INSTANCES) {
    const data = await tryFetchJson(
      `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
    );

    const match = (data?.items || []).find(
      (item: any) => item.url && item.duration > 60 && item.duration < 900,
    );

    if (match) return mapPipedVideo(match);
  }

  return null;
}

async function fetchAppleChart(region = "global") {
  const country = APPLE_COUNTRY_BY_REGION[region] || "us";
  const data = await tryFetchJson(
    `https://rss.applemarketingtools.com/api/v2/${country}/music/most-played/10/songs.json`,
    10000,
  );

  return data?.feed?.results || [];
}

async function getTrending(region = "global") {
  const chartSongs = await fetchAppleChart(region);
  if (!chartSongs.length) return [];

  const resolved = await Promise.all(
    chartSongs.map(async (item: any) => {
      const query = `${item.name} ${item.artistName} official audio`;
      const match = await searchBestSongMatch(query);
      if (!match) return null;

      return {
        ...match,
        title: item.name || match.title,
        artist: item.artistName || match.artist,
        album: "",
        cover: item.artworkUrl100?.replace("100x100bb", "600x600bb") || match.cover,
      };
    }),
  );

  return resolved.filter(Boolean);
}

async function searchSongs(query: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    const data = await tryFetchJson(
      `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`,
    );
    const items = (data || [])
      .filter((item: any) => item.type === "video" && item.videoId && item.lengthSeconds > 0)
      .slice(0, 30)
      .map(mapInvVideo);
    if (items.length) return items;
  }

  for (const instance of PIPED_INSTANCES) {
    const data = await tryFetchJson(
      `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
    );
    const items = (data?.items || [])
      .filter((item: any) => item.url && item.duration > 0)
      .slice(0, 30)
      .map(mapPipedVideo);
    if (items.length) return items;
  }

  return [];
}

async function searchArtists(query: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    const data = await tryFetchJson(
      `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=channel`,
    );
    const items = (data || [])
      .filter((item: any) => item.type === "channel")
      .slice(0, 20)
      .map((item: any) => ({
        id: item.authorId || "",
        name: item.author || "Unknown",
        image: fixThumb(item.authorThumbnails?.find((t: any) => t.width >= 100)?.url || ""),
        bio: item.description || "",
        followers: item.subCount || 0,
        topSongs: [],
        albums: [],
      }));
    if (items.length) return items;
  }

  return [];
}

async function getSongDetails(videoId: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    const d = await tryFetchJson(`${instance}/api/v1/videos/${videoId}`);
    if (!d) continue;

    const audio = (d.adaptiveFormats || [])
      .filter((f: any) => f.type?.startsWith("audio/"))
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    return {
      id: videoId,
      title: d.title || "Unknown",
      artist: (d.author || "Unknown").replace(" - Topic", ""),
      artistId: d.authorId || "",
      album: "",
      albumId: "",
      cover: fixThumb(d.videoThumbnails?.find((t: any) => t.quality === "medium")?.url || "", videoId),
      preview: "",
      duration: d.lengthSeconds || 0,
      plays: d.viewCount || 0,
      streamUrl: audio?.url || "",
    };
  }

  for (const instance of PIPED_INSTANCES) {
    const d = await tryFetchJson(`${instance}/streams/${videoId}`);
    if (!d) continue;

    const audio = d.audioStreams?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))?.[0];

    return {
      id: videoId,
      title: d.title || "Unknown",
      artist: (d.uploader || "Unknown").replace(" - Topic", ""),
      artistId: d.uploaderUrl?.replace("/channel/", "") || "",
      album: "",
      albumId: "",
      cover: d.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      preview: "",
      duration: d.duration || 0,
      plays: d.views || 0,
      streamUrl: audio?.url || "",
    };
  }

  return null;
}

async function getArtistDetails(channelId: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    const d = await tryFetchJson(`${instance}/api/v1/channels/${channelId}`);
    if (!d) continue;

    return {
      id: channelId,
      name: (d.author || "Unknown").replace(" - Topic", ""),
      image: fixThumb(d.authorThumbnails?.find((t: any) => t.width >= 100)?.url || ""),
      bio: d.description || "",
      followers: d.subCount || 0,
      topSongs: (d.latestVideos || [])
        .filter((v: any) => v.lengthSeconds > 0 && v.lengthSeconds < 900)
        .slice(0, 15)
        .map(mapInvVideo),
      albums: [],
    };
  }

  return null;
}

async function getPlaylistDetails(playlistId: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    const d = await tryFetchJson(`${instance}/api/v1/playlists/${playlistId}`, 10000);
    if (!d) continue;

    return {
      id: playlistId,
      name: d.title || "Playlist",
      description: d.description || "",
      cover: fixThumb(d.videos?.[0]?.videoThumbnails?.[0]?.url || ""),
      songs: (d.videos || []).filter((v: any) => v.lengthSeconds > 0).map(mapInvVideo),
      createdAt: "",
      isPublic: true,
    };
  }

  for (const instance of PIPED_INSTANCES) {
    const d = await tryFetchJson(`${instance}/playlists/${playlistId}`, 10000);
    if (!d) continue;

    return {
      id: playlistId,
      name: d.name || "Playlist",
      description: "",
      cover: d.thumbnailUrl || "/placeholder.svg",
      songs: (d.relatedStreams || []).filter((v: any) => v.duration > 0).map(mapPipedVideo),
      createdAt: "",
      isPublic: true,
    };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/music-api/, "");

    let result: any = [];

    if (path === "/trending" || path === "/trending/") {
      result = await getTrending(url.searchParams.get("region") || "global");
    } else if (path === "/trending-artists") {
      result = [];
    } else if (path === "/trending-playlists") {
      result = [];
    } else if (path === "/search") {
      const q = url.searchParams.get("q") || "";
      const type = url.searchParams.get("type") || "songs";
      result = q.trim() ? (type === "artists" ? await searchArtists(q) : await searchSongs(q)) : [];
    } else if (path.startsWith("/song/")) {
      result = await getSongDetails(path.replace("/song/", ""));
    } else if (path.startsWith("/artist/")) {
      result = await getArtistDetails(path.replace("/artist/", ""));
    } else if (path.startsWith("/playlist/")) {
      result = await getPlaylistDetails(path.replace("/playlist/", ""));
    } else {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result ?? []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Music API error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
