import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Playlist } from "@/types/music";
import { usePlayerStore } from "@/stores/playerStore";

interface PlaylistCardProps {
  playlist: Playlist;
  index?: number;
}

export default function PlaylistCard({ playlist, index = 0 }: PlaylistCardProps) {
  const navigate = useNavigate();
  const { playSong } = usePlayerStore();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
      onClick={() => navigate(`/playlist/${playlist.id}`)}
    >
      <div className="relative rounded-xl overflow-hidden shadow-card mb-3">
        <img
          src={playlist.cover}
          alt={playlist.name}
          className="w-full aspect-square object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <button
          onClick={handlePlay}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
        >
          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
        </button>
      </div>
      <p className="text-sm font-semibold text-foreground line-clamp-1">{playlist.name}</p>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{playlist.description}</p>
    </motion.div>
  );
}
