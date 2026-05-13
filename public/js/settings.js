import { state, editor } from './state.js';
import { API } from './api.js';
import { showToast } from './ui.js';

const DEFAULT_SETTINGS = {
  theme: 'light',
  textWidth: 60,
  font: 'serif',
  fontSize: 18,
  lineSpacing: 1.6,
  caretColor: '#333333',
  fontColor: '#333333',
  distractionFree: false,
  smartQuotes: true,
  smartDashes: true,
  spellCheck: false,
  typewriterSounds: false,
};

export function applySettings(s) {
  state.settings = { ...DEFAULT_SETTINGS, ...s };

  document.body.className = `theme-${state.settings.theme}`;
  editor.style.maxWidth = state.settings.textWidth + 'ch';
  editor.style.fontFamily = state.settings.font;
  editor.style.fontSize = state.settings.fontSize + 'px';
  editor.style.lineHeight = state.settings.lineSpacing;
  editor.style.caretColor = state.settings.caretColor;
  editor.style.color = state.settings.fontColor;
  editor.spellcheck = state.settings.spellCheck;

  document.getElementById('setting-theme').value = state.settings.theme;
  document.getElementById('setting-textwidth').value = state.settings.textWidth;
  document.getElementById('setting-textwidth-val').textContent = state.settings.textWidth + 'ch';
  document.getElementById('setting-font').value = state.settings.font;
  document.getElementById('setting-fontsize').value = state.settings.fontSize;
  document.getElementById('setting-fontsize-val').textContent = state.settings.fontSize + 'px';
  document.getElementById('setting-linespacing').value = state.settings.lineSpacing;
  document.getElementById('setting-linespacing-val').textContent = state.settings.lineSpacing;
  document.getElementById('setting-caretcolor').value = state.settings.caretColor;
  document.getElementById('setting-fontcolor').value = state.settings.fontColor;
  document.getElementById('setting-distractionfree').checked = state.settings.distractionFree;
  document.getElementById('setting-smartquotes').checked = state.settings.smartQuotes;
  document.getElementById('setting-smartdashes').checked = state.settings.smartDashes;
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
  editor.style.maxWidth = v + 'ch';
  state.settings.textWidth = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-font').addEventListener('change', (e) => {
  updateSetting('font', e.target.value);
});
document.getElementById('setting-fontsize').addEventListener('input', (e) => {
  const v = e.target.value;
  document.getElementById('setting-fontsize-val').textContent = v + 'px';
  editor.style.fontSize = v + 'px';
  state.settings.fontSize = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-linespacing').addEventListener('input', (e) => {
  const v = e.target.value;
  document.getElementById('setting-linespacing-val').textContent = v;
  editor.style.lineHeight = v;
  state.settings.lineSpacing = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-caretcolor').addEventListener('input', (e) => {
  editor.style.caretColor = e.target.value;
  state.settings.caretColor = e.target.value;
  debouncedSaveSettings();
});
document.getElementById('setting-fontcolor').addEventListener('input', (e) => {
  editor.style.color = e.target.value;
  state.settings.fontColor = e.target.value;
  debouncedSaveSettings();
});
document.getElementById('setting-distractionfree').addEventListener('change', (e) => {
  document.body.classList.toggle('distraction-free', e.target.checked);
  updateSetting('distractionFree', e.target.checked);
});
document.getElementById('setting-smartquotes').addEventListener('change', (e) => {
  updateSetting('smartQuotes', e.target.checked);
});
document.getElementById('setting-smartdashes').addEventListener('change', (e) => {
  updateSetting('smartDashes', e.target.checked);
});
document.getElementById('setting-spellcheck').addEventListener('change', (e) => {
  editor.spellcheck = e.target.checked;
  updateSetting('spellCheck', e.target.checked);
});
document.getElementById('setting-typewriter').addEventListener('change', (e) => {
  updateSetting('typewriterSounds', e.target.checked);
});
