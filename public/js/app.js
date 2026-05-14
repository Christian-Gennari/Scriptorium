import { state, editorEl, fileNameEl, tiptapEditor } from './state.js';
import { API } from './api.js';
import { showToast, setSaveStatus, updateStats, toggleSidebar, closeSidebar, toggleFullscreen, printDocument } from './ui.js';
import { applySettings, openSettings, closeSettings, openShortcuts, closeShortcuts, toggleDistractionFree } from './settings.js';
import { newDocument, openModal, saveCurrentFile, saveAsFile, uploadLocalFile, downloadCurrentFile, closeModal } from './files.js';
import { initEditor } from './editor.js';
import { initToc, closeToc } from './toc.js';
import { preloadSamples } from './audio.js';

document.getElementById('btn-new').addEventListener('click', newDocument);
document.getElementById('btn-open').addEventListener('click', openModal);
document.getElementById('btn-saveas').addEventListener('click', saveAsFile);
document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
document.getElementById('btn-print').addEventListener('click', printDocument);
document.getElementById('btn-download').addEventListener('click', downloadCurrentFile);
document.getElementById('btn-settings').addEventListener('click', openSettings);
document.getElementById('btn-back-settings').addEventListener('click', closeSettings);
document.getElementById('btn-upload-file').addEventListener('click', uploadLocalFile);
document.getElementById('btn-menu-toggle').addEventListener('click', toggleSidebar);
document.getElementById('sidebar-hitbox').addEventListener('click', toggleSidebar);
document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebar);

document.querySelectorAll('.btn-close-modal').forEach(el => {
  el.addEventListener('click', closeModal);
});
document.getElementById('open-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});
document.getElementById('btn-shortcuts').addEventListener('click', openShortcuts);
document.getElementById('btn-close-shortcuts').addEventListener('click', closeShortcuts);
document.getElementById('shortcuts-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeShortcuts();
});

document.addEventListener('keydown', (e) => {
  const mod = e.altKey || e.metaKey;
  if (mod && e.code === 'KeyN') { e.preventDefault(); newDocument(); }
  else if (mod && e.code === 'KeyO') { e.preventDefault(); openModal(); }
  else if (mod && e.shiftKey && e.code === 'KeyS') { e.preventDefault(); saveAsFile().catch(console.error); }
  else if (mod && e.code === 'KeyS') { e.preventDefault(); saveCurrentFile().catch(console.error); }
  else if (mod && e.code === 'KeyP') { e.preventDefault(); printDocument(); }
  else if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
  else if (mod && e.shiftKey && e.code === 'KeyF') { e.preventDefault(); toggleDistractionFree(); }
  else if (mod && e.code === 'Digit1') { e.preventDefault(); tiptapEditor?.chain().focus().toggleHeading({ level: 1 }).run(); }
  else if (mod && e.code === 'Digit2') { e.preventDefault(); tiptapEditor?.chain().focus().toggleHeading({ level: 2 }).run(); }
  else if (mod && e.code === 'Digit3') { e.preventDefault(); tiptapEditor?.chain().focus().toggleHeading({ level: 3 }).run(); }
  else if (mod && e.code === 'KeyQ') { e.preventDefault(); tiptapEditor?.chain().focus().toggleBlockquote().run(); }
  else if (e.key === 'Escape') {
    if (!document.getElementById('shortcuts-modal').classList.contains('hidden')) { closeShortcuts(); return; }
    if (!document.getElementById('open-modal').classList.contains('hidden')) { closeModal(); return; }
    if (!document.getElementById('dialog-modal').classList.contains('hidden')) { return; }
    if (closeToc()) return;
    const s = document.getElementById('sidebar');
    if (s.classList.contains('show-settings')) { closeSettings(); }
    else if (s.classList.contains('open')) { closeSidebar(); }
  }
  else if (e.key === '?' && !document.activeElement?.closest('#editor')) { e.preventDefault(); openShortcuts(); }
  else if (mod && e.code === 'KeyM') { e.preventDefault(); toggleSidebar(); }
});

async function init() {
  try {
    state.settings = await API.getSettings();
  } catch {
    state.settings = {};
    showToast('Could not load settings. Using defaults.', 'info');
  }
  applySettings(state.settings);

  let initialContent = '';
  const oldDraft = localStorage.getItem('calmly-current');
  if (oldDraft) {
    localStorage.setItem('scriptorium-draft', oldDraft);
    localStorage.removeItem('calmly-current');
  }
  const saved = localStorage.getItem('scriptorium-draft');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      initialContent = parsed.content || '';
      if (parsed.name) {
        state.currentFile = parsed.name;
        fileNameEl.textContent = parsed.name;
        setSaveStatus('Saved', 'saved');
        document.title = `${parsed.name} \u2014 Scriptorium`;
      }
    } catch {}
  }

  initEditor(initialContent);
  applySettings(state.settings);
  initToc();
  updateStats();
  preloadSamples();

  window.addEventListener('beforeunload', (e) => {
    if (state.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

init();
