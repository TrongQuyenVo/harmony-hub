import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Heart, ArrowLeft, Music, Mic2, SkipForward } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayerStore } from "@/stores/playerStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { fetchSongDetails, fetchLyrics } from "@/services/musicApi";
import MusicCard from "@/components/MusicCard";
import { Song } from "@/types/music";

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay, queue, queueIndex } = usePlayerStore();
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
  const upNext = queue.slice(queueIndex + 1);

  return (
    <div className="px-4 md:px-6 py-6 pb-28 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <Tabs defaultValue="player" className="w-full">
        <TabsList className="w-full max-w-xs mx-auto mb-6">
          <TabsTrigger value="player" className="flex-1 gap-1.5">
            <Music className="w-4 h-4" /> Player
          </TabsTrigger>
          <TabsTrigger value="lyrics" className="flex-1 gap-1.5">
            <Mic2 className="w-4 h-4" /> Lyrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="player">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            {/* Cover art */}
            <div className="w-full max-w-[280px] sm:max-w-[320px] mb-6">
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
            <div className="text-center w-full max-w-md mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 line-clamp-2 break-words">{song.title}</h1>
              <p className="text-base text-muted-foreground">{song.artist}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => isActive ? togglePlay() : playSong(song)}
                className="gradient-primary px-8 py-3 rounded-full font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
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
          </motion.div>
        </TabsContent>

        <TabsContent value="lyrics">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            {/* Mini cover + title */}
            <div className="flex items-center gap-3 mb-6 w-full max-w-lg">
              <img
                src={song.cover}
                alt={song.title}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <div className="min-w-0">
                <h2 className="font-bold text-foreground line-clamp-1">{song.title}</h2>
                <p className="text-sm text-muted-foreground">{song.artist}</p>
              </div>
            </div>

            {/* Lyrics content */}
            <div className="w-full max-w-lg">
              {loadingLyrics ? (
                <div className="flex items-center gap-2 text-muted-foreground justify-center py-10">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading lyrics...</span>
                </div>
              ) : lyrics ? (
                <div className="bg-card rounded-xl border border-border p-4 md:p-6 max-h-[60vh] overflow-y-auto">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed break-words">
                    {lyrics}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">No lyrics available for this song.</p>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Up Next / Queue */}
      {upNext.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <SkipForward className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Up Next</h2>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {upNext.slice(0, 10).map((s, i) => (
              <MusicCard key={`${s.id}-${i}`} song={s} queue={queue} index={queueIndex + 1 + i} variant="row" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
