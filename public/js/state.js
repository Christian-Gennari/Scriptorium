export const editorEl = document.getElementById('editor');
export const fileNameEl = document.getElementById('file-name');
export const wordCountEl = document.getElementById('word-count');
export const charCountEl = document.getElementById('char-count');
export const readingTimeEl = document.getElementById('reading-time');
export const saveStatusEl = document.getElementById('save-status');
export const editorContainer = document.getElementById('editor-container');
export const floatingWordCount = document.getElementById('floating-word-count');
export const floatingCharCount = document.getElementById('floating-char-count');
export const floatingReadingTime = document.getElementById('floating-reading-time');

export let tiptapEditor = null;

export function setTiptapEditor(ed) {
  tiptapEditor = ed;
}

export const state = {
  currentFile: null,
  settings: {},
  saveTimeout: null,
  settingsSaveTimeout: null,
  isDirty: false,
};
