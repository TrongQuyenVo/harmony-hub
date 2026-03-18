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

    // Check if the song is already playing
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
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
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
        className="flex flex-col md:flex-row gap-8"
      >
        {/* Cover art */}
        <div className="flex-shrink-0">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-glow mx-auto">
            <img
              src={song.cover}
              alt={song.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          </div>
        </div>

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{song.title}</h1>
          <p className="text-lg text-muted-foreground mb-6">{song.artist}</p>

          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => isActive ? togglePlay() : playSong(song)}
              className="gradient-primary px-6 py-3 rounded-full font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
            >
              {isActive && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isActive && isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => toggleLike(song)}
              className="p-3 rounded-full border border-border hover:bg-muted transition-colors"
            >
              <Heart className={liked ? "w-5 h-5 fill-primary text-primary" : "w-5 h-5 text-muted-foreground"} />
            </button>
          </div>

          {/* Lyrics */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Lyrics</h2>
            {loadingLyrics ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading lyrics...</span>
              </div>
            ) : lyrics ? (
              <div className="bg-card rounded-xl border border-border p-6 max-h-[400px] overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
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
