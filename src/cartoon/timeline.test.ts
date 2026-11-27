import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTS,
  DIALOGUE_CUES,
  SFX_CUES,
  TOTAL_DURATION,
  findCueToTrigger,
  formatTimecode,
  getActAtTime,
  getActiveDialogue,
  getCameraShake,
  getIrisOpenRatio,
  getLipSyncOpenness,
  wrapTime,
} from './timeline';

test('8 acts cover 0..300 seconds contiguously without gaps or overlaps', () => {
  assert.equal(ACTS.length, 8);
  assert.equal(ACTS[0].start, 0);
  assert.equal(ACTS[ACTS.length - 1].end, TOTAL_DURATION);
  for (let i = 1; i < ACTS.length; i++) {
    assert.equal(ACTS[i].start, ACTS[i - 1].end);
    assert.ok(ACTS[i].end > ACTS[i].start);
  }
});

test('wrapTime loops seamlessly across 300s boundary', () => {
  assert.equal(wrapTime(0), 0);
  assert.equal(wrapTime(300), 0);
  assert.equal(wrapTime(305.5), 5.5);
  assert.equal(wrapTime(-10), 290);
});

test('getActAtTime returns the exact act across all 8 chapters', () => {
  assert.equal(getActAtTime(0).id, 1);
  assert.equal(getActAtTime(24.9).id, 1);
  assert.equal(getActAtTime(25).id, 2);
  assert.equal(getActAtTime(65).id, 3);
  assert.equal(getActAtTime(105).id, 4);
  assert.equal(getActAtTime(150).id, 5);
  assert.equal(getActAtTime(190).id, 6);
  assert.equal(getActAtTime(230).id, 7);
  assert.equal(getActAtTime(270).id, 8);
  assert.equal(getActAtTime(299.9).id, 8);
  assert.equal(getActAtTime(300).id, 1);
});

test('all 16 requested dialogue cues are sorted in time and active inside their windows', () => {
  assert.equal(DIALOGUE_CUES.length, 16);
  for (let i = 1; i < DIALOGUE_CUES.length; i++) {
    assert.ok(DIALOGUE_CUES[i].time > DIALOGUE_CUES[i - 1].time);
  }
  const cueAt4 = getActiveDialogue(4.5);
  assert.equal(cueAt4?.speaker, 'narrator');
  assert.match(cueAt4?.text ?? '', /Flash bulletin, 1940!/);

  const cueAt276 = getActiveDialogue(278);
  assert.equal(cueAt276?.speaker, 'narrator');
  assert.match(cueAt276?.text ?? '', /worst road trip/);

  assert.equal(getActiveDialogue(1.0), null);
});

test('findCueToTrigger fires exactly once per cue window and never double-fires', () => {
  const idx1 = findCueToTrigger(4.1, DIALOGUE_CUES, -1);
  assert.equal(idx1, 0);
  const idxRepeat = findCueToTrigger(4.2, DIALOGUE_CUES, idx1);
  assert.equal(idxRepeat, -1);
  const idxNext = findCueToTrigger(15.1, DIALOGUE_CUES, idx1);
  assert.equal(idxNext, 1);
  assert.ok(SFX_CUES.length >= 15);
});

test('camera shake spikes on major crashes and settles to zero elsewhere', () => {
  const calm = getCameraShake(50);
  assert.equal(calm.intensity, 0);

  const barnCrash = getCameraShake(130.1);
  assert.ok(barnCrash.intensity > 12);

  const chalkCrash = getCameraShake(97.6);
  assert.ok(chalkCrash.intensity > 10);
});

test('lip-sync and iris transitions stay bounded in [0, 1]', () => {
  assert.equal(getLipSyncOpenness(10, false), 0);
  const open = getLipSyncOpenness(10.1, true);
  assert.ok(open >= 0 && open <= 1);

  assert.equal(getIrisOpenRatio(120), 1);
  assert.equal(getIrisOpenRatio(298.0), 0);
  assert.ok(getIrisOpenRatio(0.35) > 0 && getIrisOpenRatio(0.35) < 1);
  assert.equal(formatTimecode(0), '0:00');
  assert.equal(formatTimecode(125), '2:05');
  assert.equal(formatTimecode(299), '4:59');
});
