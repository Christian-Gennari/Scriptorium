import { state } from './state.js';

let audioCtx = null;
let lastSoundTime = 0;
const buffers = {};

const SAMPLES = ['keypress', 'space', 'backspace', 'bell', 'return'];

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
    const res = await fetch(`audio/${name}.wav`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    buffers[name] = await ctx.decodeAudioData(arrayBuf);
  } catch {
    buffers[name] = null;
  }
}

export function preloadSamples() {
  getAudioContext();
  SAMPLES.forEach((name) => loadSample(name));
}

function playBuffer(ctx, name, detune = 0, delay = 0) {
  const buf = buffers[name];
  if (!buf) return;
  const t = ctx.currentTime + delay;
  const source = ctx.createBufferSource();
  source.buffer = buf;
  if (detune) source.detune.value = detune;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + buf.duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(t);
}

export function playTypewriterSound(action = 'keypress') {
  if (!state.settings.typewriterSounds) return;
  const now = Date.now();
  if (now - lastSoundTime < 30) return;
  lastSoundTime = now;
  const ctx = getAudioContext();
  switch (action) {
    case 'space':
      playBuffer(ctx, 'space');
      break;
    case 'backspace':
      playBuffer(ctx, 'backspace');
      break;
    case 'enter':
      playBuffer(ctx, 'bell');
      playBuffer(ctx, 'return', 0, 0.2);
      break;
    default:
      playBuffer(ctx, 'keypress', Math.floor(Math.random() * 60 - 30));
  }
}
