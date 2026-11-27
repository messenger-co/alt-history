/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Loader2, Pause, Play, RotateCcw, Square, Volume2, VolumeX } from 'lucide-react';
import { NewsreelAudioEngine, VoiceMode } from './cartoon/audio';
import { CartoonMp4Recorder, ExportPhase } from './cartoon/recorder';
import { renderCartoonFrame } from './cartoon/renderer';
import {
  ACTS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DIALOGUE_CUES,
  SFX_CUES,
  TOTAL_DURATION,
  findCueToTrigger,
  formatTimecode,
  getActAtTime,
  wrapTime,
} from './cartoon/timeline';

type RecordScope = 'act' | 'full';

// Keep the original chapter and dialogue timecodes when skipping the film leader.
const FIRST_FRAME = 3.1;

function playbackTime(seconds: number): number {
  return Math.max(FIRST_FRAME, wrapTime(seconds));
}

function getInitialTimeFromUrl(): number {
  if (typeof window === 'undefined') return FIRST_FRAME;
  return playbackTime(Number(new URLSearchParams(window.location.search).get('t')));
}

export default function App() {
  const initialTime = getInitialTimeFromUrl();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<NewsreelAudioEngine | null>(null);
  const recorderRef = useRef<CartoonMp4Recorder | null>(null);

  const timeRef = useRef<number>(initialTime);
  const isPlayingRef = useRef<boolean>(true);
  const lastDialogueCueRef = useRef<number>(-1);
  const lastSfxCueRef = useRef<number>(-1);

  const recordTargetEndRef = useRef<number | null>(null);
  const recordStartedAtRef = useRef<number>(0);
  const recordFilenameRef = useRef<string>('alt-history-newsreel-1940.mp4');
  const exportPhaseRef = useRef<ExportPhase>('idle');

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [displayTime, setDisplayTime] = useState<number>(initialTime);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('browser-fallback');

  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const [exportPhase, setExportPhase] = useState<ExportPhase>('idle');
  const [recordElapsed, setRecordElapsed] = useState<number>(0);
  const [exportMessage, setExportMessage] = useState<string>('');

  const currentAct = getActAtTime(displayTime);

  const getAudio = useCallback((): NewsreelAudioEngine => {
    if (!audioRef.current) {
      audioRef.current = new NewsreelAudioEngine();
    }
    return audioRef.current;
  }, []);

  // Check whether server-side Fish Audio TTS is configured and prefetch upcoming lines
  useEffect(() => {
    let active = true;
    const audio = getAudio();
    void audio.checkFishStatus().then((configured) => {
      if (active) {
        setVoiceMode(configured ? 'fish-ai' : 'browser-fallback');
        if (configured) {
          audio.prefetchUpcoming(timeRef.current);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [getAudio]);

  const seekTo = useCallback(
    (targetSeconds: number) => {
      const next = playbackTime(targetSeconds);
      const audio = getAudio();
      audio.unlock();
      audio.cancelSpeech();
      timeRef.current = next;
      lastDialogueCueRef.current = -1;
      lastSfxCueRef.current = -1;
      setDisplayTime(next);
      audio.prefetchUpcoming(next);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { alpha: false });
      if (ctx) {
        renderCartoonFrame(ctx, next);
      }
    },
    [getAudio]
  );

  const togglePlay = useCallback(() => {
    const audio = getAudio();
    audio.unlock();
    const next = !isPlayingRef.current;
    isPlayingRef.current = next;
    setIsPlaying(next);
    if (!next) {
      audio.cancelSpeech();
    }
  }, [getAudio]);

  const toggleMute = useCallback(() => {
    const audio = getAudio();
    audio.unlock();
    const next = !audio.isMuted();
    audio.setMuted(next);
    setIsMuted(next);
  }, [getAudio]);

  const finishRecordingAndExport = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || exportPhaseRef.current !== 'recording') return;

    exportPhaseRef.current = 'encoding';
    recordTargetEndRef.current = null;
    setExportPhase('encoding');
    setExportMessage('Encoding MP4 video...');

    try {
      await recorder.stopAndExportMp4(recordFilenameRef.current);
      exportPhaseRef.current = 'done';
      setExportPhase('done');
      setExportMessage('MP4 downloaded.');
      window.setTimeout(() => {
        if (exportPhaseRef.current === 'done') {
          exportPhaseRef.current = 'idle';
          setExportPhase('idle');
          setExportMessage('');
        }
      }, 4000);
    } catch (err) {
      exportPhaseRef.current = 'error';
      setExportPhase('error');
      setExportMessage(err instanceof Error ? err.message : 'MP4 export failed.');
    }
  }, []);

  const startMp4Recording = useCallback(
    (scope: RecordScope) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const audio = getAudio();
      audio.unlock();

      // Ensure sound is unmuted so voices and SFX are recorded into the MP4
      if (audio.isMuted()) {
        audio.setMuted(false);
        setIsMuted(false);
      }

      const act = getActAtTime(timeRef.current);
      const startSec = scope === 'full' ? 0 : act.start;
      const endSec = scope === 'full' ? TOTAL_DURATION - 0.15 : act.end - 0.1;

      recordFilenameRef.current =
        scope === 'full'
          ? 'alt-history-newsreel-1940-full.mp4'
          : `alt-history-newsreel-1940-act${act.id}.mp4`;

      setExportMenuOpen(false);
      seekTo(startSec);

      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setIsPlaying(true);
      }

      try {
        const recorder = new CartoonMp4Recorder();
        recorder.start(canvas, audio.getRecordingAudioStream());
        recorderRef.current = recorder;
        recordTargetEndRef.current = endSec;
        recordStartedAtRef.current = performance.now();
        exportPhaseRef.current = 'recording';
        setRecordElapsed(0);
        setExportPhase('recording');
        setExportMessage(
          scope === 'full'
            ? 'Recording Full 5:00 MP4...'
            : `Recording ${act.label} MP4...`
        );
      } catch (err) {
        exportPhaseRef.current = 'error';
        setExportPhase('error');
        setExportMessage(err instanceof Error ? err.message : 'Unable to start MP4 recording.');
      }
    },
    [getAudio, seekTo]
  );

  // Abort active recording cleanly on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.abort();
    };
  }, []);

  // Unlock Web Audio on first user pointer interaction anywhere
  useEffect(() => {
    const unlockOnce = () => {
      getAudio().unlock();
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    return () => window.removeEventListener('pointerdown', unlockOnce);
  }, [getAudio]);

  // Keyboard shortcuts (Space: Play/Pause, M: Mute, Left/Right: +/-5s)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTo(timeRef.current + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTo(timeRef.current - 5);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [seekTo, toggleMute, togglePlay]);

  // Master continuous 60fps requestAnimationFrame loop (never freezes, seamless 300s loop, 0% CPU when paused)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const audio = getAudio();

    // Always paint current frame immediately
    renderCartoonFrame(ctx, timeRef.current);

    if (!isPlaying) {
      return;
    }

    let rafId = 0;
    let lastTimestamp = performance.now();
    let lastUiSync = lastTimestamp;

    const tick = (now: number) => {
      const rawDt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      const dt = Math.min(0.05, Math.max(0, rawDt));

      const prevTime = timeRef.current;
      const nextTime = playbackTime(prevTime + dt);

      // Auto-stop MP4 recording cleanly when reaching end of selected Act or 5:00
      if (
        exportPhaseRef.current === 'recording' &&
        recordTargetEndRef.current !== null &&
        (nextTime >= recordTargetEndRef.current || nextTime < prevTime)
      ) {
        void finishRecordingAndExport();
      }

      // Detect seamless auto-loop wrap from 300 -> 0
      if (nextTime < prevTime) {
        audio.cancelSpeech();
        lastDialogueCueRef.current = -1;
        lastSfxCueRef.current = -1;
      }

      timeRef.current = nextTime;

      // Prefetch upcoming Fish Audio voice cues ahead of playback
      audio.prefetchUpcoming(nextTime);

      // Trigger non-blocking timed dialogue once per cue window
      const dialogueIdx = findCueToTrigger(
        nextTime,
        DIALOGUE_CUES,
        lastDialogueCueRef.current,
        0.65
      );
      if (dialogueIdx !== -1) {
        lastDialogueCueRef.current = dialogueIdx;
        audio.speak(DIALOGUE_CUES[dialogueIdx]);
      }

      // Trigger procedural Web Audio SFX once per cue window
      const sfxIdx = findCueToTrigger(nextTime, SFX_CUES, lastSfxCueRef.current, 0.45);
      if (sfxIdx !== -1) {
        lastSfxCueRef.current = sfxIdx;
        audio.playSfx(SFX_CUES[sfxIdx].kind);
      }

      // Subtle 1940s newsreel brass march pulse
      audio.tickMarch(nextTime, true);

      renderCartoonFrame(ctx, timeRef.current);

      // Sync UI timecode & scrubber at ~10Hz so React never slows down 60fps Canvas
      if (now - lastUiSync >= 100) {
        lastUiSync = now;
        setDisplayTime(timeRef.current);
        if (exportPhaseRef.current === 'recording') {
          setRecordElapsed(Math.floor((now - recordStartedAtRef.current) / 1000));
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      audio.cancelSpeech();
    };
  }, [finishRecordingAndExport, getAudio, isPlaying]);

  const progressPct = (displayTime / TOTAL_DURATION) * 100;

  return (
    <div
      className="min-h-screen bg-[#120F0C] text-[#F1E8D6] flex flex-col items-center justify-center px-4 py-3 md:px-6"
      data-testid="cartoon-theater"
      data-act={currentAct.id}
      data-playing={isPlaying ? 'true' : 'false'}
      data-muted={isMuted ? 'true' : 'false'}
      data-time={Math.floor(displayTime)}
      data-recording={exportPhase}
      data-voice-mode={voiceMode}
    >
      <div className="w-full max-w-[1080px] flex flex-col gap-3">
        {/* Clean Editorial Masthead (single row on desktop, wraps cleanly on mobile) */}
        <header className="flex flex-wrap items-baseline justify-between gap-2 md:gap-4 border-b border-[#332A20] pb-2.5">
          <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-[#F5ECD8] sm:whitespace-nowrap">
            Alt-History Newsreel: The Unholy Four-Way Alliance (1940)
          </h1>
          <div className="flex items-center gap-2 text-xs md:text-sm text-[#B8A88E]">
            <span>{voiceMode === 'fish-ai' ? 'Fish Audio Voices' : 'Browser Voices'}</span>
            <span aria-hidden="true">·</span>
            <span>
              {currentAct.label}: {currentAct.title}
            </span>
          </div>
        </header>

        {/* Primary Focal Anchor: 16:9 1280x720 HTML5 Canvas Cinema Stage */}
        <main className="w-full">
          <div className="relative w-full aspect-video bg-[#0B0907] rounded-lg overflow-hidden border border-[#3B3024] shadow-[0_18px_48px_rgba(0,0,0,0.65)]">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              data-testid="cartoon-canvas"
              className="block w-full h-full object-contain"
              aria-label="1940s satirical cartoon animation canvas"
            />
          </div>

          {/* Transport Controls, MP4 Export & Continuous 5-Minute Timeline Scrubber */}
          <section
            aria-label="Playback controls"
            className="mt-3 bg-[#1B1611] border border-[#342B21] rounded-lg px-4 py-3 flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
              {/* Play / Pause Primary Action */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-md bg-[#C8432B] hover:bg-[#D94F36] active:bg-[#B23822] text-[#FDF8EE] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6B95C]"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              {/* Restart 0:00 */}
              <button
                type="button"
                onClick={() => seekTo(0)}
                aria-label="Restart from beginning"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md bg-[#262019] hover:bg-[#332B21] text-[#E8DEC8] border border-[#3C3126] text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6B95C]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </button>

              {/* Timeline Scrubber Track (0:00 - 5:00) */}
              <div className="flex-1 min-w-[180px] flex items-center gap-2.5">
                <span className="font-mono tabular-nums text-xs md:text-sm text-[#EFE4CE] w-10 text-right shrink-0">
                  {formatTimecode(displayTime)}
                </span>

                <div className="relative flex-1 h-8 flex items-center">
                  <div className="absolute inset-x-0 h-2 rounded-full bg-[#2D251D] overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-[#C8432B]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="absolute inset-x-0 h-2 pointer-events-none">
                    {ACTS.slice(1).map((act) => (
                      <span
                        key={act.id}
                        className="absolute top-0 bottom-0 w-px bg-[#F1E8D6]/35"
                        style={{ left: `${(act.start / TOTAL_DURATION) * 100}%` }}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={TOTAL_DURATION}
                    step={0.1}
                    value={displayTime}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    aria-label="Timeline scrubber from 0:00 to 5:00"
                    className="newsreel-scrubber relative z-10 w-full h-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6B95C]"
                  />
                </div>

                <span className="font-mono tabular-nums text-xs md:text-sm text-[#A9997F] w-9 shrink-0">
                  5:00
                </span>
              </div>

              {/* Mute / Unmute Audio Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute audio and speech' : 'Mute audio and speech'}
                aria-pressed={isMuted}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md border text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6B95C] ${
                  isMuted
                    ? 'bg-[#362722] border-[#C8432B] text-[#F5C5BB]'
                    : 'bg-[#262019] hover:bg-[#332B21] border-[#3C3126] text-[#E8DEC8]'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isMuted ? 'Muted' : 'Sound On'}</span>
              </button>

              {/* Download MP4 Recorder Control */}
              <div className="relative shrink-0">
                {exportPhase === 'recording' ? (
                  <button
                    type="button"
                    onClick={() => void finishRecordingAndExport()}
                    aria-label="Stop recording and save MP4"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-md bg-[#E6B95C] hover:bg-[#F0C66E] text-[#17120D] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5ECD8]"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span className="font-mono tabular-nums">
                      Stop &amp; Save MP4 ({formatTimecode(recordElapsed)})
                    </span>
                  </button>
                ) : exportPhase === 'encoding' ? (
                  <button
                    type="button"
                    disabled
                    aria-label="Encoding MP4 video"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-md bg-[#2D251C] border border-[#4A3C2D] text-[#E6B95C] text-sm font-medium whitespace-nowrap shrink-0 cursor-wait"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Encoding MP4...</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setExportMenuOpen((open) => !open)}
                    aria-expanded={exportMenuOpen}
                    aria-label="Download video as MP4"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-md bg-[#262019] hover:bg-[#332B21] border border-[#5B4935] text-[#F3E7CE] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6B95C]"
                  >
                    <Download className="w-4 h-4 text-[#E6B95C]" />
                    <span>Download MP4</span>
                  </button>
                )}

                {exportMenuOpen && exportPhase !== 'recording' && exportPhase !== 'encoding' && (
                  <div
                    role="menu"
                    aria-label="MP4 recording scope"
                    className="absolute right-0 bottom-full mb-2 w-64 rounded-lg bg-[#221C16] border border-[#493B2C] shadow-[0_12px_32px_rgba(0,0,0,0.75)] p-1.5 z-30 flex flex-col gap-1"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => startMp4Recording('act')}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-[#312820] text-[#F5ECD8] transition-colors focus-visible:outline-2 focus-visible:outline-[#E6B95C]"
                    >
                      <div className="text-sm font-semibold">
                        Record {currentAct.label} (.mp4)
                      </div>
                      <div className="text-xs text-[#B8A88E] mt-0.5">
                        {formatTimecode(currentAct.start)}–{formatTimecode(currentAct.end)} with audio
                      </div>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => startMp4Recording('full')}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-[#312820] text-[#F5ECD8] transition-colors focus-visible:outline-2 focus-visible:outline-[#E6B95C]"
                    >
                      <div className="text-sm font-semibold">Record Full Feature (.mp4)</div>
                      <div className="text-xs text-[#B8A88E] mt-0.5">
                        0:00–5:00 (stop early anytime to save)
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {exportMessage && (
              <p
                role="status"
                className={`text-xs ${
                  exportPhase === 'error' ? 'text-[#F29C8E]' : 'text-[#E6B95C]'
                }`}
              >
                {exportMessage}
              </p>
            )}

            {/* Clickable Act 1–8 Chapter Jump Strip */}
            <nav
              aria-label="Cartoon acts chapter navigation"
              className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 pt-1 border-t border-[#2E261E]"
            >
              {ACTS.map((act) => {
                const isActive = currentAct.id === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => seekTo(act.start)}
                    aria-pressed={isActive}
                    aria-label={`Jump to ${act.label}: ${act.title} (${formatTimecode(act.start)})`}
                    className={`flex flex-col items-start px-2.5 py-2 rounded-md border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6B95C] ${
                      isActive
                        ? 'bg-[#2F231B] border-[#C8432B] text-[#FAF2E1]'
                        : 'bg-[#17130F] hover:bg-[#241E17] border-[#2E261D] text-[#B8A88E] hover:text-[#EFE4CE]'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between gap-1 text-[11px] font-mono tabular-nums">
                      <span className={isActive ? 'text-[#E6B95C] font-semibold' : 'text-[#8F806A]'}>
                        {act.label}
                      </span>
                      <span className="text-[#8F806A]">{formatTimecode(act.start)}</span>
                    </div>
                    <span className="text-xs font-semibold truncate w-full mt-0.5 whitespace-nowrap">
                      {act.shortTitle}
                    </span>
                  </button>
                );
              })}
            </nav>
          </section>
        </main>
      </div>
    </div>
  );
}
