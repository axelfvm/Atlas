'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { HOME_URL, isHttpUrl, resolveNavigation } = require('../src/navigation');

test('uses the home page for an empty address', () => {
  assert.equal(resolveNavigation('   '), HOME_URL);
});

test('keeps valid HTTP and HTTPS addresses', () => {
  assert.equal(resolveNavigation('https://example.com/path'), 'https://example.com/path');
  assert.equal(resolveNavigation('http://example.com'), 'http://example.com/');
});

test('adds HTTPS to a domain', () => {
  assert.equal(resolveNavigation('example.com/docs'), 'https://example.com/docs');
});

test('uses HTTP for localhost development addresses', () => {
  assert.equal(resolveNavigation('localhost:3000/test'), 'http://localhost:3000/test');
});

test('turns ordinary text into a search', () => {
  assert.equal(
    resolveNavigation('mitologia de Atlas'),
    'https://duckduckgo.com/?q=mitologia%20de%20Atlas',
  );
});

test('does not accept privileged protocols as web URLs', () => {
  assert.equal(isHttpUrl('file:///C:/Windows/System32'), false);
  assert.equal(isHttpUrl('javascript:alert(1)'), false);
  assert.equal(isHttpUrl('https://example.com'), true);
});
