import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Artist } from "@/types/music";

interface ArtistCardProps {
  artist: Artist;
  index?: number;
}

export default function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer text-center"
      onClick={() => navigate(`/artist/${artist.id}`)}
    >
      <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 shadow-card mx-auto">
        <img
          src={artist.image}
          alt={artist.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
            <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground line-clamp-1">{artist.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5">Artist</p>
    </motion.div>
  );
}
