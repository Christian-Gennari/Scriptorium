const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(name) {
  let safe = path.basename(name).replace(/[^\p{L}\p{N}._-]/gu, '');
  if (!safe) safe = 'untitled';
  if (!safe.toLowerCase().endsWith('.md')) safe += '.md';
  return path.join(DATA_DIR, safe);
}

app.get('/api/files', (req, res) => {
  ensureDataDir();
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f,
        path: f,
        size: fs.statSync(path.join(DATA_DIR, f)).size,
        modified: fs.statSync(path.join(DATA_DIR, f)).mtime,
      }));
    res.json(files);
  } catch (err) {
    console.error('Failed to list files:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.get('/api/files/:name', (req, res) => {
  ensureDataDir();
  const fp = filePath(req.params.name);
  try {
    if (!fs.existsSync(fp)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const content = fs.readFileSync(fp, 'utf-8');
    res.json({ name: path.basename(fp), content });
  } catch (err) {
    console.error('Failed to read file:', err);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.post('/api/files', (req, res) => {
  ensureDataDir();
  const { name, content } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const fp = filePath(name);
  if (fs.existsSync(fp)) {
    return res.status(409).json({ error: 'File already exists' });
  }
  try {
    fs.writeFileSync(fp, content || '', 'utf-8');
    res.status(201).json({ name: path.basename(fp), path: path.basename(fp) });
  } catch (err) {
    console.error('Failed to create file:', err);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

app.put('/api/files/:name', (req, res) => {
  ensureDataDir();
  const fp = filePath(req.params.name);
  const { content } = req.body;
  if (content === undefined) return res.status(400).json({ error: 'Content is required' });
  try {
    fs.writeFileSync(fp, content, 'utf-8');
    res.json({ name: path.basename(fp), saved: true });
  } catch (err) {
    console.error('Failed to save file:', err);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.delete('/api/files/:name', (req, res) => {
  ensureDataDir();
  const fp = filePath(req.params.name);
  try {
    if (!fs.existsSync(fp)) {
      return res.status(404).json({ error: 'File not found' });
    }
    fs.unlinkSync(fp);
    res.json({ name: path.basename(fp), deleted: true });
  } catch (err) {
    console.error('Failed to delete file:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/settings', (req, res) => {
  ensureDataDir();
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return res.json(DEFAULT_SETTINGS);
    }
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    res.json({ ...DEFAULT_SETTINGS, ...settings });
  } catch (err) {
    console.error('Failed to read settings:', err);
    res.json(DEFAULT_SETTINGS);
  }
});

const SETTINGS_TYPES = {
  theme: 'string',
  textWidth: 'number',
  font: 'string',
  fontSize: 'number',
  lineSpacing: 'number',
  caretColor: 'string',
  fontColor: 'string',
  distractionFree: 'boolean',
  smartQuotes: 'boolean',
  smartDashes: 'boolean',
  spellCheck: 'boolean',
  typewriterSounds: 'boolean',
};

app.put('/api/settings', (req, res) => {
  ensureDataDir();
  try {
    const current = fs.existsSync(SETTINGS_FILE)
      ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
      : {};
    const validated = {};
    for (const [key, expectedType] of Object.entries(SETTINGS_TYPES)) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] === expectedType) {
          validated[key] = req.body[key];
        }
      }
    }
    const updated = { ...DEFAULT_SETTINGS, ...current, ...validated };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    res.json(updated);
  } catch (err) {
    console.error('Failed to save settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

ensureDataDir();

app.listen(PORT, () => {
  console.log(`CalmlyWriterClone running at http://localhost:${PORT}`);
});
