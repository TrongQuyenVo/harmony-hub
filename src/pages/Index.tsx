import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, TrendingUp, Sparkles, Music } from "lucide-react";
import MusicCard from "@/components/MusicCard";
import ArtistCard from "@/components/ArtistCard";
import PlaylistCard from "@/components/PlaylistCard";
import { usePlayerStore } from "@/stores/playerStore";
import { fetchTrendingSongs, fetchTrendingArtists, fetchTrendingPlaylists, fetchVietnameseChart, fetchChineseChart } from "@/services/deezerApi";
import { genres } from "@/data/genres";
import { Song, Artist, Playlist } from "@/types/music";

export default function HomePage() {
  const [trending, setTrending] = useState<Song[]>([]);
  const [vietSongs, setVietSongs] = useState<Song[]>([]);
  const [chineseSongs, setChineseSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    async function load() {
      const songs = await fetchTrendingSongs();
      setTrending(songs);
      const artistsData = await fetchTrendingArtists();
      setArtists(artistsData);
      const playlistsData = await fetchTrendingPlaylists();
      setPlaylists(playlistsData);
    }

    load();
  }, []);

  const handlePlayAll = () => {
    if (trending.length > 0) playSong(trending[0], trending);
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-10">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden gradient-card p-6 md:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Trending Now</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">
            Discover New Music
          </h1>
          <p className="text-muted-foreground mb-6 max-w-lg">
            Stream millions of songs. Find your next favorite track with personalized recommendations.
          </p>
          <button
            onClick={handlePlayAll}
            className="gradient-primary px-6 py-3 rounded-full font-semibold text-primary-foreground shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Play Trending
          </button>
        </div>
      </motion.section>

      {/* Trending songs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Trending Songs</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {trending.slice(0, 12).map((song, i) => (
            <MusicCard key={song.id} song={song} queue={trending} index={i} />
          ))}
        </div>
      </section>

      {/* Browse genres */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Browse Genres</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {genres.map((genre, i) => (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-gradient-to-br ${genre.color} rounded-xl p-4 h-24 flex items-end cursor-pointer hover:scale-[1.02] transition-transform shadow-card`}
            >
              <span className="text-sm font-bold text-foreground drop-shadow-lg">{genre.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured playlists */}
      {playlists.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Featured Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.map((pl, i) => (
              <PlaylistCard key={pl.id} playlist={pl} index={i} />
            ))}
          </div>
        </section>
      )}

      {artists.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Popular Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {artists.map((artist, i) => (
              <ArtistCard key={artist.id} artist={artist} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Top charts as list */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Music className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Top Charts</h2>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {trending.slice(0, 10).map((song, i) => (
            <MusicCard key={song.id} song={song} queue={trending} index={i} variant="row" />
          ))}
        </div>
      </section>
    </div>
  );
}
