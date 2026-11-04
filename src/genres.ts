// iTunes searches by text, so each genre button is linked to a few search phrases.
// The first 6 genres show right away; the rest appear after tapping "+".
export const GENRES = [
  { name: 'Pop', seeds: ['pop hits', 'dua lipa', 'carly rae jepsen', 'the weeknd'] },
  { name: 'R&B', seeds: ['rnb', 'neo soul', 'erykah badu', 'sade', 'aaliyah', 'brandy'] },
  { name: 'Jazz', seeds: ['jazz piano', 'miles davis', 'bill evans', 'chet baker'] },
  { name: 'Funk', seeds: ['funk classics', 'james brown', 'herbie hancock', 'vulfpeck'] },
  { name: 'City Pop', seeds: ['city pop', 'tatsuro yamashita', 'mariya takeuchi', 'takako mamiya'] },
  { name: 'Regional', seeds: ['corridos', 'k-pop', 'afrobeats', 'bossa nova', 'reggaeton'] },
  { name: 'Soul', seeds: ['stevie wonder', 'marvin gaye', 'aretha franklin', 'al green'] },
  { name: 'Hip-Hop', seeds: ['hip-hop', 'a tribe called quest', 'j dilla', 'kendrick lamar', 'nas'] },
  { name: 'Lo-Fi', seeds: ['lofi hip hop', 'nujabes', 'lo-fi beats', 'tomppabeats'] },
  { name: 'Rock', seeds: ['classic rock', 'fleetwood mac', 'led zeppelin', 'radiohead'] },
  { name: 'Electronic', seeds: ['daft punk', 'justice', 'four tet', 'synthwave'] },
  { name: 'Blues', seeds: ['bb king', 'muddy waters', 'etta james', 'howlin wolf'] },
];