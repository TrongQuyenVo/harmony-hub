import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Mic2, Heart, ListMusic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { fetchTrackPreview } from "@/services/deezerApi";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentSong, isPlaying, volume, progress, duration,
    shuffle, repeat, togglePlay, nextSong, prevSong,
    setVolume, setProgress, setDuration, toggleShuffle,
    toggleRepeat, toggleLyrics, setPlaying
  } = usePlayerStore();
  const { toggleLike, isLiked, addToRecentlyPlayed } = useLibraryStore();

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextSong();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [repeat, nextSong, setProgress, setDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const loadAndPlay = async () => {
      let previewUrl = currentSong.preview;
      
      // If no preview URL, fetch it from Deezer
      if (!previewUrl && currentSong.id.startsWith("dz-")) {
        previewUrl = await fetchTrackPreview(currentSong.id);
      }
      
      if (!previewUrl) {
        console.warn("No preview URL available for", currentSong.title);
        setPlaying(false);
        return;
      }

      if (audio.src !== previewUrl) {
        audio.src = previewUrl;
        audio.load();
        addToRecentlyPlayed(currentSong);
      }

      if (isPlaying) {
        audio.play().catch(() => setPlaying(false));
      }
    };

    if (isPlaying || audio.src !== currentSong.preview) {
      loadAndPlay();
    }
    
    if (!isPlaying && audio.src) {
      audio.pause();
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * duration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
  };

  if (!currentSong) return null;

  const liked = isLiked(currentSong.id);
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border"
    >
      <div className="flex items-center h-[72px] md:h-20 px-3 md:px-4">
        {/* Song info */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-card">
            <img
              src={currentSong.cover}
              alt={currentSong.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground line-clamp-1">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{currentSong.artist}</p>
          </div>
          <button
            onClick={() => toggleLike(currentSong)}
            className="hidden sm:flex ml-2 flex-shrink-0"
          >
            <Heart
              className={cn("w-4 h-4 transition-colors", liked ? "fill-primary text-primary" : "text-muted-foreground hover:text-foreground")}
            />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center flex-1 max-w-[600px]">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleShuffle}
              className={cn("hidden sm:block p-1.5", shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={prevSong} className="p-1.5 text-foreground hover:text-primary transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
              )}
            </button>
            <button onClick={nextSong} className="p-1.5 text-foreground hover:text-primary transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={toggleRepeat}
              className={cn("hidden sm:block p-1.5", repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              {repeat === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full mt-1">
            <span className="text-[10px] text-muted-foreground w-8 text-right">{formatTime(progress)}</span>
            <div
              className="flex-1 h-1 bg-muted rounded-full cursor-pointer group relative"
              onClick={handleSeek}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full group-hover:bg-primary"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPct}% - 6px)` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & extras */}
        <div className="hidden md:flex items-center gap-2 w-[30%] justify-end">
          <button onClick={toggleLyrics} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Mic2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ListMusic className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)} className="text-muted-foreground hover:text-foreground">
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div
              className="w-20 h-1 bg-muted rounded-full cursor-pointer group relative"
              onClick={handleVolumeChange}
            >
              <div className="absolute inset-y-0 left-0 bg-foreground rounded-full" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
