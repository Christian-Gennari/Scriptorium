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
      if (!name.toLowerCase().endsWith('.md')) state.currentFile = name + '.md';
      else state.currentFile = name;
      const ok = await API.createFile(state.currentFile, md);
      if (!ok) {
        setSaveStatus('Error saving', 'error');
        showToast('Failed to save file', 'error');
        return false;
      }
      fileNameEl.textContent = state.currentFile;
      document.title = `${state.currentFile} \u2014 Scriptorium`;
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
  const name = await showDialog({ title: 'Save As', message: 'Save as:', prompt: state.currentFile || 'untitled.md', confirmLabel: 'Save' });
  if (!name) return;
  const fname = name.toLowerCase().endsWith('.md') ? name : name + '.md';
  try {
    const md = getMarkdown();
    const exists = await API.getFile(fname);
    if (exists) {
      if (!await showDialog({ title: 'Overwrite', message: `"${fname}" already exists. Overwrite?`, confirmLabel: 'Overwrite', confirmClass: 'dialog-btn-primary' })) return;
      const ok = await API.saveFile(fname, md);
      if (!ok) { showToast('Failed to save file', 'error'); return; }
    } else {
      const ok = await API.createFile(fname, md);
      if (!ok) { showToast('Failed to save file', 'error'); return; }
    }
    state.currentFile = fname;
    fileNameEl.textContent = fname;
    document.title = `${fname} \u2014 Scriptorium`;
    state.isDirty = false;
    setSaveStatus('Saved', 'saved');
    localStorage.setItem('scriptorium-draft', JSON.stringify({ name: fname, content: md }));
    updateStats();
  } catch {
    showToast('Connection lost. Could not save file.', 'error');
  }
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

export function uploadLocalFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md,.txt,.html,.htm';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const content = await file.text();
    setContent(content);
    state.currentFile = sanitizeName(file.name);
    fileNameEl.textContent = state.currentFile;
    document.title = `${state.currentFile} \u2014 Scriptorium`;
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

export async function populateFileList() {
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
      if (f.name === state.currentFile) nameSpan.classList.add('current-file');
      nameSpan.addEventListener('click', () => openFile(f.name));
      const rightSpan = document.createElement('span');
      rightSpan.className = 'file-item-right';
      const dateSpan = document.createElement('span');
      dateSpan.className = 'file-date';
      dateSpan.textContent = new Date(f.modified).toLocaleDateString();
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-file';
      delBtn.title = `Delete ${f.name}`;
      delBtn.textContent = '\u00D7';
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

export function openModal() {
  document.getElementById('open-modal').classList.remove('hidden');
  populateFileList();
}

export function closeModal() {
  document.getElementById('open-modal').classList.add('hidden');
}

let renameInput = null;

export function initiateRename() {
  if (renameInput) return;
  const currentName = state.currentFile;
  if (!currentName) { saveAsFile(); return; }

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'rename-input';
  input.value = currentName.replace(/\.md$/i, '');
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
    if (!newName || newName === currentName.replace(/\.md$/i, '')) return;
    if (!newName.toLowerCase().endsWith('.md')) newName += '.md';
    if (newName === currentName) return;

    try {
      const md = getMarkdown();
      const created = await API.createFile(newName, md);
      if (!created) { showToast('Could not create file', 'error'); return; }
      await API.deleteFile(currentName);
      state.currentFile = newName;
      fileNameEl.textContent = newName;
      document.title = `${newName} \u2014 Scriptorium`;
      setSaveStatus('Saved', 'saved');
      showToast(`Renamed to "${newName}"`, 'success');
    } catch {
      showToast('Rename failed', 'error');
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
