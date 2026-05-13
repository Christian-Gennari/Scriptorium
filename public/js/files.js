import { state, tiptapEditor, fileNameEl } from './state.js';
import { API } from './api.js';
import { showToast, showDialog, setSaveStatus, updateStats } from './ui.js';
import { htmlToMarkdown, markdownToHtml } from './markdown.js';

function sanitizeName(name) {
  const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '');
  return sanitized.toLowerCase().endsWith('.md') ? sanitized : sanitized + '.md';
}

function getMarkdown() {
  if (!tiptapEditor) return '';
  return htmlToMarkdown(tiptapEditor.getHTML());
}

async function saveFileWithOverwrite(fname, content) {
  try {
    const exists = await API.getFile(fname);
    if (exists) {
      if (!await showDialog({ title: 'Overwrite', message: `"${fname}" already exists. Overwrite?`, confirmLabel: 'Overwrite' })) return null;
      return await API.saveFile(fname, content);
    }
    return await API.createFile(fname, content);
  } catch {
    return false;
  }
}

function setContent(md) {
  if (!tiptapEditor) return;
  state._suppressDirty = true;
  tiptapEditor.commands.setContent(markdownToHtml(md));
  state._suppressDirty = false;
}

function clearContent() {
  if (!tiptapEditor) return;
  state._suppressDirty = true;
  tiptapEditor.commands.clearContent();
  state._suppressDirty = false;
}

export async function newDocument() {
  if (state.isDirty && !await showDialog({ title: 'New Document', message: 'Discard unsaved changes?' })) return;
  clearContent();
  state.currentFile = null;
  fileNameEl.textContent = 'Untitled';
  document.title = 'Untitled \u2014 Scriptorium';
  state.isDirty = false;
  updateStats();
  setSaveStatus('', '');
  localStorage.removeItem('scriptorium-draft');
}

export async function openFile(name) {
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
  state.currentFile = name;
  fileNameEl.textContent = name;
  document.title = `${name} \u2014 Scriptorium`;
  setContent(file.content);
  state.isDirty = false;
  updateStats();
  setSaveStatus('Saved', 'saved');
  closeModal();
  localStorage.setItem('scriptorium-draft', JSON.stringify({ name, content: file.content }));
}

export async function saveCurrentFile() {
  try {
    const md = getMarkdown();
    if (!state.currentFile) {
      const name = await showDialog({ title: 'Save', message: 'File name:', prompt: 'untitled.md', confirmLabel: 'Save' });
      if (!name) return false;
      const fname = name.toLowerCase().endsWith('.md') ? name : name + '.md';
      const result = await saveFileWithOverwrite(fname, md);
      if (result === null) return false;
      if (!result) {
        setSaveStatus('Error saving', 'error');
        showToast('Failed to save file', 'error');
        return false;
      }
      state.currentFile = fname;
      fileNameEl.textContent = fname;
      document.title = `${fname} \u2014 Scriptorium`;
    } else {
      const ok = await API.saveFile(state.currentFile, md);
      if (!ok) {
        setSaveStatus('Error saving', 'error');
        showToast('Failed to save file', 'error');
        return false;
      }
    }
    state.isDirty = false;
    setSaveStatus('Saved', 'saved');
    localStorage.setItem('scriptorium-draft', JSON.stringify({ name: state.currentFile, content: md }));
    return true;
  } catch {
    setSaveStatus('Error saving', 'error');
    showToast('Connection lost. Changes saved locally.', 'error');
    return false;
  }
}

export async function saveAsFile() {
  return new Promise((resolve) => {
    const modal = document.getElementById('saveas-modal');
    const input = document.getElementById('saveas-input');
    const confirmBtn = document.getElementById('saveas-confirm');
    const cancelBtn = document.getElementById('saveas-cancel');
    const closeBtn = document.querySelector('.btn-close-saveas');
    const backdrop = document.getElementById('saveas-backdrop');

    input.value = state.currentFile || 'untitled.md';
    modal.classList.remove('hidden');
    setTimeout(() => { input.focus(); input.select(); }, 50);

    async function onConfirm() {
      const name = input.value.trim();
      if (!name) { cleanup(); resolve(false); return; }
      const fname = name.toLowerCase().endsWith('.md') ? name : name + '.md';
      const md = getMarkdown();
      confirmBtn.disabled = true;
      const result = await saveFileWithOverwrite(fname, md);
      cleanup();
      if (result === null) { resolve(false); return; }
      if (!result) { showToast('Failed to save file', 'error'); resolve(false); return; }
      state.currentFile = fname;
      fileNameEl.textContent = fname;
      document.title = `${fname} \u2014 Scriptorium`;
      state.isDirty = false;
      setSaveStatus('Saved', 'saved');
      localStorage.setItem('scriptorium-draft', JSON.stringify({ name: fname, content: md }));
      updateStats();
      resolve(true);
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    function cleanup() {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      backdrop.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onInputKey);
      modal.removeEventListener('keydown', onModalKey);
    }

    function onInputKey(e) {
      if (e.key === 'Enter') onConfirm();
    }

    function onModalKey(e) {
      if (e.key === 'Escape') onCancel();
    }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    backdrop.addEventListener('click', onCancel);
    input.addEventListener('keydown', onInputKey);
    modal.addEventListener('keydown', onModalKey);
  });
}

export function triggerAutoSave() {
  if (!state.currentFile) {
    state.isDirty = true;
    setSaveStatus('Unsaved', 'unsaved');
    return;
  }
  state.isDirty = true;
  setSaveStatus('Saving...', 'saving');
  clearTimeout(state.saveTimeout);
  state.saveTimeout = setTimeout(() => {
    saveCurrentFile();
  }, 2000);
}

export async function uploadLocalFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md,.txt,.html,.htm';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const content = await file.text();
    const name = sanitizeName(file.name);

    const exists = await API.getFile(name);
    if (exists) {
      if (!await showDialog({ title: 'Overwrite', message: `"${name}" already exists. Overwrite?`, confirmLabel: 'Overwrite' })) {
        setContent(content);
        state.currentFile = null;
        fileNameEl.textContent = 'Untitled';
        state.isDirty = true;
        setSaveStatus('Unsaved', 'unsaved');
        closeModal();
        return;
      }
    }

    setContent(content);
    state.currentFile = name;
    fileNameEl.textContent = name;
    document.title = `${name} \u2014 Scriptorium`;
    state.isDirty = true;
    updateStats();
    setSaveStatus('Unsaved', 'unsaved');
    closeModal();
  };
  input.click();
}

export function downloadCurrentFile() {
  const content = getMarkdown();
  const name = state.currentFile || 'untitled.md';
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function confirmAndDeleteFile(name) {
  if (!await showDialog({ title: 'Delete', message: `Delete "${name}" permanently?`, confirmLabel: 'Delete' })) return;
  try {
    const ok = await API.deleteFile(name);
    if (!ok) {
      showToast('Failed to delete file', 'error');
      return;
    }
    showToast(`"${name}" deleted`, 'success');
    if (state.currentFile === name) {
      clearContent();
      state.currentFile = null;
      fileNameEl.textContent = 'Untitled';
      document.title = 'Untitled \u2014 Scriptorium';
      state.isDirty = false;
      setSaveStatus('', '');
      updateStats();
      localStorage.removeItem('scriptorium-draft');
    }
    populateFileList();
  } catch {
    showToast('Connection lost. Could not delete file.', 'error');
  }
}

let cachedFiles = [];

export async function populateFileList() {
  const list = document.getElementById('file-list');
  list.innerHTML = '<li class="file-item file-item--loading">Loading...</li>';
  try {
    const files = await API.listFiles();
    cachedFiles = files.slice().sort((a, b) => new Date(b.modified) - new Date(a.modified));
    renderFileList(document.getElementById('file-search-input').value);
  } catch {
    list.innerHTML = '<li class="file-item file-item--loading">Error loading files</li>';
  }
}

function renderFileList(query) {
  const list = document.getElementById('file-list');
  const filtered = query
    ? cachedFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    : cachedFiles;

  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = `<li class="file-item file-item--empty">${cachedFiles.length ? 'No matches' : 'No files yet'}</li>`;
    return;
  }

  filtered.forEach(f => {
    const li = document.createElement('li');
    li.className = 'file-item';
    if (f.name === state.currentFile) li.classList.add('file-item--current');

    const icon = document.createElement('span');
    icon.className = 'file-item-icon';
    icon.innerHTML = '<svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M2 1h6l5 5v9H2V1z" stroke="currentColor" stroke-width="1.2"/><path d="M8 1v5h5" stroke="currentColor" stroke-width="1.2"/></svg>';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-item-name';
    nameSpan.textContent = f.name;
    nameSpan.addEventListener('click', () => openFile(f.name));

    const dateSpan = document.createElement('span');
    dateSpan.className = 'file-item-date';
    dateSpan.textContent = new Date(f.modified).toLocaleDateString();

    const delBtn = document.createElement('button');
    delBtn.className = 'file-item-delete';
    delBtn.title = `Delete ${f.name}`;
    delBtn.innerHTML = '&times;';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmAndDeleteFile(f.name);
    });

    li.appendChild(icon);
    li.appendChild(nameSpan);
    li.appendChild(dateSpan);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

export function openModal() {
  const input = document.getElementById('file-search-input');
  input.value = '';
  document.getElementById('open-modal').classList.remove('hidden');
  populateFileList();
  setTimeout(() => input.focus(), 100);
}

export function closeModal() {
  document.getElementById('open-modal').classList.add('hidden');
}

let renameInput = null;

export function initiateRename() {
  if (renameInput) return;
  const currentName = state.currentFile;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'rename-input';
  input.value = currentName ? currentName.replace(/\.md$/i, '') : '';
  fileNameEl.style.display = 'none';
  fileNameEl.parentNode.insertBefore(input, fileNameEl.nextSibling);
  renameInput = input;
  input.focus();
  input.select();

  async function commit() {
    if (!renameInput) return;
    const el = renameInput;
    renameInput = null;
    let newName = el.value.trim();
    el.remove();
    fileNameEl.style.display = '';
    if (!newName) return;
    if (!newName.toLowerCase().endsWith('.md')) newName += '.md';

    const md = getMarkdown();
    const result = await saveFileWithOverwrite(newName, md);
    if (result === null) return;
    if (!result) { showToast(currentName === null ? 'Could not create file' : 'Rename failed', 'error'); return; }

    try {
      if (currentName !== null) {
        await API.deleteFile(currentName);
      }
      state.currentFile = newName;
      fileNameEl.textContent = newName;
      document.title = `${newName} \u2014 Scriptorium`;
      setSaveStatus('Saved', 'saved');
      showToast(currentName === null ? `Created "${newName}"` : `Renamed to "${newName}"`, 'success');
    } catch {
      showToast('File saved but failed to update state', 'error');
    }
  }

  function cancel() {
    if (!renameInput) return;
    renameInput.remove();
    renameInput = null;
    fileNameEl.style.display = '';
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', commit);
}

fileNameEl.addEventListener('click', initiateRename);

document.getElementById('file-search-input').addEventListener('input', () => {
  renderFileList(document.getElementById('file-search-input').value);
});
