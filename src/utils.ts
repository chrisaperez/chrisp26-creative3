import { Track } from './types';

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const year = (song: Track) => song.releaseDate.slice(0, 4);
const cover = (song: Track) => ({ uri: song.artworkUrl100.replace('100x100', '200x200') });

export { pick, year, cover };