import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Clock, Music } from "lucide-react";
import MusicCard from "@/components/MusicCard";
import { fetchPlaylist } from "@/services/deezerApi";
import { usePlayerStore } from "@/stores/playerStore";
import { useLibraryStore } from "@/stores/libraryStore";
import { Playlist } from "@/types/music";

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const { playSong } = usePlayerStore();
  const { playlists: userPlaylists } = useLibraryStore();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    if (!id) return;
    const local = userPlaylists.find((p) => p.id === id);
    if (local) {
      setPlaylist(local);
    } else if (id.startsWith("dz-p-")) {
      fetchPlaylist(id).then((p) => setPlaylist(p));
    } else {
      setPlaylist(null);
    }
  }, [id, userPlaylists]);

  if (!playlist) {
    return <div className="px-6 py-20 text-center text-muted-foreground">Playlist not found</div>;
  }

  const handlePlayAll = () => {
    if (playlist.songs.length > 0) playSong(playlist.songs[0], playlist.songs);
  };

  const totalDuration = playlist.songs.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative gradient-card p-6 md:p-10"
      >
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-xl overflow-hidden shadow-card flex-shrink-0">
            <img
              src={playlist.cover}
              alt={playlist.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm text-primary font-medium mb-1">Playlist</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">{playlist.name}</h1>
            <p className="text-sm text-muted-foreground mb-3">{playlist.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center md:justify-start">
              <span className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5" /> {playlist.songs.length} songs
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {Math.floor(totalDuration / 60)} min
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-4 md:px-6 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayAll}
            className="gradient-primary px-6 py-3 rounded-full font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Play className="w-5 h-5" /> Play All
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {playlist.songs.map((song, i) => (
            <MusicCard key={song.id} song={song} queue={playlist.songs} index={i} variant="row" />
          ))}
        </div>

        {playlist.songs.length === 0 && (
          <p className="text-center text-muted-foreground py-10">This playlist is empty</p>
        )}
      </div>
    </div>
  );
}
