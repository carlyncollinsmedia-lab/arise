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
};

const DEFAULTS: Settings = {
  noticeAccepted: false,
  setupComplete: false,
  theme: 'night',
  companion: 'woman',
  country: '',
  alarm: { hour: 6, minute: 0, days: [1, 2, 3, 4, 5] },
  evening: { hour: 20, minute: 0 },
  readAloud: false,
};
const KEY = 'arise.settings.v1';
const STEPS = ['notice', 'companion', 'colours', 'country', 'alarm', 'evening'] as const;
type Step = (typeof STEPS)[number] | 'home' | 'mood' | 'pepTalk';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COUNTRIES = ['Canada', 'Nigeria', 'United Kingdom', 'United States', 'Other'];
const IMAGES = {
  woman: require('./assets/companions/woman-light.webp'),
  man: require('./assets/companions/man-light.webp'),
  scene: require('./assets/companions/bg-sunrise.jpg'),
};

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
type Entry = { date: string; mood: Mood | null; note: string; changes: number; affirmation: string; status: '' | 'generated' | 'fallback' | 'crisis' };
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
  const nextStep = () => setStep(settings.setupComplete ? 'home' : STEPS[STEPS.indexOf(step as (typeof STEPS)[number]) + 1] ?? 'home');

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
            <Primary label={settings.setupComplete ? 'Save' : 'Finish setup'} onPress={() => { update({ setupComplete: true }); setStep('home'); }} />
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
            <Primary label="Done" onPress={() => { stopSpeaking(); setStep('home'); }} />
          </View>
        );
      }
      default:
        return (
          <Home entry={entry} onBegin={() => {
            // A new day starts a new entry, even if the app stayed open overnight.
            const e = entry.date === today() ? entry : loadEntry();
            if (e !== entry) setEntry(e);
            setStep(e.mood && e.affirmation ? 'pepTalk' : 'mood');
          }} settings={settings} permission={permission} message={message}
            onChangeAlarm={() => setStep('alarm')}
            onChangeColours={() => setStep('colours')}
            onTestAlarm={async () => {
              if (permission !== 'authorized') { await applyAlarm(settings); return; }
              await AriseAlarm.scheduleOnceIn(60);
              setMessage('Test alarm set for one minute from now. Lock the phone and wait.');
            }} />
        );
    }
  })();

  return (
    <StylesContext.Provider value={styles}>
    <View style={styles.screen}>
      <StatusBar style={THEMES[settings.theme].dark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView>
    </View>
    </StylesContext.Provider>
  );
}

function Home(props: { entry: Entry; onBegin: () => void; settings: Settings; permission: AlarmPermission; message: string; onChangeAlarm: () => void; onChangeColours: () => void; onTestAlarm: () => void }) {
  const styles = useStyles();
  const { settings: s } = props;
  return (
    <View>
      <Text style={styles.hello}>A fresh start.</Text>
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
      <Text style={styles.small}>Evening check-in at {fmt(s.evening.hour, s.evening.minute)}.</Text>
      <Secondary label="Test: ring in 1 minute" onPress={props.onTestAlarm} />
      <Secondary label="Change colours" onPress={props.onChangeColours} />
      {props.message ? <Text style={styles.small}>{props.message}</Text> : null}
    </View>
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
  hello: { color: C.ink, fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  sceneWrap: { height: 330, borderRadius: 24, overflow: 'hidden', marginBottom: 18 },
  scene: { position: 'absolute', width: '100%', height: '100%' },
  companion: { position: 'absolute', bottom: 0, alignSelf: 'center', width: 200, height: 300, resizeMode: 'contain' },
  pill: { alignSelf: 'center', backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  pillText: { color: C.ink, fontSize: 16, fontWeight: '700' },
  link: { color: C.accent, fontWeight: '800' },
  swatches: { flexDirection: 'row', gap: 6 },
  moodRow: { flexDirection: 'row', gap: 6 },
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
