import { motion } from "framer-motion";
import ArtistCard from "@/components/ArtistCard";
import { mockArtists } from "@/data/mockData";

export default function ArtistsPage() {
  return (
    <div className="px-4 md:px-6 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-foreground mb-6">Popular Artists</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {mockArtists.map((artist, i) => (
            <ArtistCard key={artist.id} artist={artist} index={i} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
