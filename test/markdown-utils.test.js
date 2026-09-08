import test from 'node:test';
import assert from 'node:assert/strict';

import '../markdown-utils.js';

const { calculateStats, cleanMarkdownText } = globalThis.MarkdownUtils;

test('cleanMarkdownText normalizes Windows and old Mac line endings', () => {
  assert.equal(cleanMarkdownText('# Title\r\nLine 1\rLine 2'), '# Title\nLine 1\nLine 2');
});

test('cleanMarkdownText removes control and zero-width characters', () => {
  assert.equal(cleanMarkdownText('hello\u0000\u200Bworld\t!'), 'helloworld\t!');
});

test('cleanMarkdownText handles empty input', () => {
  assert.equal(cleanMarkdownText(''), '');
  assert.equal(cleanMarkdownText(null), '');
});

test('calculateStats counts characters, lines, and reading time', () => {
  assert.deepEqual(calculateStats('abc\ndef'), {
    chars: 7,
    lines: 2,
    minutes: 1,
  });

  assert.equal(calculateStats('a'.repeat(501)).minutes, 2);
});

test('calculateStats reports zero lines for empty content', () => {
  assert.deepEqual(calculateStats(''), {
    chars: 0,
    lines: 0,
    minutes: 1,
  });
});
