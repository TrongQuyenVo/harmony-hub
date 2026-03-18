import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ArtistCard from "@/components/ArtistCard";
import { fetchTrendingArtists } from "@/services/musicApi";

export default function ArtistsPage() {
  const { data: artists = [], isLoading } = useQuery({
    queryKey: ["trending-artists"],
    queryFn: fetchTrendingArtists,
  });

  return (
    <div className="px-4 md:px-6 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-foreground mb-6">Popular Artists</h1>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : artists.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No artists found</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {artists.map((artist, i) => (
              <ArtistCard key={artist.id} artist={artist} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
