import { state, tiptapEditor, wordCountEl, charCountEl, readingTimeEl, saveStatusEl, floatingWordCount, floatingCharCount, floatingReadingTime } from './state.js';

export function showToast(message, type = 'error', duration = 4000) {
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

export function showDialog({ title, message, prompt: promptDefault, confirmLabel, confirmClass }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('dialog-overlay');
    const modal = document.getElementById('dialog-modal');
    const titleEl = document.getElementById('dialog-title');
    const messageEl = document.getElementById('dialog-message');
    const inputField = document.getElementById('dialog-prompt-field');
    const inputEl = document.getElementById('dialog-input');
    const confirmBtn = document.getElementById('dialog-confirm');
    const cancelBtn = document.getElementById('dialog-cancel');
    const closeBtn = document.getElementById('dialog-close');

    titleEl.textContent = title || 'Confirm';
    messageEl.textContent = message;
    confirmBtn.textContent = confirmLabel || 'OK';

    if (promptDefault !== undefined) {
      inputField.classList.remove('hidden');
      inputEl.value = promptDefault || '';
    } else {
      inputField.classList.add('hidden');
      inputEl.value = '';
    }

    confirmBtn.className = promptDefault !== undefined
      ? 'dialog-btn-primary'
      : (confirmClass || 'dialog-btn-primary');

    modal.classList.toggle('dialog-modal--prompt', promptDefault !== undefined);

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    if (promptDefault !== undefined) {
      setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
    }

    function cleanup() {
      modal.classList.remove('dialog-modal--prompt');
      overlay.classList.add('hidden');
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onCancel);
      inputEl.removeEventListener('keydown', onInputKey);
    }

    function onConfirm() {
      const value = promptDefault !== undefined ? inputEl.value : true;
      cleanup();
      resolve(value);
    }

    function onCancel() {
      cleanup();
      resolve(promptDefault !== undefined ? null : false);
    }

    function onInputKey(e) {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onCancel);
    inputEl.addEventListener('keydown', onInputKey);
  });
}

export function setSaveStatus(text, type) {
  saveStatusEl.textContent = text;
  saveStatusEl.className = type ? `save-status--${type}` : '';

}

export function updateStats() {
  const text = tiptapEditor ? tiptapEditor.state.doc.textContent : '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const wordStr = `${words} Word${words !== 1 ? 's' : ''}`;
  const charStr = `${chars} Character${chars !== 1 ? 's' : ''}`;
  wordCountEl.textContent = wordStr;
  charCountEl.textContent = charStr;
  if (floatingWordCount) floatingWordCount.textContent = wordStr;
  if (floatingCharCount) floatingCharCount.textContent = charStr;

  const readingTimeSecs = words === 0 ? 0 : Math.ceil((words / 270) * 60);
  const mins = Math.floor(readingTimeSecs / 60);
  const secs = readingTimeSecs % 60;
  const readingStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} Reading Time`;
  readingTimeEl.textContent = readingStr;
  if (floatingReadingTime) floatingReadingTime.textContent = readingStr;
}

export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const btn = document.getElementById('btn-menu-toggle');
  const isOpen = sidebar.classList.toggle('open');
  backdrop.classList.toggle('open', isOpen);
  btn.textContent = isOpen ? '\u2715' : '\u2630';
  btn.classList.toggle('sidebar-open', isOpen);
}

export function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const btn = document.getElementById('btn-menu-toggle');
  sidebar.classList.remove('open', 'show-settings');
  backdrop.classList.remove('open');
  btn.textContent = '\u2630';
  btn.classList.remove('sidebar-open');
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

export function printDocument() {
  window.print();
}
