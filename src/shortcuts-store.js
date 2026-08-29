'use strict';

const fs = require('node:fs');
const path = require('node:path');

function normalizeShortcut(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.id !== 'string' || !value.id || value.id.length > 100) return null;
  if (typeof value.title !== 'string' || typeof value.url !== 'string') return null;

  try {
    const url = new URL(value.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    return {
      id: value.id,
      title: value.title.trim().slice(0, 120) || url.hostname,
      url: url.toString(),
    };
  } catch {
    return null;
  }
}

function parseShortcutsStore(content) {
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed?.shortcuts)) return [];

    const seenIds = new Set();
    const seenUrls = new Set();
    const shortcuts = [];

    for (const candidate of parsed.shortcuts) {
      const shortcut = normalizeShortcut(candidate);
      if (!shortcut || seenIds.has(shortcut.id) || seenUrls.has(shortcut.url)) continue;
      seenIds.add(shortcut.id);
      seenUrls.add(shortcut.url);
      shortcuts.push(shortcut);
    }

    return shortcuts;
  } catch {
    return [];
  }
}

function loadShortcuts(filePath) {
  try {
    return parseShortcutsStore(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function saveShortcuts(filePath, shortcuts) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify({ shortcuts }, null, 2)}\n`, 'utf8');
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  loadShortcuts,
  normalizeShortcut,
  parseShortcutsStore,
  saveShortcuts,
};
