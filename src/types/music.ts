export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  cover: string;
  preview: string; // 30s preview URL
  duration: number;
  plays: number;
  liked?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  bio: string;
  followers: number;
  topSongs: Song[];
  albums: Album[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  cover: string;
  year: number;
  songs: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: string;
  songs: Song[];
  createdAt: string;
  isPublic: boolean;
}

export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}
