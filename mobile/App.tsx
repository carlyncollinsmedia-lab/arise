// Arise: first-time setup and the real wake-up alarm (build steps 1 and 2).
// Setup order follows PRD section 4: notice, companion, support country,
// alarm time and days, evening time. Settings are saved on the phone first.
// Morning check-in (build step 3): smiley-face moods, optional note, a pep talk
// from the generate-affirmation function (Claude) with a local fallback, and
// read-aloud. The account (sign-in) screen comes once the sign-in method is decided.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, PressableProps, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Storage from 'expo-sqlite/kv-store';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import Svg, { Circle, Path } from 'react-native-svg';

import AriseAlarm, { AlarmPermission } from './modules/arise-alarm';

type Companion = 'woman' | 'man' | 'none';

// Colour themes (owner request, 30 Sep): the original night blue plus three that
// match the sunrise look, one of them light. Each keeps text contrast readable.
type Theme = { name: string; dark: boolean; bg: string; card: string; selectedCard: string; control: string; line: string; ink: string; muted: string; accent: string; onAccent: string; warn: string; offSwitch: string };
const THEMES = {
  night: { name: 'Night sky', dark: true, bg: '#0B1530', card: '#13224A', selectedCard: '#1B2C5C', control: '#22346A', line: 'rgba(255,255,255,0.14)', ink: '#F5F7FC', muted: '#C3CCE0', accent: '#F9C45A', onAccent: '#1A2340', warn: '#FFB4A2', offSwitch: '#3A4A78' },
  plum: { name: 'Plum dawn', dark: true, bg: '#1C1030', card: '#2B1A45', selectedCard: '#3A2459', control: '#442C66', line: 'rgba(255,255,255,0.14)', ink: '#F8F3FC', muted: '#D4C6E7', accent: '#F9C45A', onAccent: '#241338', warn: '#FFB4A2', offSwitch: '#56407A' },
  forest: { name: 'Forest morning', dark: true, bg: '#0D1F18', card: '#163228', selectedCard: '#1E4235', control: '#24503F', line: 'rgba(255,255,255,0.14)', ink: '#F2F8F4', muted: '#C3DACE', accent: '#F2B84B', onAccent: '#10231B', warn: '#FFB4A2', offSwitch: '#35604F' },
  sand: { name: 'Warm sand', dark: false, bg: '#F7F0E5', card: '#FFFFFF', selectedCard: '#FCE9DA', control: '#EFE2D0', line: 'rgba(60,40,20,0.16)', ink: '#2A1E14', muted: '#6B5A48', accent: '#B4531F', onAccent: '#FFFFFF', warn: '#A3321A', offSwitch: '#D8C8B4' },
} satisfies Record<string, Theme>;
type ThemeKey = keyof typeof THEMES;

type Settings = {
  noticeAccepted: boolean;
  setupComplete: boolean;
  theme: ThemeKey;
  companion: Companion;
  country: string;
  alarm: { hour: number; minute: number; days: number[] };
  evening: { hour: number; minute: number };
  readAloud: boolean;
  reminderTextOnLockScreen: boolean;
  city: City | null;
};
type City = { name: string; label: string; lat: number; lon: number };

const DEFAULTS: Settings = {
  noticeAccepted: false,
  setupComplete: false,
  theme: 'night',
  companion: 'woman',
  country: '',
  alarm: { hour: 6, minute: 0, days: [1, 2, 3, 4, 5] },
  evening: { hour: 20, minute: 0 },
  readAloud: false,
  reminderTextOnLockScreen: false,
  city: null,
};
const KEY = 'arise.settings.v1';
const STEPS = ['notice', 'companion', 'colours', 'country', 'city', 'alarm', 'evening'] as const;
type Step = (typeof STEPS)[number] | 'home' | 'mood' | 'pepTalk' | 'day' | 'evening-checkin' | 'history' | 'reminders' | 'settings';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COUNTRIES = ['Canada', 'Nigeria', 'United Kingdom', 'United States', 'Other'];
const IMAGES = {
  woman: require('./assets/companions/woman-light.webp'),
  man: require('./assets/companions/man-light.webp'),
  scene: require('./assets/companions/bg-sunrise.jpg'),
};
type Outfit = 'light' | 'layers' | 'warm' | 'winter' | 'waterproof';
const OUTFITS: Record<'woman' | 'man', Record<Outfit, number>> = {
  woman: { light: require('./assets/companions/woman-light.webp'), layers: require('./assets/companions/woman-layers.webp'), warm: require('./assets/companions/woman-warm.webp'), winter: require('./assets/companions/woman-winter.webp'), waterproof: require('./assets/companions/woman-waterproof.webp') },
  man: { light: require('./assets/companions/man-light.webp'), layers: require('./assets/companions/man-layers.webp'), warm: require('./assets/companions/man-warm.webp'), winter: require('./assets/companions/man-winter.webp'), waterproof: require('./assets/companions/man-waterproof.webp') },
};
const SCENES = {
  sunrise: require('./assets/companions/bg-sunrise.jpg'), summer: require('./assets/companions/bg-summer.jpg'), fall: require('./assets/companions/bg-fall.jpg'),
  winter: require('./assets/companions/bg-winter.jpg'), rain: require('./assets/companions/bg-rain.jpg'),
};

// ---------- Weather and what to wear (PRD F09/F10, TECHNICAL-NOTES "Weather") ----------
// Open-Meteo: free, no key. Cached for 60 minutes; after 3 hours without a refresh
// the forecast counts as stale and we give no outfit advice rather than guess.
type Weather = { fetchedAt: number; tempNow: number; codeNow: number; minFeels: number; maxRainChance: number | null; maxGust: number | null; rainy: boolean; snowy: boolean };
type DayBrief = { weather: Weather; stale: boolean; outfit: Outfit | null; outfitText: string; umbrellaText: string; scene: keyof typeof SCENES; description: string };
const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
const SNOW_CODES = [71, 73, 75, 77, 85, 86];
function describe(code: number) {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms';
}
async function searchCities(name: string): Promise<City[]> {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&name=${encodeURIComponent(name)}`);
  const body = await res.json();
  return (body.results ?? []).map((r: any) => ({ name: r.name, label: [r.name, r.admin1, r.country].filter(Boolean).join(', '), lat: r.latitude, lon: r.longitude }));
}
async function getWeather(city: City): Promise<Weather | null> {
  const cacheKey = `arise.weather.${city.lat.toFixed(2)},${city.lon.toFixed(2)}`;
  const cached: Weather | null = JSON.parse(Storage.getItemSync(cacheKey) ?? 'null');
  if (cached && Date.now() - cached.fetchedAt < 60 * 60e3) return cached;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code` +
      `&hourly=apparent_temperature,precipitation_probability,wind_gusts_10m,weather_code&forecast_hours=12&timezone=auto`;
    const b = await (await fetch(url)).json();
    const h = b.hourly;
    const nums = (xs: (number | null)[]) => xs.filter((x): x is number => typeof x === 'number');
    const rain = nums(h.precipitation_probability), gust = nums(h.wind_gusts_10m), codes: number[] = h.weather_code;
    const w: Weather = {
      fetchedAt: Date.now(),
      tempNow: b.current.temperature_2m,
      codeNow: b.current.weather_code,
      minFeels: Math.min(...nums(h.apparent_temperature)),
      maxRainChance: rain.length ? Math.max(...rain) : null, // missing is "unavailable", never zero
      maxGust: gust.length ? Math.max(...gust) : null,
      rainy: codes.some((c) => RAIN_CODES.includes(c)),
      snowy: codes.some((c) => SNOW_CODES.includes(c)),
    };
    Storage.setItemSync(cacheKey, JSON.stringify(w));
    return w;
  } catch {
    return cached; // offline: use the last forecast, marked stale if old
  }
}
function brief(w: Weather): DayBrief {
  const stale = Date.now() - w.fetchedAt > 3 * 60 * 60e3;
  const rainLikely = w.rainy || (w.maxRainChance ?? 0) >= 40;
  const windy = (w.maxGust ?? 0) >= 40;
  const base: Outfit = w.minFeels < 0 ? 'winter' : w.minFeels < 10 ? 'warm' : w.minFeels < 20 ? 'layers' : 'light';
  const outfit: Outfit = rainLikely && base !== 'winter' ? 'waterproof' : base;
  const words: Record<Outfit, string> = { winter: 'Dress for winter', warm: 'Wear something warm', layers: 'Wear layers', light: 'Dress light', waterproof: 'Waterproof jacket' };
  const umbrellaText = w.maxRainChance === null && !w.rainy ? 'Rain chance unavailable'
    : rainLikely ? (windy ? 'Rain and strong wind: a hood beats an umbrella' : 'Take an umbrella') : 'No umbrella needed';
  const scene: keyof typeof SCENES = w.snowy || base === 'winter' ? 'winter' : rainLikely ? 'rain' : base === 'light' ? 'summer' : 'fall';
  return { weather: w, stale, outfit: stale ? null : outfit, outfitText: stale ? 'Forecast is out of date, so no outfit advice' : words[outfit] + (rainLikely && base !== 'light' && outfit === 'waterproof' ? ' and layers' : ''), umbrellaText: stale ? 'Check the sky before you go' : umbrellaText, scene: stale ? 'sunrise' : scene, description: describe(w.codeNow) };
}

function fmt(hour: number, minute: number) {
  const h = hour % 12 || 12;
  return `${h}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

function daysText(days: number[]) {
  const key = [...days].sort().join();
  if (key === '0,1,2,3,4,5,6') return 'every day';
  if (key === '1,2,3,4,5') return 'weekdays';
  if (key === '0,6') return 'weekends';
  return [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_NAMES[d].slice(0, 3)).join(', ');
}

// ---------- Morning check-in ----------
type Mood = 'rough' | 'low' | 'okay' | 'good' | 'great';
type Outcome = 'done' | 'partly' | 'not_done';
type Entry = {
  date: string; mood: Mood | null; note: string; changes: number; affirmation: string; status: '' | 'generated' | 'fallback' | 'crisis';
  intention?: string; outcome?: Outcome | null; evening?: Mood | null;
};
type Reminder = { id: string; text: string; at: number; notificationId: string };
const MOODS: { key: Mood; label: string; fill: string }[] = [
  { key: 'rough', label: 'Rough', fill: '#6B7FA8' },
  { key: 'low', label: 'Low', fill: '#7FA8E0' },
  { key: 'okay', label: 'Okay', fill: '#B9C6E4' },
  { key: 'good', label: 'Good', fill: '#F2D27A' },
  { key: 'great', label: 'Great', fill: '#F9C45A' },
];
// Reviewed fallbacks, the same text as the function's and the database's. Never pretend to have read the note.
const FALLBACKS: Record<Mood, string> = {
  rough: 'Some mornings are heavy, and this sounds like one of them. You do not have to fix the whole day right now. Take the next small step, then the one after that. That is enough for today.',
  low: 'It is okay to start slowly. You showed up and checked in, and that counts. Be as kind to yourself this morning as you would be to a friend.',
  okay: 'An okay morning is a steady place to start. Pick one thing that matters today and give it your best attention. Let the rest take care of itself.',
  good: 'You are starting from a good place today. Carry that energy into the first thing you do. Notice what is going right and let it build.',
  great: 'What a way to start the day. Put that energy somewhere it counts. Share a little of it with someone who needs it.',
};
const CRISIS = /(kill myself|end my life|suicid|self[- ]?harm|hurt myself|don'?t want to (live|be here)|want to die|end it all)/i;
const HELP_LINE: Record<string, string> = { Canada: 'Call or text 9-8-8 (Suicide Crisis Helpline)' };

// The phone's local date: the entry keeps this date even when travelling (PRD).
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function loadEntry(): Entry {
  const saved = Storage.getItemSync(`arise.entry.${today()}`);
  return saved ? JSON.parse(saved) : { date: today(), mood: null, note: '', changes: 0, affirmation: '', status: '' };
}
function saveEntry(e: Entry) {
  Storage.setItemSync(`arise.entry.${e.date}`, JSON.stringify(e));
}
function allEntries(): Entry[] {
  return Storage.getAllKeysSync()
    .filter((k) => k.startsWith('arise.entry.'))
    .map((k) => JSON.parse(Storage.getItemSync(k)!) as Entry)
    .filter((e) => e.mood || e.evening)
    .sort((a, b) => b.date.localeCompare(a.date));
}
function loadReminders(): Reminder[] {
  return JSON.parse(Storage.getItemSync('arise.reminders') ?? '[]');
}
function saveReminders(list: Reminder[]) {
  Storage.setItemSync('arise.reminders', JSON.stringify(list));
}
const rank = (m?: Mood | null) => MOODS.findIndex((x) => x.key === m);

// PRD F13: one honest line for the week. Only days with both moods are compared;
// a missing mood is never treated as low.
function weekLine(entries: Entry[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const since = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  const week = entries.filter((e) => e.date >= since);
  const both = week.filter((e) => e.mood && e.evening);
  const higher = both.filter((e) => rank(e.evening) > rank(e.mood)).length;
  return `This week: ${week.filter((e) => e.mood).length} mornings checked in, ${week.filter((e) => e.evening).length} evenings. Ended higher than you started on ${higher} of the ${both.length} days with both.`;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});
async function notificationsAllowed() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return asked.granted;
}
// The evening check-in is a plain daily notification with generic text (PRD F12, privacy).
async function scheduleEvening(hour: number, minute: number) {
  const old = Storage.getItemSync('arise.eveningNotification');
  if (old) await Notifications.cancelScheduledNotificationAsync(old).catch(() => {});
  if (!(await notificationsAllowed())) return;
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: 'Arise', body: 'How did your day go? One tap to check in.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  Storage.setItemSync('arise.eveningNotification', id);
}

// Ask Claude (through our Supabase function) for today's pep talk, with the PRD's 8-second limit.
async function fetchPepTalk(mood: Mood, note: string): Promise<{ text: string; status: Entry['status'] }> {
  if (note && CRISIS.test(note)) return { text: '', status: 'crisis' };
  const url = process.env.EXPO_PUBLIC_AFFIRMATION_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { text: FALLBACKS[mood], status: 'fallback' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ mood, note }),
    });
    const body = await res.json();
    if (body.source === 'claude') return { text: body.affirmation, status: 'generated' };
    if (body.source === 'needs_support') return { text: '', status: 'crisis' };
    return { text: body.affirmation || FALLBACKS[mood], status: 'fallback' };
  } catch {
    return { text: FALLBACKS[mood], status: 'fallback' };
  } finally {
    clearTimeout(timer);
  }
}

// Every button gives a light tap vibration so you feel that it was pressed
// (owner request, 30 Sep). iPhones skip it if vibration is off in Settings.
function Tap({ onPress, ...rest }: PressableProps) {
  return (
    <Pressable {...rest} onPress={(e) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress?.(e); }} />
  );
}

// The approved smiley faces (design.html), one per mood.
function Face({ mood, size = 44 }: { mood: Mood; size?: number }) {
  const fill = MOODS.find((m) => m.key === mood)!.fill;
  const line = { fill: 'none', stroke: '#1A2340', strokeWidth: 2.4, strokeLinecap: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Circle cx={20} cy={20} r={18} fill={fill} />
      <Circle cx={14} cy={16.5} r={2.2} fill="#1A2340" />
      <Circle cx={26} cy={16.5} r={2.2} fill="#1A2340" />
      {mood === 'rough' && (<><Path d="M10.5 13.8l6-1.8M29.5 13.8l-6-1.8" {...line} /><Path d="M13 29c3.5-4.5 10.5-4.5 14 0" {...line} /></>)}
      {mood === 'low' && <Path d="M14 28c3-2.5 9-2.5 12 0" {...line} />}
      {mood === 'okay' && <Path d="M14 26.5h12" {...line} />}
      {mood === 'good' && <Path d="M13.5 24.5c3.5 3.5 9.5 3.5 13 0" {...line} />}
      {mood === 'great' && (<><Path d="M12 23h16c0 5-3.6 8-8 8s-8-3-8-8z" fill="#1A2340" /><Path d="M15.5 27.5c2.8 2 6.2 2 9 0" fill="none" stroke="#E86B5A" strokeWidth={2.2} strokeLinecap="round" /></>)}
    </Svg>
  );
}

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [step, setStep] = useState<Step>('notice');
  const [permission, setPermission] = useState<AlarmPermission>('notDetermined');
  const [message, setMessage] = useState('');
  const [entry, setEntry] = useState<Entry>(loadEntry);
  const [writing, setWriting] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [day, setDay] = useState<DayBrief | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [returnTo, setReturnTo] = useState<Step>('home'); // where to go after changing one setting
  const [cityResults, setCityResults] = useState<City[] | null>(null);

  // Load the day brief when the day screen opens.
  useEffect(() => {
    if (step !== 'day' || !settings?.city) return;
    getWeather(settings.city).then((w) => setDay(w ? brief(w) : null));
  }, [step, settings?.city]);

  useEffect(() => {
    const saved = Storage.getItemSync(KEY);
    const s: Settings = saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    setSettings(s);
    if (saved && s.noticeAccepted && s.country) s.setupComplete = true; // settings saved before this flag existed
    setStep(s.setupComplete ? 'home' : 'notice');
    setPermission(AriseAlarm.authorizationState());
  }, []);

  const styles = useMemo(() => makeStyles(THEMES[settings?.theme ?? 'night']), [settings?.theme]);
  if (!settings) return <View style={styles.screen} />;

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    Storage.setItemSync(KEY, JSON.stringify(next));
  };
  // During first-time setup, go to the next screen; when changing one thing later, go back home.
  const nextStep = () => setStep(settings.setupComplete ? returnTo : STEPS[STEPS.indexOf(step as (typeof STEPS)[number]) + 1] ?? 'home');
  // Open one setup screen to change it, then come back to where the person was.
  const change = (target: Step, from: Step) => { setReturnTo(from); setMessage(''); setStep(target); };

  const updateEntry = (patch: Partial<Entry>) => {
    const next = { ...entry, ...patch };
    setEntry(next);
    saveEntry(next);
    return next;
  };

  function stopSpeaking() {
    Speech.stop();
    setSpeaking(false);
  }
  function speak(text: string) {
    Speech.stop();
    setSpeaking(true);
    Speech.speak(text, { rate: 0.92, onDone: () => setSpeaking(false), onStopped: () => setSpeaking(false), onError: () => setSpeaking(false) });
  }

  // Tapping a mood saves it at once. The first change after a pep talk gets a new
  // one; later changes keep the pep talk (each new one costs money).
  function pickMood(mood: Mood) {
    if (entry.mood === mood) return;
    if (entry.affirmation) {
      const changes = entry.changes + 1;
      updateEntry(changes <= 1 ? { mood, changes, affirmation: '', status: '' } : { mood, changes });
    } else {
      updateEntry({ mood });
    }
  }

  async function continueToPepTalk() {
    setStep('pepTalk');
    let current = entry;
    if (!current.affirmation && current.status !== 'crisis') {
      setWriting(true);
      const result = await fetchPepTalk(current.mood!, current.note.trim());
      setWriting(false);
      current = updateEntry({ affirmation: result.text, status: result.status });
    }
    if (settings!.readAloud && current.affirmation) speak(current.affirmation);
  }

  // Replace whatever alarm is set with the one in settings. The phone is the truth.
  async function applyAlarm(s: Settings) {
    let state = AriseAlarm.authorizationState();
    if (state !== 'authorized') state = await AriseAlarm.requestAuthorization();
    setPermission(state);
    if (state !== 'authorized') {
      setMessage('Alarms are blocked. Turn them on in Settings → Arise, then come back.');
      return false;
    }
    AriseAlarm.cancelAll();
    await AriseAlarm.scheduleWeekly(s.alarm.hour, s.alarm.minute, s.alarm.days);
    setMessage('');
    return true;
  }

  const content = (() => {
    switch (step) {
      case 'notice':
        return (
          <Card title="Welcome to Arise" subtitle="Before we start, please read this.">
            <Text style={styles.body}>
              Arise is for motivation and a morning routine. It is not a health, counselling or crisis service, and
              nobody reads your entries.
            </Text>
            <Text style={styles.body}>
              Your morning words are written by an AI service from the mood you choose and any note you add. Your
              moods and notes are private to you, and you can delete them at any time.
            </Text>
            <Primary label="I understand" onPress={() => { update({ noticeAccepted: true }); nextStep(); }} />
          </Card>
        );
      case 'companion':
        return (
          <Card title="Choose your companion" subtitle="Who greets you each morning? You can change this later.">
            <View style={styles.row}>
              {(['woman', 'man', 'none'] as Companion[]).map((c) => (
                <Choice key={c} selected={settings.companion === c} onPress={() => update({ companion: c })}
                  label={c === 'none' ? 'No companion' : c === 'woman' ? 'Woman' : 'Man'}>
                  {c === 'none' ? <View style={[styles.thumb, styles.noThumb]} /> : <Image source={IMAGES[c]} style={styles.thumb} />}
                </Choice>
              ))}
            </View>
            <Primary label="Continue" onPress={nextStep} />
          </Card>
        );
      case 'colours':
        return (
          <Card title="Pick your colours" subtitle="Choose the look you like. You can change it any time.">
            {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
              const t = THEMES[k];
              return (
                <Choice key={k} wide selected={settings.theme === k} onPress={() => update({ theme: k })} label={t.name}>
                  <View style={styles.swatches}>
                    {[t.bg, t.card, t.accent].map((c) => <View key={c} style={[styles.swatch, { backgroundColor: c }]} />)}
                  </View>
                </Choice>
              );
            })}
            <Primary label="Continue" onPress={nextStep} />
          </Card>
        );
      case 'country':
        return (
          <Card title="Where do you live?" subtitle="So “Get support” shows the right help line for your country.">
            {COUNTRIES.map((c) => (
              <Choice key={c} wide selected={settings.country === c} onPress={() => update({ country: c })} label={c} />
            ))}
            <Primary label="Continue" disabled={!settings.country} onPress={nextStep} />
          </Card>
        );
      case 'city':
        return (
          <Card title="Your town or city" subtitle="For today's weather, what to wear, and whether to take an umbrella.">
            <TextInput value={cityQuery} onChangeText={setCityQuery} placeholder="e.g. Edmonton or Lagos" autoCorrect={false}
              placeholderTextColor={THEMES[settings.theme].muted} style={[styles.note, { minHeight: 0 }]} accessibilityLabel="Town or city"
              returnKeyType="search" onSubmitEditing={async () => setCityResults(await searchCities(cityQuery).catch(() => []))} />
            <Secondary label="Search" onPress={async () => setCityResults(await searchCities(cityQuery).catch(() => []))} />
            {cityResults && cityResults.length === 0 ? <Text style={styles.small}>No places found. Check the spelling, or try a bigger town nearby.</Text> : null}
            {cityResults?.map((c) => (
              <Choice key={`${c.lat},${c.lon}`} wide label={c.label} selected={settings.city?.label === c.label} onPress={() => update({ city: c })} />
            ))}
            {settings.city ? <Text style={styles.small}>Chosen: {settings.city.label}</Text> : null}
            <Primary label="Continue" disabled={!settings.city} onPress={nextStep} />
            {!settings.city ? <Secondary label="Skip for now" onPress={nextStep} /> : null}
          </Card>
        );
      case 'alarm':
        return (
          <Card title="Your wake-up alarm" subtitle="What time should Arise wake you up?">
            <TimePicker hour={settings.alarm.hour} minute={settings.alarm.minute}
              onChange={(hour, minute) => update({ alarm: { ...settings.alarm, hour, minute } })} />
            <Text style={styles.label}>Which days?</Text>
            <View style={styles.row}>
              {DAY_LETTERS.map((l, d) => {
                const on = settings.alarm.days.includes(d);
                return (
                  <Tap key={d} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={DAY_NAMES[d]}
                    onPress={() => update({ alarm: { ...settings.alarm, days: on ? settings.alarm.days.filter((x) => x !== d) : [...settings.alarm.days, d] } })}
                    style={[styles.day, on && styles.selected]}>
                    <Text style={styles.dayText}>{l}</Text>
                  </Tap>
                );
              })}
            </View>
            <Toggle label="Read my pep talk out loud" hint="Helpful if you can't see the screen well."
              on={settings.readAloud} onPress={() => update({ readAloud: !settings.readAloud })} />
            {message ? <Text style={styles.warn}>{message}</Text> : null}
            <Primary label="Set my alarm" disabled={settings.alarm.days.length === 0}
              onPress={async () => { if (await applyAlarm(settings)) nextStep(); }} />
          </Card>
        );
      case 'evening':
        return (
          <Card title="Evening check-in" subtitle="When should Arise ask how your day went?">
            <TimePicker hour={settings.evening.hour} minute={settings.evening.minute}
              onChange={(hour, minute) => update({ evening: { hour, minute } })} />
            <Primary label={settings.setupComplete ? 'Save' : 'Finish setup'} onPress={() => {
              const wasComplete = settings.setupComplete;
              update({ setupComplete: true });
              scheduleEvening(settings.evening.hour, settings.evening.minute);
              setStep(wasComplete ? returnTo : 'home');
            }} />
          </Card>
        );
      case 'mood':
        return (
          <Card title="How are you this morning?" subtitle="One tap. It saves straight away.">
            <View style={styles.moodRow} accessibilityRole="radiogroup">
              {MOODS.map((m) => {
                const on = entry.mood === m.key;
                return (
                  <Tap key={m.key} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={m.label}
                    onPress={() => pickMood(m.key)} style={[styles.mood, on && styles.selected]}>
                    <Face mood={m.key} />
                    <Text style={styles.moodText}>{m.label}</Text>
                  </Tap>
                );
              })}
            </View>
            {entry.mood ? <Text style={styles.small} accessibilityLiveRegion="polite">Saved.</Text> : null}
            <Text style={styles.label}>Anything on your mind? (optional)</Text>
            <TextInput value={entry.note} onChangeText={(note) => updateEntry({ note: note.slice(0, 280) })}
              placeholder="e.g. Big meeting at 10" placeholderTextColor={THEMES[settings.theme].muted}
              multiline maxLength={280} style={styles.note} accessibilityLabel="Anything on your mind? Optional note" />
            <Text style={styles.small}>Only you can see this. {entry.note.length} / 280</Text>
            {entry.changes > 1 ? <Text style={styles.small}>You can change your mood, but today's pep talk stays the same.</Text> : null}
            <Primary label="Continue" disabled={!entry.mood} onPress={continueToPepTalk} />
          </Card>
        );
      case 'pepTalk': {
        const m = MOODS.find((x) => x.key === entry.mood);
        return (
          <View>
            <Text style={styles.title} accessibilityRole="header">For this morning</Text>
            {m ? (
              <Tap style={styles.chip} onPress={() => { stopSpeaking(); setStep('mood'); }} accessibilityRole="button"
                accessibilityLabel={`Your mood today is ${m.label}. Tap to change it.`}>
                <Face mood={m.key} size={28} />
                <Text style={styles.chipText}>Today: {m.label}  <Text style={styles.link}>Change</Text></Text>
              </Tap>
            ) : null}
            {entry.note ? <Text style={styles.small}>You wrote: “{entry.note}”</Text> : null}
            <View style={styles.bubble} accessibilityLiveRegion="polite">
              {writing ? (
                <Text style={styles.bubbleText}>Your companion is writing your words for this morning…</Text>
              ) : entry.status === 'crisis' ? (
                <>
                  <Text style={styles.bubbleText}>Thank you for telling Arise how you are. It sounds like things are really hard right now, and you deserve support from a person.</Text>
                  <Text style={[styles.bubbleText, { fontWeight: '800', marginTop: 10 }]}>{HELP_LINE[settings.country] ?? 'Please call your local emergency number or someone you trust.'}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bubbleText}>{entry.affirmation}</Text>
                  <Text style={styles.tag}>{entry.status === 'generated' ? 'Written for you this morning' : 'General message'}</Text>
                </>
              )}
            </View>
            {!writing && entry.affirmation ? (
              <Secondary label={speaking ? '■ Stop' : '🔊 Read it to me'} onPress={() => (speaking ? stopSpeaking() : speak(entry.affirmation))} />
            ) : null}
            <Text style={styles.label}>Today's intention (optional)</Text>
            <TextInput value={entry.intention ?? ''} onChangeText={(t) => updateEntry({ intention: t.slice(0, 120) })}
              placeholder="One line for today" placeholderTextColor={THEMES[settings.theme].muted} maxLength={120}
              style={[styles.note, { minHeight: 0 }]} accessibilityLabel="Today's intention, optional" />
            <Primary label="See my day  ›" onPress={() => { stopSpeaking(); setStep('day'); }} />
          </View>
        );
      }
      case 'day': {
        const companion = settings.companion;
        return (
          <View>
            <Text style={styles.title} accessibilityRole="header">Ready for your day.</Text>
            <Text style={styles.small}>{new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            <View style={[styles.sceneWrap, { height: 260, marginTop: 12 }]}>
              <Image source={SCENES[day?.scene ?? 'sunrise']} style={styles.scene} />
              {companion !== 'none' ? <Image source={OUTFITS[companion][day?.outfit ?? 'light']} style={[styles.companion, { height: 240 }]}
                accessibilityLabel="Your companion dressed for today's weather" /> : null}
            </View>
            {!settings.city ? (
              <>
                <Text style={styles.body}>Add your town or city to see today's weather and what to wear.</Text>
                <Secondary label="Add my city" onPress={() => change('city', 'day')} />
              </>
            ) : !day ? (
              <Text style={styles.body}>Getting today's weather for {settings.city.name}…</Text>
            ) : (
              <>
                <View style={styles.weatherCard} accessibilityLabel={`${settings.city.name}: ${Math.round(day.weather.tempNow)} degrees, ${day.description}.`}>
                  <Text style={styles.weatherCity}>{settings.city.name}</Text>
                  <Text style={styles.weatherTemp}>{Math.round(day.weather.tempNow)}°</Text>
                  <Text style={styles.weatherDesc}>{day.description}</Text>
                  <Text style={styles.weatherSrc}>{day.stale ? 'Out of date · ' : ''}Updated {new Date(day.weather.fetchedAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}</Text>
                </View>
                <View style={[styles.row, { marginTop: 12 }]}>
                  <View style={styles.tile}><Text style={styles.tileIcon}>🧥</Text><Text style={styles.tileText}>{day.outfitText}</Text></View>
                  <View style={styles.tile}><Text style={styles.tileIcon}>☂️</Text><Text style={styles.tileText}>{day.umbrellaText}</Text></View>
                </View>
              </>
            )}
            {entry.intention ? <View style={styles.item}><Text style={styles.small}>Today's intention</Text><Text style={styles.chipText}>{entry.intention}</Text></View> : null}
            <Text style={styles.small}>Your evening check-in is at {fmt(settings.evening.hour, settings.evening.minute)}.</Text>
            <Primary label="Done" onPress={() => setStep('home')} />
          </View>
        );
      }
      case 'evening-checkin':
        return (
          <Card title="How did your day go?" subtitle="One tap. It saves straight away.">
            <View style={styles.moodRow}>
              {MOODS.map((m) => {
                const on = entry.evening === m.key;
                return (
                  <Tap key={m.key} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={m.label}
                    onPress={() => updateEntry({ evening: m.key })} style={[styles.mood, on && styles.selected]}>
                    <Face mood={m.key} />
                    <Text style={styles.moodText}>{m.label}</Text>
                  </Tap>
                );
              })}
            </View>
            {entry.intention ? (
              <>
                <Text style={styles.label}>Your intention: {entry.intention}</Text>
                <View style={styles.row}>
                  {([['done', 'Done'], ['partly', 'Partly'], ['not_done', 'Not done']] as [Outcome, string][]).map(([k, l]) => (
                    <Choice key={k} label={l} selected={entry.outcome === k} onPress={() => updateEntry({ outcome: entry.outcome === k ? null : k })} />
                  ))}
                </View>
                <Text style={styles.small}>This is not a score. Leave it blank if you like.</Text>
              </>
            ) : null}
            <Primary label="Done" onPress={() => setStep('home')} />
          </Card>
        );
      case 'settings': {
        const row = (label: string, value: string, target: Step) => (
          <Tap key={label} accessibilityRole="button" accessibilityLabel={`${label}: ${value}. Tap to change.`}
            onPress={() => change(target, 'settings')} style={styles.toggle}>
            <View style={{ flex: 1 }}>
              <Text style={styles.choiceText}>{label}</Text>
              <Text style={styles.small}>{value}</Text>
            </View>
            <Text style={styles.link}>Change</Text>
          </Tap>
        );
        return (
          <Card title="Settings" subtitle="Change how Arise looks and wakes you.">
            {row('Colours', THEMES[settings.theme].name, 'colours')}
            {row('Companion', settings.companion === 'none' ? 'No companion' : settings.companion === 'woman' ? 'Woman' : 'Man', 'companion')}
            {row('Wake-up alarm', `${fmt(settings.alarm.hour, settings.alarm.minute)}, ${daysText(settings.alarm.days)}`, 'alarm')}
            {row('Evening check-in', fmt(settings.evening.hour, settings.evening.minute), 'evening')}
            {row('Town or city', settings.city?.label ?? 'Not set', 'city')}
            {row('Country for “Get support”', settings.country || 'Not set', 'country')}
            <Toggle label="Read my pep talk out loud" hint="Helpful if you can't see the screen well."
              on={settings.readAloud} onPress={() => update({ readAloud: !settings.readAloud })} />
            <Toggle label="Show reminder text on the lock screen" hint="Off keeps your reminders private if someone sees your phone."
              on={settings.reminderTextOnLockScreen} onPress={() => update({ reminderTextOnLockScreen: !settings.reminderTextOnLockScreen })} />
            <Secondary label="Check my alarm works (rings in 1 minute)" onPress={async () => {
              if (permission !== 'authorized') { await applyAlarm(settings); return; }
              await AriseAlarm.scheduleOnceIn(60);
              setMessage('Test alarm set for one minute from now. Lock the phone and wait.');
            }} />
            {message ? <Text style={styles.small}>{message}</Text> : null}
            <Primary label="Done" onPress={() => { setMessage(''); setStep('home'); }} />
          </Card>
        );
      }
      case 'history':
        return <History onChanged={() => setEntry(loadEntry())} />;
      case 'reminders':
        return <Reminders settings={settings} update={update} />;
      default:
        return (
          <Home entry={entry} onEvening={() => {
            const e = entry.date === today() ? entry : loadEntry();
            if (e !== entry) setEntry(e);
            setStep('evening-checkin');
          }} onDay={() => setStep('day')} onBegin={() => {
            // A new day starts a new entry, even if the app stayed open overnight.
            const e = entry.date === today() ? entry : loadEntry();
            if (e !== entry) setEntry(e);
            setStep(e.mood && e.affirmation ? 'pepTalk' : 'mood');
          }} settings={settings} permission={permission} message={message}
            onChangeAlarm={() => change('alarm', 'home')}
            onSettings={() => setStep('settings')} />
        );
    }
  })();

  return (
    <StylesContext.Provider value={styles}>
    <View style={styles.screen}>
      <StatusBar style={THEMES[settings.theme].dark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView>
      {step === 'home' || step === 'history' || step === 'reminders' ? (
        <View style={styles.tabBar} accessibilityRole="tablist">
          {([['home', 'Today', '☀︎'], ['reminders', 'Reminders', '🔔'], ['history', 'History', '📊']] as [Step, string, string][]).map(([target, label, icon]) => {
            const on = step === target;
            return (
              <Tap key={target} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}
                onPress={() => setStep(target)} style={styles.tab}>
                <Text style={[styles.tabIcon, !on && { opacity: 0.6 }]}>{icon}</Text>
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{label}</Text>
                {on ? <View style={styles.tabLine} /> : null}
              </Tap>
            );
          })}
        </View>
      ) : null}
    </View>
    </StylesContext.Provider>
  );
}

function Home(props: { entry: Entry; onBegin: () => void; onDay: () => void; onEvening: () => void; settings: Settings; permission: AlarmPermission; message: string; onChangeAlarm: () => void; onSettings: () => void }) {
  const styles = useStyles();
  const { settings: s } = props;
  return (
    <View>
      <View style={styles.topRow}>
        <Text style={styles.hello}>A fresh start.</Text>
        <Tap accessibilityRole="button" accessibilityLabel="Settings" onPress={props.onSettings} style={styles.gear} hitSlop={10}>
          <Text style={styles.gearText}>⚙︎</Text>
        </Tap>
      </View>
      <View style={styles.sceneWrap}>
        <Image source={IMAGES.scene} style={styles.scene} />
        {s.companion !== 'none' ? <Image source={IMAGES[s.companion]} style={styles.companion} accessibilityLabel="Your Arise companion saying good morning" /> : null}
      </View>
      <Tap style={styles.pill} onPress={props.onChangeAlarm} accessibilityRole="button"
        accessibilityLabel={`Wake-up alarm ${fmt(s.alarm.hour, s.alarm.minute)}, ${daysText(s.alarm.days)}. Tap to change.`}>
        <Text style={styles.pillText}>⏰ {fmt(s.alarm.hour, s.alarm.minute)}, {daysText(s.alarm.days)}  <Text style={styles.link}>Change</Text></Text>
      </Tap>
      {props.permission !== 'authorized' ? <Text style={styles.warn}>Alarms are not allowed yet. Tap Change to set them up.</Text> : null}
      <Primary label={props.entry.mood && props.entry.affirmation ? "See today's words" : 'Begin my morning'} onPress={props.onBegin} />
      <Secondary label="Just show my day  ›" onPress={props.onDay} />
      <Secondary label={props.entry.evening ? 'Evening check-in done ✓' : `Evening check-in (${fmt(s.evening.hour, s.evening.minute)})`} onPress={props.onEvening} />

    </View>
  );
}

function History(props: { onChanged: () => void }) {
  const styles = useStyles();
  const [entries, setEntries] = useState(allEntries);
  const [confirming, setConfirming] = useState<string | null>(null);
  const label = (m?: Mood | null) => MOODS.find((x) => x.key === m)?.label ?? '—';
  return (
    <Card title="History" subtitle="Newest first. Only you can see this.">
      <Text style={styles.week}>{weekLine(entries)}</Text>
      {entries.length === 0 ? <Text style={styles.small}>No mornings yet.</Text> : null}
      {entries.map((e) => (
        <View key={e.date} style={styles.item}>
          <Text style={styles.small}>{new Date(`${e.date}T12:00`).toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          <View style={[styles.row, { alignItems: 'center', marginTop: 6 }]}>
            {e.mood ? <Face mood={e.mood} size={26} /> : null}
            <Text style={styles.chipText}>Morning: {label(e.mood)}   Evening: {label(e.evening)}</Text>
          </View>
          {e.intention ? <Text style={styles.small}>Intention: {e.intention}{e.outcome ? ` (${e.outcome === 'not_done' ? 'not done' : e.outcome})` : ''}</Text> : null}
          {e.affirmation ? <Text style={styles.small}>{e.affirmation}</Text> : null}
          <Tap accessibilityRole="button" style={styles.smallBtn}
            accessibilityLabel={confirming === e.date ? 'Tap again to delete this day' : 'Delete this day'}
            onPress={() => {
              if (confirming !== e.date) { setConfirming(e.date); return; }
              Storage.removeItemSync(`arise.entry.${e.date}`);
              setEntries(allEntries());
              setConfirming(null);
              props.onChanged();
            }}>
            <Text style={styles.smallBtnText}>{confirming === e.date ? 'Tap again to delete' : 'Delete'}</Text>
          </Tap>
        </View>
      ))}
    </Card>
  );
}

// PRD F11: a reminder is text plus a date and time; it arrives as a normal notification.
function Reminders(props: { settings: Settings; update: (p: Partial<Settings>) => void }) {
  const styles = useStyles();
  const [list, setList] = useState(() => loadReminders().filter((r) => r.at > Date.now()));
  const [text, setText] = useState('');
  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState(() => { const d = new Date(Date.now() + 3600e3); return { hour: d.getHours(), minute: 0 }; });
  const [error, setError] = useState('');
  const when = new Date();
  when.setDate(when.getDate() + dayOffset);
  when.setHours(time.hour, time.minute, 0, 0);
  const dayName = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : when.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' });

  async function add() {
    if (!text.trim()) { setError('Type what to remind you about.'); return; }
    if (when.getTime() <= Date.now()) { setError('That time has already passed. Pick a later time.'); return; }
    if (!(await notificationsAllowed())) { setError('Notifications are off. Turn them on in Settings → Arise.'); return; }
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { title: 'Arise reminder', body: props.settings.reminderTextOnLockScreen ? text.trim() : 'You have a reminder. Open Arise to see it.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
    const next = [...list, { id: `${Date.now()}`, text: text.trim(), at: when.getTime(), notificationId }].sort((a, b) => a.at - b.at);
    setList(next);
    saveReminders(next);
    setText('');
    setError('');
  }
  async function cancel(r: Reminder) {
    await Notifications.cancelScheduledNotificationAsync(r.notificationId).catch(() => {});
    const next = list.filter((x) => x.id !== r.id);
    setList(next);
    saveReminders(next);
  }

  return (
    <Card title="Reminders" subtitle="Plain notifications. The morning alarm is the special one.">
      <TextInput value={text} onChangeText={(t) => setText(t.slice(0, 80))} placeholder="e.g. Call the bank"
        placeholderTextColor={THEMES[props.settings.theme].muted} maxLength={80} style={[styles.note, { minHeight: 0 }]} accessibilityLabel="Reminder text" />
      <View style={[styles.timeRow, { marginTop: 12 }]} accessibilityLabel={`Day ${dayName}`}>
        <Stepper label="Earlier day" text="‹" onPress={() => setDayOffset(Math.max(0, dayOffset - 1))} />
        <Text style={[styles.time, { fontSize: 20 }]}>{dayName}</Text>
        <Stepper label="Later day" text="›" onPress={() => setDayOffset(Math.min(30, dayOffset + 1))} />
      </View>
      <View style={{ marginTop: 10 }}>
        <TimePicker hour={time.hour} minute={time.minute} onChange={(hour, minute) => setTime({ hour, minute })} />
      </View>
      {error ? <Text style={styles.warn}>{error}</Text> : null}
      <Primary label="Add reminder" onPress={add} />
      <Toggle label="Show reminder text on the lock screen" hint="Off keeps your reminders private if someone sees your phone."
        on={props.settings.reminderTextOnLockScreen} onPress={() => props.update({ reminderTextOnLockScreen: !props.settings.reminderTextOnLockScreen })} />
      {list.length === 0 ? <Text style={styles.small}>No reminders yet.</Text> : null}
      {list.map((r) => (
        <View key={r.id} style={styles.item}>
          <Text style={styles.small}>{new Date(r.at).toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
          <Text style={styles.chipText}>{r.text}</Text>
          <Tap accessibilityRole="button" accessibilityLabel={`Cancel reminder ${r.text}`} style={styles.smallBtn} onPress={() => cancel(r)}>
            <Text style={styles.smallBtnText}>Cancel</Text>
          </Tap>
        </View>
      ))}
    </Card>
  );
}

function Card(props: { title: string; subtitle: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View>
      <Text style={styles.title} accessibilityRole="header">{props.title}</Text>
      <Text style={styles.subtitle}>{props.subtitle}</Text>
      {props.children}
    </View>
  );
}

function Primary(props: { label: string; onPress: () => void; disabled?: boolean }) {
  const styles = useStyles();
  return (
    <Tap accessibilityRole="button" accessibilityState={{ disabled: !!props.disabled }} disabled={props.disabled}
      onPress={props.onPress} style={[styles.primary, props.disabled && { opacity: 0.4 }]}>
      <Text style={styles.primaryText}>{props.label}</Text>
    </Tap>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Tap accessibilityRole="button" onPress={props.onPress} style={styles.secondary}>
      <Text style={styles.secondaryText}>{props.label}</Text>
    </Tap>
  );
}

function Choice(props: { label: string; selected: boolean; onPress: () => void; wide?: boolean; children?: React.ReactNode }) {
  const styles = useStyles();
  return (
    <Tap accessibilityRole="radio" accessibilityState={{ selected: props.selected }} accessibilityLabel={props.label}
      onPress={props.onPress} style={[styles.choice, props.wide && styles.choiceWide, props.selected && styles.selected]}>
      {props.children}
      <Text style={styles.choiceText}>{props.label}</Text>
    </Tap>
  );
}

function Toggle(props: { label: string; hint: string; on: boolean; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Tap accessibilityRole="switch" accessibilityState={{ checked: props.on }} onPress={props.onPress} style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.choiceText}>{props.label}</Text>
        <Text style={styles.small}>{props.hint}</Text>
      </View>
      <View style={[styles.switch, props.on && styles.switchOn]}><View style={[styles.knob, props.on && styles.knobOn]} /></View>
    </Tap>
  );
}

// Simple, accessible time picker: step the hour and the minutes (5-minute steps).
function TimePicker(props: { hour: number; minute: number; onChange: (hour: number, minute: number) => void }) {
  const styles = useStyles();
  const { hour, minute, onChange } = props;
  const step = (dh: number, dm: number) => {
    const total = (hour * 60 + minute + dh * 60 + dm + 1440) % 1440;
    onChange(Math.floor(total / 60), total % 60);
  };
  return (
    <View style={styles.timeRow} accessibilityLabel={`Time ${fmt(hour, minute)}`}>
      <Stepper label="Earlier by an hour" text="−" onPress={() => step(-1, 0)} />
      <Stepper label="Earlier by 5 minutes" text="‹" onPress={() => step(0, -5)} />
      <Text style={styles.time}>{fmt(hour, minute)}</Text>
      <Stepper label="Later by 5 minutes" text="›" onPress={() => step(0, 5)} />
      <Stepper label="Later by an hour" text="+" onPress={() => step(1, 0)} />
    </View>
  );
}

function Stepper(props: { label: string; text: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Tap accessibilityRole="button" accessibilityLabel={props.label} onPress={props.onPress} style={styles.stepper}>
      <Text style={styles.stepperText}>{props.text}</Text>
    </Tap>
  );
}

const StylesContext = createContext<ReturnType<typeof makeStyles> | null>(null);
function useStyles() {
  return useContext(StylesContext)!;
}

const makeStyles = (C: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 22, paddingTop: 72, paddingBottom: 48 },
  title: { color: C.ink, fontSize: 30, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: C.muted, fontSize: 17, marginBottom: 20, lineHeight: 23 },
  body: { color: C.ink, fontSize: 17, lineHeight: 25, marginBottom: 14 },
  label: { color: C.accent, fontSize: 13, fontWeight: '800', letterSpacing: 1, marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primary: { backgroundColor: C.accent, borderRadius: 18, paddingVertical: 17, alignItems: 'center', marginTop: 24 },
  primaryText: { color: C.onAccent, fontSize: 19, fontWeight: '800' },
  secondary: { borderColor: C.line, borderWidth: 1.5, borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  secondaryText: { color: C.ink, fontSize: 17, fontWeight: '700' },
  choice: { flex: 1, minWidth: 96, backgroundColor: C.card, borderColor: C.line, borderWidth: 1.5, borderRadius: 16, padding: 10, alignItems: 'center', gap: 8, marginBottom: 8 },
  choiceWide: { flexBasis: '100%', alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 16 },
  selected: { borderColor: C.accent, backgroundColor: C.selectedCard },
  choiceText: { color: C.ink, fontSize: 17, fontWeight: '700' },
  thumb: { width: 70, height: 92, borderRadius: 12, resizeMode: 'cover' },
  noThumb: { backgroundColor: '#E7A35A' },
  day: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  dayText: { color: C.ink, fontSize: 16, fontWeight: '800' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 18, padding: 10 },
  time: { color: C.ink, fontSize: 32, fontWeight: '800' },
  stepper: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.control, alignItems: 'center', justifyContent: 'center' },
  stepperText: { color: C.ink, fontSize: 24, fontWeight: '800' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14, marginTop: 18 },
  switch: { width: 50, height: 30, borderRadius: 15, backgroundColor: C.offSwitch, padding: 3 },
  switchOn: { backgroundColor: C.accent },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  knobOn: { marginLeft: 20 },
  warn: { color: C.warn, fontSize: 15, marginTop: 14, lineHeight: 21 },
  small: { color: C.muted, fontSize: 14, marginTop: 10, lineHeight: 20 },
  hello: { color: C.ink, fontSize: 32, fontWeight: '800', textAlign: 'center' },
  sceneWrap: { height: 330, borderRadius: 24, overflow: 'hidden', marginBottom: 18 },
  scene: { position: 'absolute', width: '100%', height: '100%' },
  companion: { position: 'absolute', bottom: 0, alignSelf: 'center', width: 200, height: 300, resizeMode: 'contain' },
  pill: { alignSelf: 'center', backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  pillText: { color: C.ink, fontSize: 16, fontWeight: '700' },
  link: { color: C.accent, fontWeight: '800' },
  swatches: { flexDirection: 'row', gap: 6 },
  moodRow: { flexDirection: 'row', gap: 6 },
  tabBar: { flexDirection: 'row', backgroundColor: C.card, borderTopColor: C.line, borderTopWidth: 1, paddingTop: 10, paddingBottom: 30 },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabIcon: { fontSize: 22 },
  tabText: { color: C.muted, fontSize: 13, fontWeight: '700' },
  tabTextOn: { color: C.ink, fontWeight: '800' },
  tabLine: { width: 36, height: 3, borderRadius: 2, backgroundColor: C.accent, marginTop: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  gear: { position: 'absolute', right: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, borderColor: C.line, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gearText: { color: C.ink, fontSize: 24 },
  weatherCard: { backgroundColor: '#3F74C2', borderRadius: 22, padding: 18 },
  weatherCity: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  weatherTemp: { color: '#FFFFFF', fontSize: 52, fontWeight: '800', lineHeight: 58 },
  weatherDesc: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  weatherSrc: { color: '#E6EEFB', fontSize: 13, marginTop: 6 },
  tile: { flex: 1, backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 18, padding: 14, gap: 6 },
  tileIcon: { fontSize: 26 },
  tileText: { color: C.ink, fontSize: 16, fontWeight: '800', lineHeight: 21 },
  week: { color: C.ink, fontSize: 15, fontWeight: '600', lineHeight: 21, backgroundColor: C.selectedCard, borderColor: C.accent, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8 },
  item: { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 10 },
  smallBtn: { alignSelf: 'flex-start', borderColor: C.line, borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, marginTop: 10 },
  smallBtnText: { color: C.muted, fontWeight: '700' },
  mood: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.card },
  moodText: { color: C.ink, fontSize: 13, fontWeight: '800' },
  note: { minHeight: 80, color: C.ink, fontSize: 17, backgroundColor: C.card, borderColor: C.line, borderWidth: 1.5, borderRadius: 14, padding: 12, textAlignVertical: 'top' },
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderColor: C.line, borderWidth: 1.5, borderRadius: 999, paddingVertical: 5, paddingLeft: 5, paddingRight: 14, marginBottom: 6 },
  chipText: { color: C.ink, fontSize: 16, fontWeight: '700' },
  bubble: { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 22, borderTopLeftRadius: 6, padding: 18, marginTop: 16 },
  bubbleText: { color: C.ink, fontSize: 20, lineHeight: 29 },
  tag: { color: C.muted, fontSize: 13, fontWeight: '700', marginTop: 10 },
  swatch: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.line },
});
