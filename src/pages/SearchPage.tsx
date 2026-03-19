import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Clock, Search } from "lucide-react";
import MusicCard from "@/components/MusicCard";
import ArtistCard from "@/components/ArtistCard";
import { searchSongs, searchArtists, fetchTrendingSongs, fetchTrendingArtists } from "@/services/musicApi";
import { useSearchStore } from "@/stores/searchStore";
import { genres } from "@/data/genres";
import { Artist, Song } from "@/types/music";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [results, setResults] = useState<Song[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchStore();

  useEffect(() => {
    async function runSearch() {
      setLoading(true);
      if (query) {
        addToHistory(query);
        const [songs, artists] = await Promise.all([
          searchSongs(query),
          searchArtists(query),
        ]);
        setResults(songs);
        setArtistResults(artists);
      } else {
        const [songs, artists] = await Promise.all([
          fetchTrendingSongs(),
          fetchTrendingArtists(),
        ]);
        setTopSongs(songs);
        setTopArtists(artists);
      }
      setLoading(false);
    }

    runSearch();
  }, [query]);

  const handleHistoryClick = (q: string) => {
    setParams({ q });
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-8">
      {query === "" ? (
        <>
          {/* Search History */}
          {history.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Recent Searches</h2>
                </div>
                <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <div
                    key={h}
                    className="flex items-center gap-1.5 bg-muted/60 hover:bg-muted rounded-full px-3 py-1.5 cursor-pointer transition-colors group"
                  >
                    <Search className="w-3 h-3 text-muted-foreground" />
                    <span
                      onClick={() => handleHistoryClick(h)}
                      className="text-sm text-foreground"
                    >
                      {h}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromHistory(h); }}
                      className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-bold text-foreground mb-6">Browse All</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {genres.map((genre, i) => (
                <motion.div
                  key={genre.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-gradient-to-br ${genre.color} rounded-xl p-4 h-28 flex items-end cursor-pointer hover:scale-[1.02] transition-transform shadow-card`}
                >
                  <span className="text-sm font-bold text-foreground drop-shadow-lg">{genre.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {topSongs.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Popular Songs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {topSongs.slice(0, 6).map((song, i) => (
                  <MusicCard key={song.id} song={song} queue={topSongs} index={i} />
                ))}
              </div>
            </section>
          )}

          {topArtists.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Popular Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {topArtists.map((a, i) => (
                  <ArtistCard key={a.id} artist={a} index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Results for "<span className="text-primary">{query}</span>"
          </h1>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Songs first */}
              <section className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-4">Songs</h2>
                {results.length > 0 ? (
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {results.map((song, i) => (
                      <MusicCard key={song.id} song={song} queue={results} index={i} variant="row" />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-4 text-center text-sm">No songs found</p>
                )}
              </section>

              {artistResults.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-foreground mb-4">Artists</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {artistResults.map((a, i) => (
                      <ArtistCard key={a.id} artist={a} index={i} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
