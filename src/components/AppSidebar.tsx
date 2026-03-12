import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Search, BarChart3, Users, ListMusic, Library, Heart,
  Clock, ChevronLeft, ChevronRight, Menu, X, Music2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/stores/libraryStore";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const mainNav = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Discover", icon: Search, path: "/search" },
  { label: "Charts", icon: BarChart3, path: "/charts" },
  { label: "Artists", icon: Users, path: "/artists" },
];

const libraryNav = [
  { label: "Playlists", icon: ListMusic, path: "/playlists" },
  { label: "Liked Songs", icon: Heart, path: "/liked" },
  { label: "Recently Played", icon: Clock, path: "/recent" },
];

export default function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { playlists } = useLibraryStore();

  const handleNav = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  const content = (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
          <Music2 className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-bold text-foreground"
          >
            Melodify
          </motion.span>
        )}
      </div>

      {/* Main nav */}
      <nav className="px-2 py-4 space-y-1">
        {mainNav.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Library */}
      <div className="px-2 py-2">
        <div className="px-3 py-2">
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Library
            </span>
          )}
        </div>
        <div className="space-y-1">
          {libraryNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* User playlists */}
      {!collapsed && playlists.length > 0 && (
        <div className="px-2 py-2 mt-2 border-t border-sidebar-border flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Playlists
            </span>
          </div>
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => handleNav(`/playlist/${pl.id}`)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            >
              <ListMusic className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{pl.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Collapse toggle */}
      <div className="hidden md:flex px-2 py-3 border-t border-sidebar-border">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-full border-r border-sidebar-border transition-all duration-300 flex-shrink-0",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {content}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] z-50 md:hidden"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
