const API = {
  async listFiles() {
    const r = await fetch('/api/files');
    return r.json();
  },
  async getFile(name) {
    const r = await fetch(`/api/files/${encodeURIComponent(name)}`);
    if (!r.ok) return null;
    return r.json();
  },
  async createFile(name, content) {
    const r = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content }),
    });
    return r.ok;
  },
  async saveFile(name, content) {
    const r = await fetch(`/api/files/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return r.ok;
  },
  async deleteFile(name) {
    const r = await fetch(`/api/files/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return r.ok;
  },
  async getSettings() {
    const r = await fetch('/api/settings');
    return r.json();
  },
  async saveSettings(settings) {
    const r = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return r.json();
  },
};

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

let currentFile = null;
let settings = {};
let saveTimeout = null;
let settingsSaveTimeout = null;
let isDirty = false;

const editor = document.getElementById('editor');
const fileNameEl = document.getElementById('file-name');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const readingTimeEl = document.getElementById('reading-time');
const saveStatusEl = document.getElementById('save-status');

function setSaveStatus(text, type) {
  saveStatusEl.textContent = text;
  saveStatusEl.className = type ? `save-status--${type}` : '';
}

function newDocument() {
  if (isDirty && !confirm('Discard unsaved changes?')) return;
  editor.value = '';
  currentFile = null;
  fileNameEl.textContent = 'Untitled';
  document.title = 'Untitled — Calmly Writer';
  isDirty = false;
  updateStats();
  setSaveStatus('', '');
  localStorage.removeItem('calmly-current');
}

async function openFile(name) {
  let file;
  try {
    file = await API.getFile(name);
  } catch {
    showToast('Connection lost. Could not open file.', 'error');
    return;
  }
  if (!file) {
    showToast('File not found', 'error');
    return;
  }
  editor.value = file.content;
  currentFile = name;
  fileNameEl.textContent = name;
  document.title = `${name} — Calmly Writer`;
  isDirty = false;
  updateStats();
  setSaveStatus('Saved', 'saved');
  closeModal();
  localStorage.setItem('calmly-current', JSON.stringify({ name, content: file.content }));
}

async function saveCurrentFile() {
  try {
    if (!currentFile) {
      const name = prompt('File name:', 'untitled.md');
      if (!name) return false;
      if (!name.toLowerCase().endsWith('.md')) currentFile = name + '.md';
      else currentFile = name;
      const ok = await API.createFile(currentFile, editor.value);
      if (!ok) {
        setSaveStatus('Error saving', 'error');
        showToast('Failed to save file', 'error');
        return false;
      }
      fileNameEl.textContent = currentFile;
      document.title = `${currentFile} — Calmly Writer`;
    } else {
      const ok = await API.saveFile(currentFile, editor.value);
      if (!ok) {
        setSaveStatus('Error saving', 'error');
        showToast('Failed to save file', 'error');
        return false;
      }
    }
    isDirty = false;
    setSaveStatus('Saved', 'saved');
    localStorage.setItem('calmly-current', JSON.stringify({ name: currentFile, content: editor.value }));
    return true;
  } catch {
    setSaveStatus('Error saving', 'error');
    showToast('Connection lost. Changes saved locally.', 'error');
    return false;
  }
}

async function saveAsFile() {
  const name = prompt('Save as:', currentFile || 'untitled.md');
  if (!name) return;
  const fname = name.toLowerCase().endsWith('.md') ? name : name + '.md';
  try {
    const exists = await API.getFile(fname);
    if (exists) {
      if (!confirm(`"${fname}" already exists. Overwrite?`)) return;
      const ok = await API.saveFile(fname, editor.value);
      if (!ok) { showToast('Failed to save file', 'error'); return; }
    } else {
      const ok = await API.createFile(fname, editor.value);
      if (!ok) { showToast('Failed to save file', 'error'); return; }
    }
    currentFile = fname;
    fileNameEl.textContent = fname;
    document.title = `${fname} — Calmly Writer`;
    isDirty = false;
    setSaveStatus('Saved', 'saved');
    updateStats();
  } catch {
    showToast('Connection lost. Could not save file.', 'error');
  }
}

function triggerAutoSave() {
  if (!currentFile) {
    isDirty = true;
    setSaveStatus('Unsaved', 'unsaved');
    return;
  }
  isDirty = true;
  setSaveStatus('Saving...', 'saving');
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveCurrentFile();
  }, 2000);
}

function updateStats() {
  const text = editor.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  wordCountEl.textContent = `${words} Word${words !== 1 ? 's' : ''}`;
  charCountEl.textContent = `${chars} Character${chars !== 1 ? 's' : ''}`;

  const readingTimeSecs = words === 0 ? 0 : Math.ceil((words / 270) * 60);
  const mins = Math.floor(readingTimeSecs / 60);
  const secs = readingTimeSecs % 60;
  readingTimeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} Reading Time`;
}

function applySmartQuotes(textarea) {
  const pos = textarea.selectionStart;
  const val = textarea.value;
  if (pos < 1) return false;

  const prevChar = val[pos - 1];

  if (settings.smartQuotes) {
    if (prevChar === '"') {
      const beforePrev = pos >= 2 ? val[pos - 2] : ' ';
      const isOpen = /\s[\(\[{]/.test(beforePrev) || pos === 1;
      const replacement = isOpen ? '\u201C' : '\u201D';
      textarea.setRangeText(replacement, pos - 1, pos, 'end');
      return true;
    }
    if (prevChar === "'") {
      const beforePrev = pos >= 2 ? val[pos - 2] : ' ';
      const isOpen = /\s[\(\[{]/.test(beforePrev) || pos === 1;
      const replacement = isOpen ? '\u2018' : '\u2019';
      textarea.setRangeText(replacement, pos - 1, pos, 'end');
      return true;
    }
  }

  if (settings.smartDashes) {
    if (pos >= 2 && val[pos - 2] === '-' && val[pos - 1] === '-') {
      textarea.setRangeText('\u2014', pos - 2, pos, 'end');
      return true;
    }
  }

  return false;
}

editor.addEventListener('input', () => {
  applySmartQuotes(editor);
  updateStats();
  triggerAutoSave();
});

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.setRangeText('  ', start, end, 'end');
  }
  if (e.repeat) return;
  if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {
    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
      playTypewriterSound(e.key === 'Enter');
    }
  }
});

function showToast(message, type = 'error', duration = 4000) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function sanitizeName(name) {
  const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '');
  return sanitized.toLowerCase().endsWith('.md') ? sanitized : sanitized + '.md';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function printDocument() {
  window.print();
}

function uploadLocalFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md,.txt,.html,.htm';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const content = await file.text();
    editor.value = content;
    currentFile = sanitizeName(file.name);
    fileNameEl.textContent = currentFile;
    document.title = `${currentFile} — Calmly Writer`;
    isDirty = true;
    updateStats();
    setSaveStatus('Unsaved', 'unsaved');
    closeModal();
  };
  input.click();
}

function downloadCurrentFile() {
  const content = editor.value;
  const name = currentFile || 'untitled.md';
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

async function confirmAndDeleteFile(name) {
  if (!confirm(`Delete "${name}" permanently?`)) return;
  try {
    const ok = await API.deleteFile(name);
    if (!ok) {
      showToast('Failed to delete file', 'error');
      return;
    }
    showToast(`"${name}" deleted`, 'success');
    if (currentFile === name) {
      editor.value = '';
      currentFile = null;
      fileNameEl.textContent = 'Untitled';
      document.title = 'Untitled — Calmly Writer';
      isDirty = false;
      setSaveStatus('', '');
      updateStats();
      localStorage.removeItem('calmly-current');
    }
    populateFileList();
  } catch {
    showToast('Connection lost. Could not delete file.', 'error');
  }
}

async function populateFileList() {
  const list = document.getElementById('file-list');
  list.innerHTML = '<li style="padding:16px;color:var(--text-secondary)">Loading...</li>';
  try {
    const files = await API.listFiles();
    list.innerHTML = '';
    if (files.length === 0) {
      list.innerHTML = '<li style="padding:16px;color:var(--text-secondary)">No files yet</li>';
      return;
    }
    files.forEach(f => {
      const li = document.createElement('li');
      li.className = 'file-item';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'file-item-name';
      nameSpan.textContent = f.name;
      nameSpan.addEventListener('click', () => openFile(f.name));
      const rightSpan = document.createElement('span');
      rightSpan.className = 'file-item-right';
      const dateSpan = document.createElement('span');
      dateSpan.className = 'file-date';
      dateSpan.textContent = new Date(f.modified).toLocaleDateString();
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-file';
      delBtn.title = `Delete ${f.name}`;
      delBtn.textContent = '×';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmAndDeleteFile(f.name);
      });
      rightSpan.appendChild(dateSpan);
      rightSpan.appendChild(delBtn);
      li.appendChild(nameSpan);
      li.appendChild(rightSpan);
      list.appendChild(li);
    });
  } catch {
    list.innerHTML = '<li style="padding:16px;color:var(--text-secondary)">Error loading files</li>';
  }
}

function openModal() {
  const el = document.getElementById('open-modal');
  el.classList.remove('hidden');
  populateFileList();
}

function closeModal() {
  document.getElementById('open-modal').classList.add('hidden');
}

// Typewriter sounds
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

function playTypewriterSound(isEnter = false) {
  if (!settings.typewriterSounds) return;
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

// Settings
function applySettings(s) {
  settings = { ...DEFAULT_SETTINGS, ...s };

  document.body.className = `theme-${s.theme}`;
  editor.style.maxWidth = s.textWidth + 'ch';
  editor.style.fontFamily = s.font;
  editor.style.fontSize = s.fontSize + 'px';
  editor.style.lineHeight = s.lineSpacing;
  editor.style.caretColor = s.caretColor;
  editor.style.color = s.fontColor;
  editor.spellcheck = s.spellCheck;

  document.getElementById('setting-theme').value = s.theme;
  document.getElementById('setting-textwidth').value = s.textWidth;
  document.getElementById('setting-textwidth-val').textContent = s.textWidth + 'ch';
  document.getElementById('setting-font').value = s.font;
  document.getElementById('setting-fontsize').value = s.fontSize;
  document.getElementById('setting-fontsize-val').textContent = s.fontSize + 'px';
  document.getElementById('setting-linespacing').value = s.lineSpacing;
  document.getElementById('setting-linespacing-val').textContent = s.lineSpacing;
  document.getElementById('setting-caretcolor').value = s.caretColor;
  document.getElementById('setting-fontcolor').value = s.fontColor;
  document.getElementById('setting-distractionfree').checked = s.distractionFree;
  document.getElementById('setting-smartquotes').checked = s.smartQuotes;
  document.getElementById('setting-smartdashes').checked = s.smartDashes;
  document.getElementById('setting-spellcheck').checked = s.spellCheck;
  document.getElementById('setting-typewriter').checked = s.typewriterSounds;

  document.body.classList.toggle('distraction-free', s.distractionFree);
}

function openSettings() {
  document.getElementById('settings-overlay').classList.remove('hidden');
  document.getElementById('settings-panel').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settings-overlay').classList.add('hidden');
  document.getElementById('settings-panel').classList.add('hidden');
}

function openShortcuts() {
  document.getElementById('shortcuts-modal').classList.remove('hidden');
}

function closeShortcuts() {
  document.getElementById('shortcuts-modal').classList.add('hidden');
}

function debouncedSaveSettings() {
  clearTimeout(settingsSaveTimeout);
  settingsSaveTimeout = setTimeout(async () => {
    try {
      await API.saveSettings(settings);
    } catch {
      showToast('Failed to save settings', 'error');
    }
  }, 500);
}

async function updateSetting(key, value) {
  settings[key] = value;
  try {
    await API.saveSettings(settings);
  } catch {
    showToast('Failed to save settings', 'error');
  }
  applySettings(settings);
}

// Settings event listeners
document.getElementById('setting-theme').addEventListener('change', (e) => {
  updateSetting('theme', e.target.value);
});
document.getElementById('setting-textwidth').addEventListener('input', (e) => {
  const v = e.target.value;
  document.getElementById('setting-textwidth-val').textContent = v + 'ch';
  editor.style.maxWidth = v + 'ch';
  settings.textWidth = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-font').addEventListener('change', (e) => {
  updateSetting('font', e.target.value);
});
document.getElementById('setting-fontsize').addEventListener('input', (e) => {
  const v = e.target.value;
  document.getElementById('setting-fontsize-val').textContent = v + 'px';
  editor.style.fontSize = v + 'px';
  settings.fontSize = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-linespacing').addEventListener('input', (e) => {
  const v = e.target.value;
  document.getElementById('setting-linespacing-val').textContent = v;
  editor.style.lineHeight = v;
  settings.lineSpacing = Number(v);
  debouncedSaveSettings();
});
document.getElementById('setting-caretcolor').addEventListener('input', (e) => {
  editor.style.caretColor = e.target.value;
  settings.caretColor = e.target.value;
  debouncedSaveSettings();
});
document.getElementById('setting-fontcolor').addEventListener('input', (e) => {
  editor.style.color = e.target.value;
  settings.fontColor = e.target.value;
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

// Toolbar buttons
document.getElementById('btn-new').addEventListener('click', newDocument);
document.getElementById('btn-open').addEventListener('click', openModal);
document.getElementById('btn-saveas').addEventListener('click', saveAsFile);
document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
document.getElementById('btn-print').addEventListener('click', printDocument);
document.getElementById('btn-download').addEventListener('click', downloadCurrentFile);
document.getElementById('btn-settings').addEventListener('click', openSettings);
document.getElementById('btn-close-settings').addEventListener('click', closeSettings);
document.getElementById('settings-overlay').addEventListener('click', closeSettings);
document.getElementById('btn-upload-file').addEventListener('click', uploadLocalFile);

// Modal close buttons
document.querySelectorAll('.btn-close-modal, #open-modal .modal-backdrop').forEach(el => {
  el.addEventListener('click', closeModal);
});
document.getElementById('btn-shortcuts').addEventListener('click', openShortcuts);
document.getElementById('btn-close-shortcuts').addEventListener('click', closeShortcuts);
document.getElementById('shortcuts-backdrop').addEventListener('click', closeShortcuts);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const mod = e.altKey || e.metaKey;
  if (mod && e.code === 'KeyN') { e.preventDefault(); newDocument(); }
  else if (mod && e.code === 'KeyO') { e.preventDefault(); openModal(); }
  else if (mod && e.shiftKey && e.code === 'KeyS') { e.preventDefault(); saveAsFile().catch(console.error); }
  else if (mod && e.code === 'KeyS') { e.preventDefault(); saveCurrentFile().catch(console.error); }
  else if (mod && e.code === 'KeyP') { e.preventDefault(); printDocument(); }
  else if (mod && e.code === 'Comma') { e.preventDefault(); openSettings(); }
  else if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
  else if (mod && e.shiftKey && e.code === 'KeyF') { e.preventDefault(); toggleDistractionFree(); }
  else if (e.key === '?' && document.activeElement !== editor) { e.preventDefault(); openShortcuts(); }
});

function toggleDistractionFree() {
  const el = document.getElementById('setting-distractionfree');
  el.checked = !el.checked;
  el.dispatchEvent(new Event('change'));
}

// Init
async function init() {
  try {
    settings = await API.getSettings();
  } catch {
    settings = {};
    showToast('Could not load settings. Using defaults.', 'info');
  }
  applySettings(settings);

  const saved = localStorage.getItem('calmly-current');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      editor.value = parsed.content || '';
      if (parsed.name) {
        currentFile = parsed.name;
        fileNameEl.textContent = parsed.name;
        setSaveStatus('Saved', 'saved');
        document.title = `${parsed.name} — Calmly Writer`;
      }
      updateStats();
    } catch {}
  }

  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

init();
