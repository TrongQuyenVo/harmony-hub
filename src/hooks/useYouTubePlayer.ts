import { useRef, useEffect, useCallback } from "react";
import { loadYouTubeAPI } from "@/services/youtubeService";

declare global {
  interface Window {
    YT: any;
  }
}

interface UseYouTubePlayerOptions {
  onProgress?: (time: number) => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  onPlaying?: (playing: boolean) => void;
  onError?: () => void;
}

export function useYouTubePlayer(options: UseYouTubePlayerOptions) {
  const playerRef = useRef<any>(null);
  const containerIdRef = useRef(`yt-player-${Date.now()}`);
  const intervalRef = useRef<number>();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const readyRef = useRef(false);
  const pendingSearchRef = useRef<string | null>(null);

  const createPlayer = useCallback(async () => {
    await loadYouTubeAPI();

    const container = document.getElementById(containerIdRef.current);
    if (!container || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerIdRef.current, {
      height: "1",
      width: "1",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          readyRef.current = true;
          if (pendingSearchRef.current) {
            searchAndPlay(pendingSearchRef.current);
            pendingSearchRef.current = null;
          }
        },
        onStateChange: (event: any) => {
          const YT = window.YT;
          if (event.data === YT.PlayerState.PLAYING) {
            optionsRef.current.onPlaying?.(true);
            const dur = playerRef.current?.getDuration?.();
            if (dur) optionsRef.current.onDuration?.(dur);
            clearInterval(intervalRef.current);
            intervalRef.current = window.setInterval(() => {
              const time = playerRef.current?.getCurrentTime?.();
              if (time != null) optionsRef.current.onProgress?.(time);
            }, 500);
          } else if (event.data === YT.PlayerState.PAUSED) {
            optionsRef.current.onPlaying?.(false);
            clearInterval(intervalRef.current);
          } else if (event.data === YT.PlayerState.ENDED) {
            clearInterval(intervalRef.current);
            optionsRef.current.onEnded?.();
          }
        },
        onError: (event: any) => {
          console.warn("YouTube player error:", event.data);
          optionsRef.current.onError?.();
        },
      },
    });
  }, []);

  // Use YouTube's built-in search via loadPlaylist
  const searchAndPlay = useCallback((query: string) => {
    if (!readyRef.current || !playerRef.current) {
      pendingSearchRef.current = query;
      return;
    }
    try {
      // Use cuePlaylist with listType 'search' to find and play
      playerRef.current.loadPlaylist({
        listType: "search",
        list: query,
      });
    } catch (e) {
      console.warn("YouTube search failed:", e);
      optionsRef.current.onError?.();
    }
  }, []);

  const play = useCallback(() => {
    playerRef.current?.playVideo?.();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo?.();
  }, []);

  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo?.(time, true);
  }, []);

  const setVolume = useCallback((vol: number) => {
    playerRef.current?.setVolume?.(vol * 100);
  }, []);

  useEffect(() => {
    createPlayer();
    return () => {
      clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      readyRef.current = false;
    };
  }, [createPlayer]);

  return {
    containerId: containerIdRef.current,
    searchAndPlay,
    play,
    pause,
    seekTo,
    setVolume,
  };
}
