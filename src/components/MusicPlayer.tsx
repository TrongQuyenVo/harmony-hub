import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Mic2, Heart, ListMusic, Loader2, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useMediaSession } from "@/hooks/useMediaSession";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const {
    currentSong, isPlaying, volume, progress, duration,
    shuffle, repeat, queue, queueIndex, togglePlay, nextSong, prevSong,
    setVolume, setProgress, setDuration, toggleShuffle,
    toggleRepeat, setPlaying
  } = usePlayerStore();
  const { toggleLike, isLiked, addToRecentlyPlayed } = useLibraryStore();
  const [loading, setLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const lastSongIdRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // Media Session for background playback
  useMediaSession();

  const ytPlayer = useYouTubePlayer({
    onProgress: (time) => setProgress(time),
    onDuration: (dur) => setDuration(dur),
    onEnded: () => {
      if (repeat === "one") {
        ytPlayer.seekTo(0);
        ytPlayer.play();
      } else {
        nextSong();
      }
    },
    onPlaying: (playing) => {
      setPlaying(playing);
      if (loading) setLoading(false);
    },
    onError: () => {
      if (!currentSong) {
        setLoading(false);
        setPlaying(false);
        return;
      }
      const query = `${currentSong.title} ${currentSong.artist} official audio`;
      ytPlayer.searchAndPlay(query);
    },
  });

  useEffect(() => {
    if (!currentSong) return;
    if (lastSongIdRef.current === currentSong.id) {
      if (isPlaying) ytPlayer.play();
      else ytPlayer.pause();
      return;
    }
    lastSongIdRef.current = currentSong.id;
    setLoading(true);
    setProgress(0);
    setDuration(currentSong.duration || 0);
    addToRecentlyPlayed(currentSong);
    ytPlayer.loadVideo(currentSong.id);
  }, [currentSong?.id]);

  useEffect(() => {
    if (!currentSong || loading) return;
    if (lastSongIdRef.current !== currentSong.id) return;
    if (isPlaying) ytPlayer.play();
    else ytPlayer.pause();
  }, [isPlaying]);

  useEffect(() => {
    ytPlayer.setVolume(volume);
  }, [volume]);

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    ytPlayer.seekTo(newTime);
    setProgress(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const liked = currentSong ? isLiked(currentSong.id) : false;

  if (!currentSong) return <div id={ytPlayer.containerId} className="hidden" />;
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      <div id={ytPlayer.containerId} className="fixed -top-[100px] -left-[100px] w-[1px] h-[1px] opacity-0 pointer-events-none" />

      {/* Queue Panel */}
      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 w-80 max-h-96 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Queue</h3>
              <button onClick={() => setShowQueue(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-80 p-2 space-y-1">
              {queue.map((song, i) => (
                <div
                  key={`${song.id}-${i}`}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm",
                    i === queueIndex ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground"
                  )}
                  onClick={() => usePlayerStore.getState().playSong(song, queue)}
                >
                  <img src={song.cover} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium">{song.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{song.artist}</p>
                  </div>
                </div>
              ))}
              {queue.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">Queue is empty</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border"
      >
        <div className="flex items-center h-[72px] md:h-20 px-3 md:px-4">
          {/* Song info */}
          <div className="flex items-center gap-3 w-[30%] min-w-0">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-card cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/song/${currentSong.id}`)}
            >
              <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            </div>
            <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/song/${currentSong.id}`)}>
              <p className="text-sm font-semibold text-foreground line-clamp-1 hover:underline">{currentSong.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{currentSong.artist}</p>
            </div>
            <button onClick={() => toggleLike(currentSong)} className="hidden sm:flex ml-2 flex-shrink-0">
              <Heart className={cn("w-4 h-4 transition-colors", liked ? "fill-primary text-primary" : "text-muted-foreground hover:text-foreground")} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center flex-1 max-w-[600px]">
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={toggleShuffle} className={cn("p-1.5", shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Shuffle className="w-4 h-4" />
              </button>
              <button onClick={prevSong} className="p-1.5 text-foreground hover:text-primary transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={togglePlay} className="w-9 h-9 md:w-10 md:h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow hover:scale-105 transition-transform">
                {loading ? (
                  <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                )}
              </button>
              <button onClick={nextSong} className="p-1.5 text-foreground hover:text-primary transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
              <button onClick={toggleRepeat} className={cn("p-1.5", repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                {repeat === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2 w-full mt-1">
              <span className="text-[10px] text-muted-foreground w-8 text-right">{formatTime(progress)}</span>
              <Slider
                value={[progressPct]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="flex-1 h-1 cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:opacity-0 hover:[&_[role=slider]]:opacity-100 [&_[data-orientation=horizontal]]:h-1"
              />
              <span className="text-[10px] text-muted-foreground w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-2 w-[30%] justify-end">
            <button
              onClick={() => navigate(`/song/${currentSong.id}`)}
              className="p-1.5 transition-colors text-muted-foreground hover:text-foreground"
              title="View lyrics"
            >
              <Mic2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={cn("p-1.5 transition-colors", showQueue ? "text-primary" : "text-muted-foreground hover:text-foreground")}
              title="Show queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)} className="text-muted-foreground hover:text-foreground">
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-20 cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[data-orientation=horizontal]]:h-1"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
