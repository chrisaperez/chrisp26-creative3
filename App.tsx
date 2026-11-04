import { SpaceMono_700Bold, useFonts } from '@expo-google-fonts/space-mono';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HaulTrack, Track } from './src/types';
import { GENRES } from './src/genres'; 
import { FONT, ORANGE, GRAY } from './src/theme';
import { searchSongs } from './src/api';
import { pick, year, cover } from './src/utils';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  const [tab, setTab] = useState<'find' | 'haul'>('find');
  const [query, setQuery] = useState('jazz piano'); // what we search for (the genre buttons fill this in too)
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [genresAtEnd, setGenresAtEnd] = useState(false);  
  const [excavated, setExcavated] = useState<Track | null>(null); // the random song from EXCAVATE!
  const [haul, setHaul] = useState<HaulTrack[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);

  const list = useRef<FlatList<Track>>(null);
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [fontsLoaded, fontError] = useFonts({ SpaceMono_700Bold });

  // Let previews play even when the phone is on silent.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // Side effect: search iTunes whenever the search text changes (after a short pause in typing).
  useEffect(() => {
    const term = query.trim();
    setExcavated(null);
    setResults([]);
    setError(false);
    if (term.length < 2) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false; // so an old, slow answer never replaces a newer one
    const timer = setTimeout(async () => {
      try {
        const songs = await searchSongs(term);
        if (!cancelled) setResults(songs);
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Tap the song that is playing to stop it. Tap any other song to play it from the start.
  function playTrack(track: Track) {
    if (status.playing && nowPlaying?.trackId === track.trackId) {
      player.pause();
    } else {
      setNowPlaying(track);
      player.replace(track.previewUrl);
      player.play();
    }
  }

  function onGenreScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setGenresAtEnd(contentOffset.x + layoutMeasurement.width >= contentSize.width - 8);
  }

  // EXCAVATE!: search a random genre, grab one random song, show it at the top and play it.
  async function excavate() {
    try {
      const song = pick(await searchSongs(pick(pick(GENRES).seeds)));
      setExcavated(song);
      list.current?.scrollToOffset({ offset: 0 });
      playTrack(song); // if the search found nothing, song is undefined and this lands in catch
    } catch {
      Alert.alert("Couldn't find a song", 'Check your connection and try again.');
    }
  }

  const addToHaul = (song: Track) => setHaul([{ ...song, rating: 0 }, ...haul]);
  const remove = (id: number) => setHaul(haul.filter((t) => t.trackId !== id));
  // each tap: not rated -> 1 -> 2 -> 3 -> 4 -> 5 -> not rated
  const rate = (id: number) => setHaul(haul.map((t) => (t.trackId === id ? { ...t, rating: (t.rating + 1) % 6 } : t)));

  const playingId = status.playing ? nowPlaying?.trackId : undefined;
  const songs = excavated ? [excavated, ...results.filter((s) => s.trackId !== excavated.trackId)] : results;

  // the genre that shows up most in the haul
  const counts: Record<string, number> = {};
  haul.forEach((t) => (counts[t.primaryGenreName] = (counts[t.primaryGenreName] || 0) + 1));
  const topGenre = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '-';

  // what to show when the song list is empty
  let emptyMessage = 'NOTHING FOUND. TRY ANOTHER SEARCH.';
  if (query.trim().length < 2) emptyMessage = 'PICK A GENRE OR SEARCH TO START FINDING.';
  if (error) emptyMessage = "COULDN'T REACH ITUNES. TAP A GENRE OR EDIT YOUR SEARCH TO TRY AGAIN.";
  if (loading) emptyMessage = 'FINDING...';

  if (!fontsLoaded && !fontError) return null; // wait for the font (if it fails to load, carry on without it)

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />

        {tab === 'find' ? (
          <>
            <View style={styles.header}>
              <View style={styles.row}>
                <Text style={[styles.heading, { flex: 1 }]}>
                  MUSIC <Text style={styles.orange}>FINDER</Text>
                </Text>
                <Button label="EXCAVATE!" active onPress={excavate} />
              </View>

              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="SEARCH FOR ARTIST OR SONG..."
                placeholderTextColor={GRAY}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.genreWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onScroll={onGenreScroll}
                  scrollEventThrottle={16}
                  contentContainerStyle={styles.chips}
                >
                  <Text style={styles.label}>GENRE:</Text>
                  {GENRES.map((g) => (
                    <Button
                      key={g.name}
                      small
                      label={g.name.toUpperCase()}
                      active={g.seeds.includes(query)}
                      onPress={() => setQuery(pick(g.seeds.filter((s) => s !== query)))}
                    />
                  ))}
                </ScrollView>

                {!genresAtEnd && (
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(0,0,0,0)', '#000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.fade}
                  />
                )}
              </View>
              
            </View>

            <FlatList
              ref={list}
              data={songs}
              keyExtractor={(song) => String(song.trackId)}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
              renderItem={({ item }) => {
                const playing = playingId === item.trackId;
                const added = haul.some((t) => t.trackId === item.trackId);
                return (
                  <View style={[styles.card, playing && styles.playing]}>
                    {item.trackId === excavated?.trackId && <Text style={styles.badge}>EXCAVATED!</Text>}
                    <View style={styles.row}>
                      <Image source={cover(item)} style={styles.cover} />
                      <View style={styles.info}>
                        <Text style={styles.title} numberOfLines={2}>
                          {item.trackName}
                        </Text>
                        <Text style={styles.sub} numberOfLines={1}>
                          {item.artistName} · {year(item)}
                        </Text>
                      </View>
                      <View style={styles.buttons}>
                        <Button small label={playing ? 'STOP' : 'PLAY'} active={playing} onPress={() => playTrack(item)} />
                        <Button small label={added ? 'ADDED' : '+'} active={added} disabled={added} onPress={() => addToHaul(item)} />
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.haulTitle}>HAUL</Text>
              <Text style={styles.stat}>
                {haul.length} {haul.length === 1 ? 'TRACK' : 'TRACKS'} · TOP GENRE: {topGenre.toUpperCase()}
              </Text>
              <Text style={styles.label}>TAP A RATING (NR, 3/5...) TO CHANGE IT.</Text>
            </View>

            <FlatList
              data={haul}
              keyExtractor={(song) => String(song.trackId)}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.empty}>YOUR HAUL IS EMPTY.</Text>}
              ListFooterComponent={
                <View style={styles.footer}>
                  <Text style={styles.stat}>PICK MORE SONGS?</Text>
                  <Button label="BACK TO FIND" active onPress={() => setTab('find')} />
                </View>
              }
              renderItem={({ item }) => {
                const playing = playingId === item.trackId;
                return (
                  <View style={[styles.card, styles.row, { alignItems: 'flex-start' }, playing && styles.playing]}>
                    <Image source={cover(item)} style={styles.cover} />
                    <View style={styles.info}>
                      <View style={styles.row}>
                        <Text style={[styles.title, { flex: 1 }]} numberOfLines={2}>
                          {item.trackName}
                        </Text>
                        <Button small label={item.rating ? `${item.rating}/5` : 'NR'} active={item.rating > 0} onPress={() => rate(item.trackId)} />
                      </View>
                      <Text style={styles.genre}>{item.primaryGenreName.toUpperCase()}</Text>
                      <Text style={styles.sub} numberOfLines={1}>
                        {item.artistName} · {year(item)}
                      </Text>
                      <View style={styles.row}>
                        <Button small label={playing ? 'STOP' : 'PLAY'} active={playing} onPress={() => playTrack(item)} />
                        <Button small label="REMOVE" onPress={() => remove(item.trackId)} />
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          </>
        )}

        <View style={styles.nowPlaying}>
          <Text style={styles.nowText} numberOfLines={1}>
            NOW PLAYING: {nowPlaying ? `${nowPlaying.trackName} - ${nowPlaying.artistName}` : 'NOTHING YET'}
          </Text>
          {nowPlaying && <Button small label={status.playing ? 'STOP' : 'PLAY'} active={status.playing} onPress={() => playTrack(nowPlaying)} />}
        </View>

        <View style={styles.tabs}>
          <Button label="FIND" active={tab === 'find'} onPress={() => setTab('find')} style={styles.tab} />
          <Button label={`HAUL (${haul.length})`} active={tab === 'haul'} onPress={() => setTab('haul')} style={styles.tab} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// The one button style used everywhere: white outline, orange when active, flashes white when pressed.
function Button({ label, onPress, active, disabled, small, style }: {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, small && styles.small, active && styles.active, pressed && styles.pressed, style]}
    >
      {({ pressed }) => (
        <Text numberOfLines={1} style={[styles.buttonText, small && styles.smallText, (active || pressed) && styles.darkText]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

// Black, white and orange, no rounded corners.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, gap: 12, borderBottomWidth: 2, borderBottomColor: ORANGE },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { fontFamily: FONT, color: '#fff', fontSize: 22 },
  orange: { color: ORANGE },
  input: { height: 48, borderWidth: 1, borderColor: '#fff', paddingHorizontal: 12, fontFamily: FONT, fontSize: 14, color: '#fff' },
  genreWrap: { marginHorizontal: -16 }, // cancel the header's padding so the scroller runs edge to edge
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }, // put the padding back inside the scroll content
  fade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 48 },  label: { fontFamily: FONT, color: GRAY, fontSize: 12 },
  list: { padding: 16 },
  empty: { fontFamily: FONT, color: GRAY, fontSize: 13, textAlign: 'center', padding: 32 },
  card: { borderWidth: 2, borderColor: '#fff', padding: 8, marginBottom: 10 },
  playing: { borderColor: ORANGE },
  badge: { alignSelf: 'flex-start', marginBottom: 8, paddingHorizontal: 6, backgroundColor: ORANGE, fontFamily: FONT, fontSize: 11, color: '#000' },
  cover: { width: 64, height: 64, borderWidth: 2, borderColor: '#fff' },
  info: { flex: 1, gap: 4 },
  title: { fontFamily: FONT, color: '#fff', fontSize: 15 },
  sub: { fontFamily: FONT, color: GRAY, fontSize: 12 },
  genre: { fontFamily: FONT, color: ORANGE, fontSize: 12 },
  buttons: { width: 66, gap: 6 },
  haulTitle: { fontFamily: FONT, color: ORANGE, fontSize: 34 },
  stat: { fontFamily: FONT, color: '#fff', fontSize: 14 },
  footer: { alignItems: 'center', gap: 12, paddingTop: 12 },
  nowPlaying: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 12, borderTopWidth: 2, borderTopColor: ORANGE },
  nowText: { flex: 1, fontFamily: FONT, color: ORANGE, fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 8, padding: 8, borderTopWidth: 2, borderTopColor: '#fff' },
  tab: { flex: 1, paddingVertical: 12 },
  button: { borderWidth: 2, borderColor: '#fff', backgroundColor: '#000', paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  small: { borderWidth: 1, paddingVertical: 6, paddingHorizontal: 8 },
  active: { backgroundColor: ORANGE, borderColor: ORANGE },
  pressed: { backgroundColor: '#fff' },
  buttonText: { fontFamily: FONT, color: '#fff', fontSize: 15 },
  smallText: { fontSize: 12 },
  darkText: { color: '#000' },
});
