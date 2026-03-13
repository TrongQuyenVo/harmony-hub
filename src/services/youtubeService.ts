// YouTube search via Piped API (CORS-friendly YouTube frontend)
// + YouTube IFrame Player API for playback

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://watchapi.whatever.social",
];

interface PipedSearchResult {
  url: string;
  title: string;
  duration: number;
  type: string;
}

export async function searchYouTubeVideoId(query: string): Promise<string | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();
      const items: PipedSearchResult[] = data.items || [];

      const video = items.find(
        (item) => item.type === "stream" && item.duration > 30
      );
      if (video) {
        // url is like "/watch?v=dQw4w9WgXcQ"
        const match = video.url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
      }
    } catch {
      continue;
    }
  }

  // Fallback: try without music_songs filter
  for (const instance of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(
        `${instance}/search?q=${encodeURIComponent(query + " official audio")}&filter=videos`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();
      const items: PipedSearchResult[] = data.items || [];

      const video = items.find(
        (item) => item.type === "stream" && item.duration > 30 && item.duration < 600
      );
      if (video) {
        const match = video.url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
      }
    } catch {
      continue;
    }
  }

  return null;
}

// ---- YouTube IFrame Player API ----

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

export function loadYouTubeAPI(): Promise<void> {
  if (apiReady) return Promise.resolve();
  return new Promise((resolve) => {
    if (apiLoaded) {
      if (apiReady) {
        resolve();
      } else {
        readyCallbacks.push(resolve);
      }
      return;
    }
    apiLoaded = true;
    readyCallbacks.push(resolve);

    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      apiReady = true;
      prev?.();
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks.length = 0;
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

// Cache searched video IDs so we don't re-search
const videoIdCache = new Map<string, string>();

export async function getVideoIdForSong(title: string, artist: string): Promise<string | null> {
  const key = `${title} - ${artist}`;
  if (videoIdCache.has(key)) return videoIdCache.get(key)!;

  const videoId = await searchYouTubeVideoId(`${title} ${artist}`);
  if (videoId) {
    videoIdCache.set(key, videoId);
  }
  return videoId;
}
