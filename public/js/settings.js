import { state, editorEl } from './state.js';
import { API } from './api.js';
import { showToast, overlayPush, overlayPop } from './ui.js';
import { updateTocTrigger } from './toc.js';

const DEFAULT_SETTINGS = {
  theme: 'study',
  textWidth: 60,
  font: "'Crimson Pro', Georgia, serif",
  fontSize: 18,
  lineSpacing: 1.6,

  distractionFree: false,
  spellCheck: false,
  typewriterSounds: false,
  typewriterVolume: 0.7,
  showTableOfContents: false,
};

function setProseMirrorSpellcheck(val) {
  const pm = editorEl.querySelector('.ProseMirror');
  if (pm) pm.setAttribute('spellcheck', String(val));
}

export function applySettings(s) {
  state.settings = { ...DEFAULT_SETTINGS, ...s };
  const t = state.settings;

  document.body.className = `theme-${t.theme ?? DEFAULT_SETTINGS.theme}`;
  editorEl.style.maxWidth = (t.textWidth ?? DEFAULT_SETTINGS.textWidth) + 'ch';
  const pm = editorEl.querySelector('.ProseMirror');
  if (pm) pm.style.fontFamily = t.font ?? DEFAULT_SETTINGS.font;
  editorEl.style.fontSize = (t.fontSize ?? DEFAULT_SETTINGS.fontSize) + 'px';
  editorEl.style.lineHeight = t.lineSpacing ?? DEFAULT_SETTINGS.lineSpacing;
  setProseMirrorSpellcheck(t.spellCheck ?? DEFAULT_SETTINGS.spellCheck);

  document.getElementById('setting-theme').value = t.theme ?? DEFAULT_SETTINGS.theme;
  document.getElementById('setting-textwidth').value = t.textWidth ?? DEFAULT_SETTINGS.textWidth;
  document.getElementById('setting-textwidth-val').textContent = (t.textWidth ?? DEFAULT_SETTINGS.textWidth) + 'ch';
  document.getElementById('setting-font').value = t.font ?? DEFAULT_SETTINGS.font;
  document.getElementById('setting-fontsize').value = t.fontSize ?? DEFAULT_SETTINGS.fontSize;
  document.getElementById('setting-fontsize-val').textContent = (t.fontSize ?? DEFAULT_SETTINGS.fontSize) + 'px';
  document.getElementById('setting-linespacing').value = t.lineSpacing ?? DEFAULT_SETTINGS.lineSpacing;
  document.getElementById('setting-linespacing-val').textContent = t.lineSpacing ?? DEFAULT_SETTINGS.lineSpacing;
  document.getElementById('setting-distractionfree').checked = t.distractionFree ?? DEFAULT_SETTINGS.distractionFree;
  document.getElementById('setting-spellcheck').checked = t.spellCheck ?? DEFAULT_SETTINGS.spellCheck;
  document.getElementById('setting-typewriter').checked = t.typewriterSounds ?? DEFAULT_SETTINGS.typewriterSounds;
  document.getElementById('setting-typewriter-volume').value = Math.round((t.typewriterVolume ?? DEFAULT_SETTINGS.typewriterVolume) * 100);
  document.getElementById('setting-typewriter-volume-val').textContent = Math.round((t.typewriterVolume ?? DEFAULT_SETTINGS.typewriterVolume) * 100) + '%';
  document.getElementById('setting-toc').checked = t.showTableOfContents ?? DEFAULT_SETTINGS.showTableOfContents;

  document.body.classList.toggle('distraction-free', t.distractionFree ?? DEFAULT_SETTINGS.distractionFree);
  document.body.classList.toggle('toc-enabled', t.showTableOfContents ?? DEFAULT_SETTINGS.showTableOfContents);
}

export function openSettings() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const btn = document.getElementById('btn-menu-toggle');
  sidebar.classList.add('show-settings');
  if (!sidebar.classList.contains('open')) {
    sidebar.classList.add('open');
    backdrop.classList.add('open');
    btn.textContent = '\u2715';
    btn.classList.add('sidebar-open');
  }
}

export function closeSettings() {
  document.getElementById('sidebar').classList.remove('show-settings');
}

export function openShortcuts() {
  overlayPush();
  document.getElementById('shortcuts-modal').classList.remove('hidden');
}

export function closeShortcuts() {
  document.getElementById('shortcuts-modal').classList.add('hidden');
  overlayPop();
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
document.getElementById('setting-typewriter-volume').addEventListener('input', (e) => {
  const v = Number(e.target.value) / 100;
  document.getElementById('setting-typewriter-volume-val').textContent = e.target.value + '%';
  state.settings.typewriterVolume = v;
  debouncedSaveSettings();
});

document.getElementById('setting-toc').addEventListener('change', (e) => {
  updateSetting('showTableOfContents', e.target.checked);
  updateTocTrigger();
});
