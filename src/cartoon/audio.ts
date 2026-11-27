import { DIALOGUE_CUES, DialogueCue, SfxKind } from './timeline';

export type VoiceMode = 'fish-ai' | 'browser-fallback';

export class NewsreelAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private activeHtmlAudioUrl: string | null = null;

  private muted = false;
  private marchStep = 0;
  private lastMarchTime = -1;

  private fishConfigured: boolean | null = null;
  private fishStatusPromise: Promise<boolean> | null = null;
  private rawMp3Cache = new Map<string, ArrayBuffer>();
  private decodedCache = new Map<string, AudioBuffer>();
  private inflightRawFetches = new Map<string, Promise<ArrayBuffer | null>>();
  private speakToken = 0;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = this.muted ? 0 : 1;
          this.masterGain.connect(this.ctx.destination);

          if (typeof this.ctx.createMediaStreamDestination === 'function') {
            this.recordDest = this.ctx.createMediaStreamDestination();
            this.masterGain.connect(this.recordDest);
          }
        } catch {
          this.ctx = null;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getRecordingAudioStream(): MediaStream | null {
    this.unlock();
    return this.recordDest?.stream ?? null;
  }

  public async checkFishStatus(): Promise<boolean> {
    if (import.meta.env.MODE === 'pages') return false;
    if (this.fishConfigured !== null) return this.fishConfigured;
    if (!this.fishStatusPromise) {
      this.fishStatusPromise = fetch('/api/tts/status')
        .then((res) => (res.ok ? res.json() : { configured: false }))
        .then((data: { configured?: boolean }) => {
          this.fishConfigured = Boolean(data.configured);
          return this.fishConfigured;
        })
        .catch(() => {
          this.fishConfigured = false;
          return false;
        });
    }
    return this.fishStatusPromise;
  }

  public getVoiceMode(): VoiceMode {
    return this.fishConfigured ? 'fish-ai' : 'browser-fallback';
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.muted = muted;
    }
    if (muted) {
      this.cancelSpeech();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public cancelSpeech(): void {
    this.speakToken++;
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch {
        // Ignore already-stopped source
      }
      this.activeVoiceSource = null;
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.src = '';
      } catch {
        // Ignore pause errors
      }
      this.activeHtmlAudio = null;
    }
    if (this.activeHtmlAudioUrl) {
      URL.revokeObjectURL(this.activeHtmlAudioUrl);
      this.activeHtmlAudioUrl = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore browser speech synthesis errors
      }
    }
  }

  /**
   * Prefetches raw Fish Audio MP3 bytes ahead of upcoming dialogue cues—works even
   * before AudioContext is unlocked so character voices fire instantaneously on cue.
   */
  public prefetchUpcoming(currentTime: number): void {
    if (!this.fishConfigured) return;
    for (const cue of DIALOGUE_CUES) {
      if (cue.time >= currentTime - 0.5 && cue.time - currentTime <= 14) {
        if (!this.rawMp3Cache.has(cue.id) && !this.inflightRawFetches.has(cue.id)) {
          void this.fetchRawFishMp3(cue.id);
        }
      }
    }
  }

  private async fetchRawFishMp3(cueId: string): Promise<ArrayBuffer | null> {
    const cached = this.rawMp3Cache.get(cueId);
    if (cached) return cached;

    const existing = this.inflightRawFetches.get(cueId);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cueId }),
        });
        if (res.status === 503) {
          this.fishConfigured = false;
          return null;
        }
        if (!res.ok) return null;

        const arrayBuf = await res.arrayBuffer();
        if (arrayBuf.byteLength === 0) return null;
        this.rawMp3Cache.set(cueId, arrayBuf);
        return arrayBuf;
      } catch {
        return null;
      } finally {
        this.inflightRawFetches.delete(cueId);
      }
    })();

    this.inflightRawFetches.set(cueId, promise);
    return promise;
  }

  private async decodeFishAudio(cueId: string, raw: ArrayBuffer): Promise<AudioBuffer | null> {
    const cached = this.decodedCache.get(cueId);
    if (cached) return cached;
    this.unlock();
    if (!this.ctx) return null;
    try {
      const decoded = await this.ctx.decodeAudioData(raw.slice(0));
      this.decodedCache.set(cueId, decoded);
      return decoded;
    } catch {
      return null;
    }
  }

  public speak(cue: DialogueCue): void {
    if (this.muted) return;
    this.cancelSpeech();
    const myToken = this.speakToken;

    void (async () => {
      const fishReady = await this.checkFishStatus();
      if (myToken !== this.speakToken || this.muted) return;

      if (fishReady) {
        const rawMp3 = await this.fetchRawFishMp3(cue.id);
        if (myToken !== this.speakToken || this.muted) return;

        if (rawMp3) {
          this.unlock();
          // Prefer Web Audio playback so voices route into masterGain (live speakers + MP4 recording!)
          if (this.ctx && this.masterGain && this.ctx.state === 'running') {
            const buffer = await this.decodeFishAudio(cue.id, rawMp3);
            if (myToken !== this.speakToken || this.muted) return;
            if (buffer) {
              const source = this.ctx.createBufferSource();
              source.buffer = buffer;
              const voiceGain = this.ctx.createGain();
              voiceGain.gain.value = 1.08;
              source.connect(voiceGain);
              voiceGain.connect(this.masterGain);
              source.onended = () => {
                if (this.activeVoiceSource === source) {
                  this.activeVoiceSource = null;
                }
              };
              this.activeVoiceSource = source;
              source.start(0);
              return;
            }
          }

          // If AudioContext is still suspended before first click, try HTMLAudioElement with the Fish Audio MP3
          // (never replace a valid Fish Audio voice with robotic browser speechSynthesis!)
          try {
            const blobUrl = URL.createObjectURL(new Blob([rawMp3], { type: 'audio/mpeg' }));
            const audioEl = new Audio(blobUrl);
            audioEl.volume = 0.96;
            audioEl.muted = this.muted;
            this.activeHtmlAudio = audioEl;
            this.activeHtmlAudioUrl = blobUrl;
            audioEl.onended = () => {
              if (this.activeHtmlAudio === audioEl) {
                this.activeHtmlAudio = null;
                if (this.activeHtmlAudioUrl) {
                  URL.revokeObjectURL(this.activeHtmlAudioUrl);
                  this.activeHtmlAudioUrl = null;
                }
              }
            };
            await audioEl.play();
            return;
          } catch {
            // Autoplay blocked until user clicks; do not fall back to robotic browser voice
            return;
          }
        }
      }

      // Only fall back to browser speechSynthesis when Fish Audio is not configured
      if (!fishReady) {
        this.speakFallback(cue);
      }
    })();
  }

  private speakFallback(cue: DialogueCue): void {
    if (this.muted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cue.text);
      utter.pitch = cue.pitch;
      utter.rate = cue.rate;
      utter.volume = 0.92;
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore browser speech errors
    }
  }

  private getOutputNode(): AudioNode | null {
    return this.masterGain ?? this.ctx?.destination ?? null;
  }

  /**
   * Subtle vintage 1940s brass march accompaniment pulse during active playback.
   */
  public tickMarch(t: number, isPlaying: boolean): void {
    const out = this.getOutputNode();
    if (!isPlaying || this.muted || !this.ctx || !out || this.ctx.state !== 'running') return;
    const inMarchZone = t < 25 || (t >= 105 && t < 150) || (t >= 270 && t < 292);
    if (!inMarchZone) return;

    const beatInterval = 0.42;
    const beatIndex = Math.floor(t / beatInterval);
    if (beatIndex === this.lastMarchTime) return;
    this.lastMarchTime = beatIndex;

    const now = this.ctx.currentTime;
    const bassNotes = [110, 164.81, 130.81, 146.83, 110, 164.81, 196.0, 146.83];
    const freq = bassNotes[this.marchStep % bassNotes.length];
    this.marchStep++;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSfx(kind: SfxKind): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    switch (kind) {
      case 'brass_fanfare':
        this.playBrassFanfare();
        break;
      case 'pen_snap':
        this.playSnap();
        break;
      case 'ink_splat':
      case 'mud_splat':
        this.playSplat(kind === 'mud_splat' ? 140 : 260);
        break;
      case 'crayon_scribble':
        this.playScribble();
        break;
      case 'chalk_crash':
      case 'barn_crash':
      case 'table_snap':
        this.playCrash(kind === 'barn_crash' ? 1.0 : 0.75);
        break;
      case 'engine_sputter':
        this.playEngineSputter();
        break;
      case 'tent_flatten':
        this.playSlideWhistle(580, 170, 0.45);
        break;
      case 'water_splash':
        this.playWaterSplash();
        break;
      case 'sign_flip':
        this.playSlideWhistle(260, 740, 0.25);
        break;
      case 'shout_pop':
        this.playShoutPop();
        break;
      case 'newspaper_spin':
        this.playNewspaperSpin();
        break;
      case 'sad_trombone':
        this.playSadTrombone();
        break;
    }
  }

  private playBrassFanfare(): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 261.63, t: 0, d: 0.14 },
      { f: 329.63, t: 0.15, d: 0.14 },
      { f: 392.0, t: 0.3, d: 0.16 },
      { f: 523.25, t: 0.48, d: 0.45 },
    ];
    for (const n of notes) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now + n.t);
      filter.Q.setValueAtTime(1.4, now + n.t);
      gain.gain.setValueAtTime(0.001, now + n.t);
      gain.gain.linearRampToValueAtTime(0.11, now + n.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }
  }

  private playSnap(): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  private playSplat(startFreq: number): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.28);
    this.playNoiseBurst(0.22, 650, 0.1);
  }

  private playScribble(): void {
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) {
      this.playNoiseBurst(0.08, 1900 + i * 240, 0.06, i * 0.11);
    }
  }

  private playCrash(scale: number): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
    gain.gain.setValueAtTime(0.22 * scale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.52);

    this.playNoiseBurst(0.6, 1200, 0.16 * scale, 0);
    this.playNoiseBurst(0.35, 2600, 0.09 * scale, 0.12);
  }

  private playEngineSputter(): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const t = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(62 + (i % 3) * 14, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(out);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  private playWaterSplash(): void {
    this.playNoiseBurst(0.55, 950, 0.14, 0);
    this.playSlideWhistle(420, 190, 0.25);
  }

  private playSlideWhistle(f1: number, f2: number, dur: number): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f2, now + dur);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private playShoutPop(): void {
    this.playSlideWhistle(220, 620, 0.12);
  }

  private playNewspaperSpin(): void {
    this.playSlideWhistle(180, 680, 0.45);
    this.playBrassFanfare();
  }

  private playSadTrombone(): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 311.13, t: 0.0, d: 0.36, slideTo: 300 },
      { f: 293.66, t: 0.4, d: 0.36, slideTo: 284 },
      { f: 277.18, t: 0.8, d: 0.36, slideTo: 268 },
      { f: 261.63, t: 1.2, d: 0.95, slideTo: 233.08 },
    ];
    for (const n of notes) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      osc.frequency.linearRampToValueAtTime(n.slideTo, now + n.t + n.d);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now + n.t);
      gain.gain.setValueAtTime(0.001, now + n.t);
      gain.gain.linearRampToValueAtTime(0.11, now + n.t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.03);
    }
  }

  private playNoiseBurst(duration: number, filterFreq: number, volume: number, delay = 0): void {
    const out = this.getOutputNode();
    if (!this.ctx || !out) return;
    const now = this.ctx.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    source.start(now);
    source.stop(now + duration + 0.02);
  }
}
