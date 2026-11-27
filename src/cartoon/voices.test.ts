import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FISH_VOICE_MODELS,
  buildFishTtsPayload,
  isNativeMp4Mime,
  selectBestRecorderMimeType,
} from './voices';

test('maps Fish Audio voice model IDs accurately for Hitler, Stalin, Mussolini, and Hirohito', () => {
  assert.equal(FISH_VOICE_MODELS.hitler, '26474a484e3640d086da631baf813050');
  assert.equal(FISH_VOICE_MODELS.stalin, '890a2fc6bb62428f9d2f9bf6c90879b8');
  assert.equal(FISH_VOICE_MODELS.mussolini, '926182b0e84c43fdbd95ea0d46f6b10b');
  assert.equal(FISH_VOICE_MODELS.hirohito, '7dc7084215d44059a48bd06de0185376');
});

test('buildFishTtsPayload builds valid MP3 requests for allowlisted cues and rejects invalid IDs', () => {
  const hitlerPayload = buildFishTtsPayload('act2-hitler');
  assert.equal(hitlerPayload?.reference_id, '26474a484e3640d086da631baf813050');
  assert.equal(hitlerPayload?.format, 'mp3');
  assert.match(hitlerPayload?.text ?? '', /EUROPE IS MINE/);

  const stalinPayload = buildFishTtsPayload('act2-stalin');
  assert.equal(stalinPayload?.reference_id, '890a2fc6bb62428f9d2f9bf6c90879b8');

  const mussoliniPayload = buildFishTtsPayload('act3-mussolini');
  assert.equal(mussoliniPayload?.reference_id, '926182b0e84c43fdbd95ea0d46f6b10b');

  const hirohitoPayload = buildFishTtsPayload('act2-hirohito');
  assert.equal(hirohitoPayload?.reference_id, FISH_VOICE_MODELS.hirohito);

  // Security validation: unknown or malicious cue IDs are rejected
  assert.equal(buildFishTtsPayload(''), null);
  assert.equal(buildFishTtsPayload('arbitrary-injected-id'), null);
  assert.equal(buildFishTtsPayload('../etc/passwd'), null);
});

test('selectBestRecorderMimeType prefers native MP4 and falls back cleanly to WebM', () => {
  assert.equal(
    selectBestRecorderMimeType((m) => m === 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'),
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
  );
  assert.equal(
    selectBestRecorderMimeType((m) => m === 'video/webm;codecs=vp9,opus'),
    'video/webm;codecs=vp9,opus'
  );
  assert.equal(selectBestRecorderMimeType(() => false), '');
  assert.equal(isNativeMp4Mime('video/mp4;codecs=avc1'), true);
  assert.equal(isNativeMp4Mime('video/webm;codecs=vp9,opus'), false);
});
