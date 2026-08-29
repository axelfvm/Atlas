'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeShortcut, parseShortcutsStore } = require('../src/shortcuts-store');

test('starts with no shortcuts when the store does not exist or is invalid', () => {
  assert.deepEqual(parseShortcutsStore('invalid'), []);
  assert.deepEqual(parseShortcutsStore('{}'), []);
});

test('accepts user-created HTTP and HTTPS shortcuts', () => {
  assert.deepEqual(
    normalizeShortcut({ id: 'one', title: ' Atlas ', url: 'https://example.com' }),
    { id: 'one', title: 'Atlas', url: 'https://example.com/' },
  );
  assert.equal(normalizeShortcut({ id: 'two', title: 'Arquivo', url: 'file:///C:/test' }), null);
});

test('filters duplicated and unsafe stored shortcuts', () => {
  const content = JSON.stringify({
    shortcuts: [
      { id: 'one', title: 'Primeiro', url: 'https://example.com' },
      { id: 'two', title: 'Duplicado', url: 'https://example.com/' },
      { id: 'three', title: 'Script', url: 'javascript:alert(1)' },
    ],
  });

  assert.deepEqual(parseShortcutsStore(content), [
    { id: 'one', title: 'Primeiro', url: 'https://example.com/' },
  ]);
});
