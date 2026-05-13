import { state } from './state.js';

let audioCtx = null;
let lastSoundTime = 0;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTypewriterSound(isEnter = false) {
  if (!state.settings.typewriterSounds) return;
  const now = Date.now();
  if (now - lastSoundTime < 40) return;
  lastSoundTime = now;
  const ctx = getAudioContext();
  const duration = isEnter ? 0.08 : 0.04;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (isEnter ? 0.02 : 0.008)));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = isEnter ? 600 : 1200;
  filter.Q.value = isEnter ? 2.0 : 1.5;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
