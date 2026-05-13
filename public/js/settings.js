import { state, editorEl } from './state.js';
import { API } from './api.js';
import { showToast } from './ui.js';

const DEFAULT_SETTINGS = {
  theme: 'light',
  textWidth: 60,
  font: 'serif',
  fontSize: 18,
  lineSpacing: 1.6,

  distractionFree: false,
  spellCheck: false,
  typewriterSounds: false,
};

function setProseMirrorSpellcheck(val) {
  const pm = editorEl.querySelector('.ProseMirror');
  if (pm) pm.setAttribute('spellcheck', String(val));
}

export function applySettings(s) {
  state.settings = { ...DEFAULT_SETTINGS, ...s };

  document.body.className = `theme-${state.settings.theme}`;
  editorEl.style.maxWidth = state.settings.textWidth + 'ch';
  editorEl.style.fontFamily = state.settings.font;
  editorEl.style.fontSize = state.settings.fontSize + 'px';
  editorEl.style.lineHeight = state.settings.lineSpacing;
  setProseMirrorSpellcheck(state.settings.spellCheck);

  document.getElementById('setting-theme').value = state.settings.theme;
  document.getElementById('setting-textwidth').value = state.settings.textWidth;
  document.getElementById('setting-textwidth-val').textContent = state.settings.textWidth + 'ch';
  document.getElementById('setting-font').value = state.settings.font;
  document.getElementById('setting-fontsize').value = state.settings.fontSize;
  document.getElementById('setting-fontsize-val').textContent = state.settings.fontSize + 'px';
  document.getElementById('setting-linespacing').value = state.settings.lineSpacing;
  document.getElementById('setting-linespacing-val').textContent = state.settings.lineSpacing;
  document.getElementById('setting-distractionfree').checked = state.settings.distractionFree;
  document.getElementById('setting-spellcheck').checked = state.settings.spellCheck;
  document.getElementById('setting-typewriter').checked = state.settings.typewriterSounds;

  document.body.classList.toggle('distraction-free', state.settings.distractionFree);
}

export function openSettings() {
  document.getElementById('settings-overlay').classList.remove('hidden');
  document.getElementById('settings-panel').classList.remove('hidden');
}

export function closeSettings() {
  document.getElementById('settings-overlay').classList.add('hidden');
  document.getElementById('settings-panel').classList.add('hidden');
}

export function openShortcuts() {
  document.getElementById('shortcuts-modal').classList.remove('hidden');
}

export function closeShortcuts() {
  document.getElementById('shortcuts-modal').classList.add('hidden');
}

export function toggleDistractionFree() {
  const el = document.getElementById('setting-distractionfree');
  el.checked = !el.checked;
  el.dispatchEvent(new Event('change'));
}

function debouncedSaveSettings() {
  clearTimeout(state.settingsSaveTimeout);
  state.settingsSaveTimeout = setTimeout(async () => {
    try {
      await API.saveSettings(state.settings);
    } catch {
      showToast('Failed to save settings', 'error');
    }
  }, 500);
}

async function updateSetting(key, value) {
  state.settings[key] = value;
  try {
    await API.saveSettings(state.settings);
  } catch {
    showToast('Failed to save settings', 'error');
  }
  applySettings(state.settings);
}

document.getElementById('setting-theme').addEventListener('change', (e) => {
  updateSetting('theme', e.target.value);
});
document.getElementById('setting-textwidth').addEventListener('input', (e) => {
  const v = e.target.value;
  document.getElementById('setting-textwidth-val').textContent = v + 'ch';
  editorEl.style.maxWidth = v + 'ch';
  state.settings.textWidth = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-font').addEventListener('change', (e) => {
  updateSetting('font', e.target.value);
});
document.getElementById('setting-fontsize').addEventListener('input', (e) => {
  const v = e.target.value;
  document.getElementById('setting-fontsize-val').textContent = v + 'px';
  editorEl.style.fontSize = v + 'px';
  state.settings.fontSize = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-linespacing').addEventListener('input', (e) => {
  const v = e.target.value;
  document.getElementById('setting-linespacing-val').textContent = v;
  editorEl.style.lineHeight = v;
  state.settings.lineSpacing = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-distractionfree').addEventListener('change', (e) => {
  document.body.classList.toggle('distraction-free', e.target.checked);
  updateSetting('distractionFree', e.target.checked);
});
document.getElementById('setting-spellcheck').addEventListener('change', (e) => {
  setProseMirrorSpellcheck(e.target.checked);
  updateSetting('spellCheck', e.target.checked);
});
document.getElementById('setting-typewriter').addEventListener('change', (e) => {
  updateSetting('typewriterSounds', e.target.checked);
});
