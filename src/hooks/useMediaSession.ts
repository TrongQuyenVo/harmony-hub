import { useEffect } from "react";
import { usePlayerStore } from "@/stores/playerStore";

export function useMediaSession() {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong } = usePlayerStore();

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || "",
        artwork: [
          { src: currentSong.cover, sizes: "512x512", type: "image/jpeg" },
        ],
      });
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => togglePlay());
    navigator.mediaSession.setActionHandler("pause", () => togglePlay());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextSong());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevSong());

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [togglePlay, nextSong, prevSong]);
}
