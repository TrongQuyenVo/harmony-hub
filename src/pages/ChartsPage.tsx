import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import MusicCard from "@/components/MusicCard";
import { fetchTrendingSongs } from "@/services/deezerApi";
import { mockSongs } from "@/data/mockData";
import { Song } from "@/types/music";

export default function ChartsPage() {
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingSongs().then((s) => {
      setSongs(s.length > 0 ? s : mockSongs);
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Top Charts</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {songs.map((song, i) => (
              <MusicCard key={song.id} song={song} queue={songs} index={i} variant="row" />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
