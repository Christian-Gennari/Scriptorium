export const editor = document.getElementById('editor');
export const fileNameEl = document.getElementById('file-name');
export const wordCountEl = document.getElementById('word-count');
export const charCountEl = document.getElementById('char-count');
export const readingTimeEl = document.getElementById('reading-time');
export const saveStatusEl = document.getElementById('save-status');
export const editorContainer = document.getElementById('editor-container');

export const state = {
  currentFile: null,
  settings: {},
  saveTimeout: null,
  settingsSaveTimeout: null,
  isDirty: false,
};
