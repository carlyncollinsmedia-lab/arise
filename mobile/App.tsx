// Arise: first-time setup and the real wake-up alarm (build steps 1 and 2).
// Setup order follows PRD section 4: notice, companion, support country,
// alarm time and days, evening time. Settings are saved on the phone first.
// The account (sign-in) screen comes next, once the sign-in method is decided.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Storage from 'expo-sqlite/kv-store';

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
type Step = (typeof STEPS)[number] | 'home';

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

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [step, setStep] = useState<Step>('notice');
  const [permission, setPermission] = useState<AlarmPermission>('notDetermined');
  const [message, setMessage] = useState('');

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
                  <Pressable key={d} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={DAY_NAMES[d]}
                    onPress={() => update({ alarm: { ...settings.alarm, days: on ? settings.alarm.days.filter((x) => x !== d) : [...settings.alarm.days, d] } })}
                    style={[styles.day, on && styles.selected]}>
                    <Text style={styles.dayText}>{l}</Text>
                  </Pressable>
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
      default:
        return (
          <Home settings={settings} permission={permission} message={message}
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

function Home(props: { settings: Settings; permission: AlarmPermission; message: string; onChangeAlarm: () => void; onChangeColours: () => void; onTestAlarm: () => void }) {
  const styles = useStyles();
  const { settings: s } = props;
  return (
    <View>
      <Text style={styles.hello}>A fresh start.</Text>
      <View style={styles.sceneWrap}>
        <Image source={IMAGES.scene} style={styles.scene} />
        {s.companion !== 'none' ? <Image source={IMAGES[s.companion]} style={styles.companion} accessibilityLabel="Your Arise companion saying good morning" /> : null}
      </View>
      <Pressable style={styles.pill} onPress={props.onChangeAlarm} accessibilityRole="button"
        accessibilityLabel={`Wake-up alarm ${fmt(s.alarm.hour, s.alarm.minute)}, ${daysText(s.alarm.days)}. Tap to change.`}>
        <Text style={styles.pillText}>⏰ {fmt(s.alarm.hour, s.alarm.minute)}, {daysText(s.alarm.days)}  <Text style={styles.link}>Change</Text></Text>
      </Pressable>
      {props.permission !== 'authorized' ? <Text style={styles.warn}>Alarms are not allowed yet. Tap Change to set them up.</Text> : null}
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
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!props.disabled }} disabled={props.disabled}
      onPress={props.onPress} style={[styles.primary, props.disabled && { opacity: 0.4 }]}>
      <Text style={styles.primaryText}>{props.label}</Text>
    </Pressable>
  );
}

function Secondary(props: { label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" onPress={props.onPress} style={styles.secondary}>
      <Text style={styles.secondaryText}>{props.label}</Text>
    </Pressable>
  );
}

function Choice(props: { label: string; selected: boolean; onPress: () => void; wide?: boolean; children?: React.ReactNode }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: props.selected }} accessibilityLabel={props.label}
      onPress={props.onPress} style={[styles.choice, props.wide && styles.choiceWide, props.selected && styles.selected]}>
      {props.children}
      <Text style={styles.choiceText}>{props.label}</Text>
    </Pressable>
  );
}

function Toggle(props: { label: string; hint: string; on: boolean; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: props.on }} onPress={props.onPress} style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.choiceText}>{props.label}</Text>
        <Text style={styles.small}>{props.hint}</Text>
      </View>
      <View style={[styles.switch, props.on && styles.switchOn]}><View style={[styles.knob, props.on && styles.knobOn]} /></View>
    </Pressable>
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
    <Pressable accessibilityRole="button" accessibilityLabel={props.label} onPress={props.onPress} style={styles.stepper}>
      <Text style={styles.stepperText}>{props.text}</Text>
    </Pressable>
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
  swatch: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.line },
});
