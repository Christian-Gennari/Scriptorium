export const API = {
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
