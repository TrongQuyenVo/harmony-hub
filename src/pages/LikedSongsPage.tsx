import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import MusicCard from "@/components/MusicCard";
import { useLibraryStore } from "@/stores/libraryStore";
import { usePlayerStore } from "@/stores/playerStore";

export default function LikedSongsPage() {
  const { likedSongs } = useLibraryStore();
  const { playSong } = usePlayerStore();

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="gradient-card rounded-xl p-6 md:p-10 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl gradient-accent flex items-center justify-center">
              <Heart className="w-8 h-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Liked Songs</h1>
              <p className="text-sm text-muted-foreground">{likedSongs.length} songs</p>
            </div>
          </div>
        </div>

        {likedSongs.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {likedSongs.map((song, i) => (
              <MusicCard key={song.id} song={song} queue={likedSongs} index={i} variant="row" />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-20">
            Songs you like will appear here. Start exploring!
          </p>
        )}
      </motion.div>
    </div>
  );
}
