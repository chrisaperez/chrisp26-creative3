// One song from the iTunes Search API
export type Track = {
  trackId: number;
  trackName: string;
  artistName: string;
  primaryGenreName: string;
  releaseDate: string;
  artworkUrl100: string;
  previewUrl: string;
};
export type HaulTrack = Track & { rating: number }; // rating 0 = not rated