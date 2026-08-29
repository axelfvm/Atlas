'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_WINDOW_STATE, parseWindowState } = require('../src/window-state');

test('restores a maximized window state', () => {
  assert.deepEqual(parseWindowState('{"isMaximized":true}'), { isMaximized: true });
});

test('restores an explicitly non-maximized window state', () => {
  assert.deepEqual(parseWindowState('{"isMaximized":false}'), { isMaximized: false });
});

test('uses the default maximized state for invalid or unknown data', () => {
  assert.deepEqual(parseWindowState('invalid json'), DEFAULT_WINDOW_STATE);
  assert.deepEqual(parseWindowState('{"isMaximized":"yes"}'), DEFAULT_WINDOW_STATE);
});
