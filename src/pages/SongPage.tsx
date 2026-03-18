import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/stores/playerStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { fetchSongDetails, fetchLyrics } from "@/services/musicApi";
import { Song } from "@/types/music";

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore();
  const { toggleLike, isLiked } = useLibraryStore();
  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [loadingLyrics, setLoadingLyrics] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    if (currentSong?.id === id) {
      setSong(currentSong);
      setLoading(false);
    } else {
      fetchSongDetails(id).then((s) => {
        setSong(s);
        setLoading(false);
        if (s) playSong(s);
      });
    }
  }, [id]);

  useEffect(() => {
    if (!song) return;
    setLoadingLyrics(true);
    fetchLyrics(song.title, song.artist).then((result) => {
      setLyrics(result.plainLyrics || result.syncedLyrics || "");
      setLoadingLyrics(false);
    });
  }, [song?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!song) {
    return <div className="px-6 py-20 text-center text-muted-foreground">Song not found</div>;
  }

  const isActive = currentSong?.id === song.id;
  const liked = isLiked(song.id);

  return (
    <div className="px-4 md:px-6 py-6 pb-28">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center md:items-start md:flex-row gap-6 md:gap-8 max-w-4xl mx-auto"
      >
        {/* Cover art */}
        <div className="flex-shrink-0 w-full max-w-[280px] md:max-w-[320px]">
          <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-glow">
            <img
              src={song.cover}
              alt={song.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          </div>
        </div>

        {/* Song info */}
        <div className="flex-1 min-w-0 w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 line-clamp-2 break-words">{song.title}</h1>
          <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">{song.artist}</p>

          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <button
              onClick={() => isActive ? togglePlay() : playSong(song)}
              className="gradient-primary px-5 py-2.5 md:px-6 md:py-3 rounded-full font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform flex items-center gap-2 text-sm md:text-base"
            >
              {isActive && isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5" />}
              {isActive && isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => toggleLike(song)}
              className="p-2.5 md:p-3 rounded-full border border-border hover:bg-muted transition-colors"
            >
              <Heart className={liked ? "w-4 h-4 md:w-5 md:h-5 fill-primary text-primary" : "w-4 h-4 md:w-5 md:h-5 text-muted-foreground"} />
            </button>
          </div>

          {/* Lyrics */}
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">Lyrics</h2>
            {loadingLyrics ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading lyrics...</span>
              </div>
            ) : lyrics ? (
              <div className="bg-card rounded-xl border border-border p-4 md:p-6 max-h-[50vh] overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed break-words">
                  {lyrics}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No lyrics available for this song.</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
