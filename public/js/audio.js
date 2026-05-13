import { state } from './state.js';

let audioCtx = null;
let lastSoundTime = 0;
const buffers = {};

const KEY_SOUNDS = ['keypress-1', 'keypress-2', 'keypress-3', 'keypress-4', 'keypress-5'];

const ALL_SAMPLES = [...KEY_SOUNDS, 'space', 'return', 'backspace'];

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

async function loadSample(name) {
  try {
    const ctx = getAudioContext();
    const res = await fetch(`audio/${name}.mp3`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    buffers[name] = await ctx.decodeAudioData(arrayBuf);
  } catch {
    buffers[name] = null;
  }
}

export function preloadSamples() {
  getAudioContext();
  ALL_SAMPLES.forEach((name) => loadSample(name));
}

function playBuffer(ctx, name, volume = 1, playbackRate = 1) {
  const buf = buffers[name];
  if (!buf) return;
  const t = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = buf;
  source.playbackRate.value = playbackRate;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(t);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

const DEFAULT_VOLUME = 0.7;

export function playTypewriterSound(action = 'keypress', keyCode = 0) {
  if (!state.settings.typewriterSounds) return;
  const now = Date.now();
  if (now - lastSoundTime < 30) return;
  lastSoundTime = now;

  const vol = typeof state.settings.typewriterVolume === 'number'
    ? state.settings.typewriterVolume
    : DEFAULT_VOLUME;

  const ctx = getAudioContext();

  switch (action) {
    case 'space':
      playBuffer(ctx, 'space', vol, rand(0.95, 1.05));
      break;
    case 'backspace':
      playBuffer(ctx, 'backspace', vol, rand(0.97, 1.03));
      break;
    case 'enter':
      playBuffer(ctx, 'return', vol, rand(0.99, 1.01));
      break;
    default: {
      const idx = (keyCode || 0) % 5;
      playBuffer(ctx, KEY_SOUNDS[idx], rand(Math.max(vol - 0.2, 0), vol), rand(0.98, 1.01));
    }
  }
}
