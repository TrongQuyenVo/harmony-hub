import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import MusicCard from "@/components/MusicCard";
import { useLibraryStore } from "@/stores/libraryStore";

export default function RecentPage() {
  const { recentlyPlayed } = useLibraryStore();

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Recently Played</h1>
        </div>

        {recentlyPlayed.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {recentlyPlayed.map((song, i) => (
              <MusicCard key={`${song.id}-${i}`} song={song} queue={recentlyPlayed} index={i} variant="row" />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-20">
            Your listening history will appear here.
          </p>
        )}
      </motion.div>
    </div>
  );
}
