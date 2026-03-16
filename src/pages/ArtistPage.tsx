import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Shuffle, UserPlus } from "lucide-react";
import MusicCard from "@/components/MusicCard";
import { fetchArtistDetails } from "@/services/musicApi";
import { Artist } from "@/types/music";
import { usePlayerStore } from "@/stores/playerStore";

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchArtistDetails(id).then((a) => {
      setArtist(a);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return <div className="px-6 py-20 text-center text-muted-foreground">Artist not found</div>;
  }

  const handlePlayAll = () => {
    if (artist.topSongs.length > 0) playSong(artist.topSongs[0], artist.topSongs);
  };

  return (
    <div>
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-64 md:h-80 overflow-hidden"
      >
        <img
          src={artist.image}
          alt={artist.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-6 left-6 md:left-10">
          <p className="text-sm text-primary font-medium mb-1">Artist</p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">{artist.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {artist.followers.toLocaleString()} followers
          </p>
        </div>
      </motion.div>

      <div className="px-4 md:px-6 py-6 space-y-8">
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayAll}
            className="gradient-primary px-6 py-3 rounded-full font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Play className="w-5 h-5" /> Play
          </button>
          <button className="px-5 py-3 rounded-full border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-2">
            <Shuffle className="w-4 h-4" /> Shuffle
          </button>
          <button className="px-5 py-3 rounded-full border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Follow
          </button>
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="text-sm text-muted-foreground max-w-2xl">{artist.bio}</p>
        )}

        {/* Top songs */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Popular</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {artist.topSongs.map((song, i) => (
              <MusicCard key={song.id} song={song} queue={artist.topSongs} index={i} variant="row" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
