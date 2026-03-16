import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ListMusic } from "lucide-react";
import PlaylistCard from "@/components/PlaylistCard";
import { useLibraryStore } from "@/stores/libraryStore";
import { fetchTrendingPlaylists } from "@/services/musicApi";
import { Playlist } from "@/types/music";

export default function PlaylistsPage() {
  const { playlists, createPlaylist } = useLibraryStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [featured, setFeatured] = useState<Playlist[]>([]);

  useEffect(() => {
    fetchTrendingPlaylists().then(setFeatured);
  }, []);

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName("");
      setShowCreate(false);
    }
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* User playlists */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Your Playlists</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="gradient-primary px-4 py-2 rounded-full text-sm font-medium text-primary-foreground flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" /> New Playlist
          </button>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 mb-6 flex gap-3"
          >
            <input
              type="text"
              placeholder="Playlist name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <button onClick={handleCreate} className="gradient-primary px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground">
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </motion.div>
        )}

        {playlists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-10">
            {playlists.map((pl, i) => (
              <PlaylistCard key={pl.id} playlist={pl} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground mb-10">
            <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No playlists yet. Create one to get started!</p>
          </div>
        )}

        {/* Featured playlists */}
        <h2 className="text-xl font-bold text-foreground mb-4">Featured Playlists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {featured.map((pl, i) => (
            <PlaylistCard key={pl.id} playlist={pl} index={i} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
