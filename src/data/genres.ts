export interface Genre {
  id: string;
  name: string;
  color: string;
  category: "music" | "podcast" | "story" | "postcard";
}

export const genres: Genre[] = [
  // Music
  { id: "g1", name: "Pop", color: "from-pink-500 to-rose-500", category: "music" },
  { id: "g2", name: "Hip-Hop", color: "from-orange-500 to-amber-500", category: "music" },
  { id: "g3", name: "R&B", color: "from-purple-500 to-violet-500", category: "music" },
  { id: "g4", name: "Rock", color: "from-red-500 to-rose-600", category: "music" },
  { id: "g5", name: "Electronic", color: "from-cyan-500 to-blue-500", category: "music" },
  { id: "g6", name: "Jazz", color: "from-amber-500 to-yellow-500", category: "music" },
  { id: "g7", name: "Classical", color: "from-emerald-500 to-green-500", category: "music" },
  { id: "g8", name: "Country", color: "from-yellow-600 to-orange-500", category: "music" },
  { id: "g9", name: "K-Pop", color: "from-fuchsia-500 to-pink-500", category: "music" },
  { id: "g10", name: "V-Pop", color: "from-red-500 to-orange-500", category: "music" },
  { id: "g11", name: "C-Pop", color: "from-rose-500 to-red-600", category: "music" },
  { id: "g12", name: "Lo-Fi", color: "from-indigo-500 to-purple-500", category: "music" },

  // Podcast
  { id: "p1", name: "True Crime", color: "from-slate-600 to-gray-800", category: "podcast" },
  { id: "p2", name: "Comedy", color: "from-yellow-400 to-orange-400", category: "podcast" },
  { id: "p3", name: "Technology", color: "from-blue-500 to-indigo-600", category: "podcast" },
  { id: "p4", name: "Health", color: "from-green-400 to-emerald-500", category: "podcast" },

  // Stories
  { id: "s1", name: "Audiobooks", color: "from-amber-600 to-yellow-700", category: "story" },
  { id: "s2", name: "Short Stories", color: "from-teal-500 to-cyan-600", category: "story" },
  { id: "s3", name: "Fairy Tales", color: "from-violet-400 to-purple-500", category: "story" },

  // Postcard / Mood
  { id: "c1", name: "Chill", color: "from-sky-400 to-blue-500", category: "postcard" },
  { id: "c2", name: "Focus", color: "from-emerald-400 to-teal-500", category: "postcard" },
  { id: "c3", name: "Workout", color: "from-red-500 to-orange-600", category: "postcard" },
  { id: "c4", name: "Sleep", color: "from-indigo-600 to-violet-800", category: "postcard" },
];

export const categories = [
  { id: "music", name: "🎵 Music", icon: "Music" },
  { id: "podcast", name: "🎙️ Podcast", icon: "Mic2" },
  { id: "story", name: "📖 Stories", icon: "BookOpen" },
  { id: "postcard", name: "💌 Mood", icon: "Heart" },
] as const;
