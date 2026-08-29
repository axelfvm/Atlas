'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_WINDOW_STATE = Object.freeze({ isMaximized: true });

function parseWindowState(content) {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed?.isMaximized !== 'boolean') {
      return { ...DEFAULT_WINDOW_STATE };
    }
    return {
      isMaximized: parsed.isMaximized,
    };
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
}

function loadWindowState(filePath) {
  try {
    return parseWindowState(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
}

function saveWindowState(filePath, state) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `${JSON.stringify({ isMaximized: state?.isMaximized === true }, null, 2)}\n`,
      'utf8',
    );
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  DEFAULT_WINDOW_STATE,
  loadWindowState,
  parseWindowState,
  saveWindowState,
};
