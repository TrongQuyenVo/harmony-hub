import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import MusicCard from "@/components/MusicCard";
import { fetchTrendingSongs, fetchVietnameseChart, fetchChineseChart } from "@/services/musicApi";
import { Song } from "@/types/music";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ChartTab = "global" | "viet" | "chinese";

export default function ChartsPage() {
  const [tab, setTab] = useState<ChartTab>("global");
  const [songs, setSongs] = useState<Record<ChartTab, Song[]>>({ global: [], viet: [], chinese: [] });
  const [loading, setLoading] = useState<Record<ChartTab, boolean>>({ global: true, viet: true, chinese: true });

  useEffect(() => {
    fetchTrendingSongs().then((s) => {
      setSongs(prev => ({ ...prev, global: s }));
      setLoading(prev => ({ ...prev, global: false }));
    });
    fetchVietnameseChart().then((s) => {
      setSongs(prev => ({ ...prev, viet: s }));
      setLoading(prev => ({ ...prev, viet: false }));
    });
    fetchChineseChart().then((s) => {
      setSongs(prev => ({ ...prev, chinese: s }));
      setLoading(prev => ({ ...prev, chinese: false }));
    });
  }, []);

  const renderList = (key: ChartTab) => {
    if (loading[key]) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (songs[key].length === 0) {
      return <p className="text-muted-foreground text-center py-10">Không tìm thấy bài hát nào.</p>;
    }
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {songs[key].map((song, i) => (
          <MusicCard key={song.id} song={song} queue={songs[key]} index={i} variant="row" />
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Top Charts</h1>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as ChartTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="global">🌍 Global</TabsTrigger>
            <TabsTrigger value="viet">🇻🇳 Nhạc Việt</TabsTrigger>
            <TabsTrigger value="chinese">🇨🇳 Nhạc Trung</TabsTrigger>
          </TabsList>
          <TabsContent value="global">{renderList("global")}</TabsContent>
          <TabsContent value="viet">{renderList("viet")}</TabsContent>
          <TabsContent value="chinese">{renderList("chinese")}</TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
