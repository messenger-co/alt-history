export const TOTAL_DURATION = 300; // 5 minutes (300 seconds)
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

export type SpeakerId = 'narrator' | 'hitler' | 'stalin' | 'mussolini' | 'hirohito';

export interface ActDefinition {
  id: number;
  label: string;
  title: string;
  shortTitle: string;
  start: number;
  end: number;
}

export interface DialogueCue {
  id: string;
  time: number;
  duration: number;
  speaker: SpeakerId;
  speakerName: string;
  text: string;
  actId: number;
  pitch: number;
  rate: number;
}

export type SfxKind =
  | 'brass_fanfare'
  | 'pen_snap'
  | 'ink_splat'
  | 'crayon_scribble'
  | 'chalk_crash'
  | 'engine_sputter'
  | 'tent_flatten'
  | 'barn_crash'
  | 'water_splash'
  | 'sign_flip'
  | 'mud_splat'
  | 'table_snap'
  | 'shout_pop'
  | 'newspaper_spin'
  | 'sad_trombone';

export interface SfxCue {
  id: string;
  time: number;
  kind: SfxKind;
}

export const ACTS: readonly ActDefinition[] = [
  {
    id: 1,
    label: 'Act 1',
    title: 'Vintage Newsreel Intro & Pact Signing',
    shortTitle: 'Intro & Pact',
    start: 0,
    end: 25,
  },
  {
    id: 2,
    label: 'Act 2',
    title: 'Dividing the World Map',
    shortTitle: 'World Map',
    start: 25,
    end: 65,
  },
  {
    id: 3,
    label: 'Act 3',
    title: 'Designing the Mega-Weapon',
    shortTitle: 'Mega-Weapon',
    start: 65,
    end: 105,
  },
  {
    id: 4,
    label: 'Act 4',
    title: 'The Four-Way Clown-Car Tank',
    shortTitle: 'Clown-Car Tank',
    start: 105,
    end: 150,
  },
  {
    id: 5,
    label: 'Act 5',
    title: 'The Naval Disaster',
    shortTitle: 'Naval Disaster',
    start: 150,
    end: 190,
  },
  {
    id: 6,
    label: 'Act 6',
    title: 'The Allied Counter-Prank',
    shortTitle: 'Allied Prank',
    start: 190,
    end: 230,
  },
  {
    id: 7,
    label: 'Act 7',
    title: 'Total Alliance Meltdown',
    shortTitle: 'Meltdown',
    start: 230,
    end: 270,
  },
  {
    id: 8,
    label: 'Act 8',
    title: 'Finale — World Conquest Cancelled',
    shortTitle: 'Finale',
    start: 270,
    end: 300,
  },
] as const;

export const DIALOGUE_CUES: readonly DialogueCue[] = [
  {
    id: 'act1-narrator',
    time: 4,
    duration: 9.5,
    speaker: 'narrator',
    speakerName: 'NEWSREEL NARRATOR',
    text: "Flash bulletin, 1940! History's four most stubborn dictators have signed an unholy pact to conquer the entire planet!",
    actId: 1,
    pitch: 1.08,
    rate: 1.08,
  },
  {
    id: 'act1-hitler',
    time: 15,
    duration: 8.5,
    speaker: 'hitler',
    speakerName: 'HITLER',
    text: 'STOP PUSHING MY ELBOW, MUSSOLINI! YOU RUINED MY SIGNATURE!',
    actId: 1,
    pitch: 1.25,
    rate: 1.15,
  },
  {
    id: 'act2-pencil',
    time: 26,
    duration: 5,
    speaker: 'stalin',
    speakerName: 'STALIN',
    text: "One pencil for four borders? Whoever packed this wants an argument.",
    actId: 2,
    pitch: 1,
    rate: 1,
  },
  {
    id: 'act2-hitler',
    time: 32,
    duration: 8.5,
    speaker: 'hitler',
    speakerName: 'HITLER',
    text: 'EUROPE IS MINE! STOP DRAWING OVER MY LINES, STALIN!',
    actId: 2,
    pitch: 1.28,
    rate: 1.16,
  },
  {
    id: 'act2-stalin',
    time: 42,
    duration: 8.5,
    speaker: 'stalin',
    speakerName: 'STALIN',
    text: 'Our lines, comrade. Mostly mine.',
    actId: 2,
    pitch: 0.72,
    rate: 0.88,
  },
  {
    id: 'act2-hirohito',
    time: 54,
    duration: 9.0,
    speaker: 'hirohito',
    speakerName: 'HIROHITO',
    text: 'I have drawn a very neat circle around the ocean. Do not touch it.',
    actId: 2,
    pitch: 0.85,
    rate: 0.92,
  },
  {
    id: 'act3-blueprint',
    time: 66,
    duration: 7,
    speaker: 'narrator',
    speakerName: 'NEWSREEL NARRATOR',
    text: "The blueprints call for one engine. The shopping list calls for a coffee grinder.",
    actId: 3,
    pitch: 1,
    rate: 1,
  },
  {
    id: 'act3-mussolini',
    time: 75, // 1:15
    duration: 10.5,
    speaker: 'mussolini',
    speakerName: 'MUSSOLINI',
    text: 'A conquering army cannot march without espresso! Magnificent!',
    actId: 3,
    pitch: 0.9,
    rate: 1.02,
  },
  {
    id: 'act3-hitler',
    time: 90, // 1:30
    duration: 9.5,
    speaker: 'hitler',
    speakerName: 'HITLER',
    text: 'NO! MORE CANNONS! PUT CANNONS ON THE CANNONS!',
    actId: 3,
    pitch: 1.3,
    rate: 1.18,
  },
  {
    id: 'act3-cup',
    time: 100,
    duration: 4,
    speaker: 'mussolini',
    speakerName: 'MUSSOLINI',
    text: "The drawing fell down. My cup stayed up!",
    actId: 3,
    pitch: 1,
    rate: 1,
  },
  {
    id: 'act4-wheel',
    time: 106,
    duration: 7,
    speaker: 'hirohito',
    speakerName: 'HIROHITO',
    text: "I count four drivers, three pedals, and one wheel nobody wishes to claim.",
    actId: 4,
    pitch: 0.85,
    rate: 1,
  },
  {
    id: 'act4-mussolini',
    time: 115, // 1:55
    duration: 10.5,
    speaker: 'mussolini',
    speakerName: 'MUSSOLINI',
    text: 'ONWARD TO GLORY! WAIT—WHO IS STEERING THIS THING?!',
    actId: 4,
    pitch: 0.95,
    rate: 1.08,
  },
  {
    id: 'act4-tent',
    time: 126,
    duration: 5,
    speaker: 'mussolini',
    speakerName: 'MUSSOLINI',
    text: "Was that a tent? Then why is it on my head?",
    actId: 4,
    pitch: 1,
    rate: 1,
  },
  {
    id: 'act4-hirohito',
    time: 132, // 2:12
    duration: 11.5,
    speaker: 'hirohito',
    speakerName: 'HIROHITO',
    text: 'I believe we are currently invading a barn. The cows appear unimpressed.',
    actId: 4,
    pitch: 0.85,
    rate: 0.92,
  },
  {
    id: 'act4-cow',
    time: 144,
    duration: 5,
    speaker: 'hirohito',
    speakerName: 'HIROHITO',
    text: "The cow would like her door back.",
    actId: 4,
    pitch: 0.85,
    rate: 1,
  },
  {
    id: 'act5-launch',
    time: 151,
    duration: 7,
    speaker: 'narrator',
    speakerName: 'NEWSREEL NARRATOR',
    text: "They pushed off at noon. By lunch they had passed the same gull twice.",
    actId: 5,
    pitch: 1,
    rate: 1,
  },
  {
    id: 'act5-stalin',
    time: 160, // 2:40
    duration: 9.0,
    speaker: 'stalin',
    speakerName: 'STALIN',
    text: 'Give me the hat. I am captain now.',
    actId: 5,
    pitch: 0.7,
    rate: 0.86,
  },
  {
    id: 'act5-hitler',
    time: 172, // 2:52
    duration: 11.0,
    speaker: 'hitler',
    speakerName: 'HITLER',
    text: 'NEIN! WE ARE GOING IN CIRCLES! WHO FORGOT THE COMPASS?!',
    actId: 5,
    pitch: 1.28,
    rate: 1.16,
  },
  {
    id: 'act5-paper-boat',
    time: 184,
    duration: 5,
    speaker: 'stalin',
    speakerName: 'STALIN',
    text: "That paper boat is overtaking us. Take its captain down by name.",
    actId: 5,
    pitch: 1,
    rate: 1,
  },
  {
    id: 'act6-signpost',
    time: 191,
    duration: 8,
    speaker: 'narrator',
    speakerName: 'NEWSREEL NARRATOR',
    text: "At the crossroads, a carpenter has been given one nail and a very important arrow.",
    actId: 6,
    pitch: 1,
    rate: 1,
  },
  {
    id: 'act6-narrator',
    time: 202, // 3:22
    duration: 11.5,
    speaker: 'narrator',
    speakerName: 'NEWSREEL NARRATOR',
    text: 'Meanwhile, the Allied High Command deploys its most devastating secret weapon: a slightly crooked road sign!',
    actId: 6,
    pitch: 1.08,
    rate: 1.06,
  },
  {
    id: 'act6-hitler',
    time: 218, // 3:38
    duration: 9.5,
    speaker: 'hitler',
    speakerName: 'HITLER',
    text: 'SABOTAGE! WHO MOVED THE ROAD?!',
    actId: 6,
    pitch: 1.32,
    rate: 1.16,
  },
  {
    id: 'act7-minutes',
    time: 231,
    duration: 7,
    speaker: 'hirohito',
    speakerName: 'HIROHITO',
    text: "For the minutes: everyone objects to the minutes. Shall I write that down?",
    actId: 7,
    pitch: 0.85,
    rate: 1,
  },
  {
    id: 'act7-mussolini',
    time: 240, // 4:00
    duration: 10.0,
    speaker: 'mussolini',
    speakerName: 'MUSSOLINI',
    text: "This was all Hitler's idea! I just wanted to drive the tank!",
    actId: 7,
    pitch: 0.94,
    rate: 1.06,
  },
  {
    id: 'act7-stalin',
    time: 252, // 4:12
    duration: 11.0,
    speaker: 'stalin',
    speakerName: 'STALIN',
    text: 'I am taking my half of the map and going home.',
    actId: 7,
    pitch: 0.72,
    rate: 0.88,
  },
  {
    id: 'act7-fold',
    time: 264,
    duration: 5,
    speaker: 'hirohito',
    speakerName: 'HIROHITO',
    text: "At least the map now folds along the border.",
    actId: 7,
    pitch: 0.85,
    rate: 1,
  },
  {
    id: 'act8-extra',
    time: 271,
    duration: 4,
    speaker: 'narrator',
    speakerName: 'NEWSREEL NARRATOR',
    text: "Extra! Four seats available. Driver wanted.",
    actId: 8,
    pitch: 1,
    rate: 1,
  },
  {
    id: 'act8-narrator',
    time: 276, // 4:36
    duration: 11.5,
    speaker: 'narrator',
    speakerName: 'NEWSREEL NARRATOR',
    text: 'And so, the world was saved—not by armies, but by the worst road trip in human history!',
    actId: 8,
    pitch: 1.06,
    rate: 1.05,
  },
  {
    id: 'act8-fare',
    time: 289,
    duration: 8,
    speaker: 'hirohito',
    speakerName: 'HIROHITO',
    text: "Gentlemen, the tow truck takes cash. Which half of the map has the wallet?",
    actId: 8,
    pitch: 0.85,
    rate: 1,
  },
] as const;

export const SFX_CUES: readonly SfxCue[] = [
  { id: 'sfx-intro-brass', time: 0.3, kind: 'brass_fanfare' },
  { id: 'sfx-title-slam', time: 3.1, kind: 'brass_fanfare' },
  { id: 'sfx-pen-snap', time: 13.8, kind: 'pen_snap' },
  { id: 'sfx-ink-splat', time: 15.2, kind: 'ink_splat' },
  { id: 'sfx-crayon-1', time: 28.5, kind: 'crayon_scribble' },
  { id: 'sfx-crayon-2', time: 39.5, kind: 'crayon_scribble' },
  { id: 'sfx-crayon-3', time: 52.0, kind: 'crayon_scribble' },
  { id: 'sfx-chalk-1', time: 70.0, kind: 'crayon_scribble' },
  { id: 'sfx-chalk-crash', time: 97.5, kind: 'chalk_crash' },
  { id: 'sfx-engine-1', time: 106.0, kind: 'engine_sputter' },
  { id: 'sfx-tent-flatten', time: 122.0, kind: 'tent_flatten' },
  { id: 'sfx-barn-crash', time: 130.0, kind: 'barn_crash' },
  { id: 'sfx-water-1', time: 152.0, kind: 'water_splash' },
  { id: 'sfx-rudder-snap', time: 168.5, kind: 'pen_snap' },
  { id: 'sfx-water-2', time: 170.0, kind: 'water_splash' },
  { id: 'sfx-sign-flip', time: 205.5, kind: 'sign_flip' },
  { id: 'sfx-mud-splat', time: 215.0, kind: 'mud_splat' },
  { id: 'sfx-shout-1', time: 235.0, kind: 'shout_pop' },
  { id: 'sfx-shout-2', time: 247.0, kind: 'shout_pop' },
  { id: 'sfx-table-snap', time: 256.5, kind: 'table_snap' },
  { id: 'sfx-newspaper', time: 270.4, kind: 'newspaper_spin' },
  { id: 'sfx-sad-trombone', time: 291.0, kind: 'sad_trombone' },
] as const;

export function wrapTime(t: number): number {
  if (!Number.isFinite(t)) return 0;
  const wrapped = t % TOTAL_DURATION;
  return wrapped < 0 ? wrapped + TOTAL_DURATION : wrapped;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function clamp01(val: number): number {
  return clamp(val, 0, 1);
}

export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const t = clamp01(x);
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutQuad(x: number): number {
  const t = clamp01(x);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function formatTimecode(seconds: number): string {
  const safe = Math.max(0, Math.floor(wrapTime(seconds)));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getActAtTime(t: number): ActDefinition {
  const wt = wrapTime(t);
  for (let i = 0; i < ACTS.length; i++) {
    const act = ACTS[i];
    if (wt >= act.start && wt < act.end) {
      return act;
    }
  }
  return ACTS[ACTS.length - 1];
}

export function getActiveDialogue(t: number): DialogueCue | null {
  const wt = wrapTime(t);
  for (let i = DIALOGUE_CUES.length - 1; i >= 0; i--) {
    const cue = DIALOGUE_CUES[i];
    if (wt >= cue.time && wt <= cue.time + cue.duration) {
      return cue;
    }
  }
  return null;
}

/**
 * Finds a cue index that should trigger at current time `t` within a forward playback
 * window `[cue.time, cue.time + windowSec]`, returning -1 if already triggered or none matched.
 */
export function findCueToTrigger<T extends { time: number }>(
  t: number,
  cues: readonly T[],
  lastTriggeredIndex: number,
  windowSec = 0.6
): number {
  const wt = wrapTime(t);
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (wt >= cue.time && wt < cue.time + windowSec) {
      if (i !== lastTriggeredIndex) {
        return i;
      }
      return -1;
    }
  }
  return -1;
}

/**
 * Returns deterministic camera shake amplitude (in canvas pixels) for slams and crashes.
 */
export function getCameraShake(t: number): { x: number; y: number; intensity: number } {
  const wt = wrapTime(t);
  const impacts: Array<{ time: number; dur: number; amp: number }> = [
    { time: 3.1, dur: 0.7, amp: 10 }, // Title card slam
    { time: 15.1, dur: 0.55, amp: 8 }, // Ink splatter desk slam
    { time: 97.5, dur: 1.2, amp: 16 }, // Chalkboard blueprint collapse CRASH!
    { time: 122.0, dur: 0.75, amp: 11 }, // Tent flatten
    { time: 130.0, dur: 1.4, amp: 20 }, // Barn CRASH!
    { time: 168.5, dur: 0.65, amp: 9 }, // Rudder snap
    { time: 215.0, dur: 0.9, amp: 13 }, // Mud pit splat
    { time: 256.5, dur: 1.0, amp: 15 }, // Map table snap in half
  ];

  let intensity = 0;
  for (const imp of impacts) {
    if (wt >= imp.time && wt < imp.time + imp.dur) {
      const progress = (wt - imp.time) / imp.dur;
      const decay = (1 - progress) * (1 - progress);
      intensity = Math.max(intensity, imp.amp * decay);
    }
  }

  if (intensity <= 0.05) {
    return { x: 0, y: 0, intensity: 0 };
  }

  return {
    x: Math.sin(wt * 67.3) * intensity,
    y: Math.cos(wt * 53.7) * intensity * 0.85,
    intensity,
  };
}

/**
 * Returns lip-sync mouth openness [0..1] when a character is actively speaking.
 */
export function getLipSyncOpenness(t: number, isSpeaking: boolean): number {
  if (!isSpeaking) return 0;
  const syllabic =
    0.5 +
    0.32 * Math.sin(t * 21.5) +
    0.18 * Math.sin(t * 37.2 + 1.1);
  return clamp01(syllabic);
}

/**
 * Computes circular 1940s iris radius ratio [0..1] for the seamless loop
 * (iris-out from 294.5s -> 298.0s, brief hold, iris-open 298.2s -> 300s and 0s -> 0.8s).
 */
export function getIrisOpenRatio(t: number): number {
  const wt = wrapTime(t);
  if (wt < 0.7) {
    // Smooth iris-open at start of loop
    return easeInOutQuad(wt / 0.7);
  }
  if (wt >= 294.5 && wt < 297.8) {
    // Iris-out closing onto the smoking tank hatch
    const p = (wt - 294.5) / 3.3;
    // Slight classic cartoon double-take pause around 0.72
    if (p > 0.62 && p < 0.76) {
      return 0.24;
    }
    const adjusted = p >= 0.76 ? 0.24 * (1 - (p - 0.76) / 0.24) : 1 - (p / 0.62) * 0.76;
    return clamp01(adjusted);
  }
  if (wt >= 297.8 && wt < 298.6) {
    return 0;
  }
  if (wt >= 298.6) {
    // Begin smoothly iris-opening into 0:00
    return easeInOutQuad((wt - 298.6) / 1.4) * 0.12;
  }
  return 1;
}
