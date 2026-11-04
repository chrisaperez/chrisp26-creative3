import { Track } from './types';

export async function searchSongs(term: string): Promise<Track[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=50`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results.filter((song: Track) => song.previewUrl && song.releaseDate);
}