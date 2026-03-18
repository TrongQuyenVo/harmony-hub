import { Play, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Song } from "@/types/music";
import { usePlayerStore } from "@/stores/playerStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { cn } from "@/lib/utils";

interface MusicCardProps {
  song: Song;
  queue?: Song[];
  index?: number;
  variant?: "card" | "row";
}

export default function MusicCard({ song, queue, index, variant = "card" }: MusicCardProps) {
  const { playSong, currentSong, isPlaying } = usePlayerStore();
  const { toggleLike, isLiked } = useLibraryStore();
  const navigate = useNavigate();
  const active = currentSong?.id === song.id;
  const liked = isLiked(song.id);

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playSong(song, queue);
  };

  const handleNavigate = () => {
    playSong(song, queue);
    navigate(`/song/${song.id}`);
  };

  if (variant === "row") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (index || 0) * 0.03 }}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg group cursor-pointer transition-colors",
          active ? "bg-primary/10" : "hover:bg-muted/50"
        )}
        onClick={handleNavigate}
      >
        <span className="w-6 text-center text-sm text-muted-foreground group-hover:hidden">
          {(index || 0) + 1}
        </span>
        <Play className="w-4 h-4 text-foreground hidden group-hover:block ml-1" onClick={handlePlay} />

        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
          <img src={song.cover} alt={song.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium line-clamp-1", active ? "text-primary" : "text-foreground")}>{song.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{song.artist}</p>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:block">{song.album}</span>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
            className={cn("opacity-0 group-hover:opacity-100 transition-opacity", liked && "opacity-100")}
          >
            <Heart className={cn("w-4 h-4", liked ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-right">
            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: (index || 0) * 0.05 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
      onClick={handleNavigate}
    >
      <div className="relative rounded-xl overflow-hidden shadow-card mb-3">
        <img src={song.cover} alt={song.title} className="w-full aspect-square object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
          onClick={handlePlay}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-glow opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
        >
          {active && isPlaying ? (
            <div className="flex gap-0.5 items-end h-3">
              <span className="w-0.5 bg-primary-foreground animate-pulse h-full" />
              <span className="w-0.5 bg-primary-foreground animate-pulse h-2/3 delay-75" />
              <span className="w-0.5 bg-primary-foreground animate-pulse h-1/3 delay-150" />
            </div>
          ) : (
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          )}
        </button>
      </div>
      <p className={cn("text-sm font-semibold line-clamp-1", active ? "text-primary" : "text-foreground")}>{song.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{song.artist}</p>
    </motion.div>
  );
}
