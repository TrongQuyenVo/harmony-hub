import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import HomePage from "@/pages/Index";
import SearchPage from "@/pages/SearchPage";
import ChartsPage from "@/pages/ChartsPage";
import ArtistsPage from "@/pages/ArtistsPage";
import ArtistPage from "@/pages/ArtistPage";
import PlaylistsPage from "@/pages/PlaylistsPage";
import PlaylistPage from "@/pages/PlaylistPage";
import LikedSongsPage from "@/pages/LikedSongsPage";
import RecentPage from "@/pages/RecentPage";
import SongPage from "@/pages/SongPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/liked" element={<LikedSongsPage />} />
            <Route path="/recent" element={<RecentPage />} />
            <Route path="/song/:id" element={<SongPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
