const test = require('node:test');
const assert = require('node:assert');
const L = require('../lrcsync.js');

const src = '[ti:Song]\n[00:01.00]a\n[01:02.50][01:05.00]b <00:01.20>c\n[00:00.30]d';

test('shift rewrites line and word timestamps', () => {
  assert.equal(L.shift(src, 500, 'stamps'),
    '[ti:Song]\n[00:01.50]a\n[01:03.00][01:05.50]b <00:01.70>c\n[00:00.80]d');
});
test('negative shift clamps at zero', () => {
  assert.equal(L.shift('[00:00.30]x', -1000, 'stamps'), '[00:00.00]x');
});
test('shift carries over minutes and handles 3-digit fractions', () => {
  assert.equal(L.shift('[00:59.800]x', 400, 'stamps'), '[01:00.20]x');
});
test('offset tag mode: positive shift (later) = negative tag, inserted after metadata', () => {
  assert.equal(L.shift(src, 500, 'tag').split('\n').slice(0, 3).join('|'), '[ti:Song]|[offset:-500]|[00:01.00]a');
});
test('offset tag mode updates an existing tag', () => {
  assert.equal(L.shift('[offset:200]\n[00:01.00]a', 500, 'tag'), '[offset:-300]\n[00:01.00]a');
});
test('parse expands multi-stamp lines, strips word tags, applies offset tag', () => {
  const p = L.parse('[offset:1000]\n[00:05.00][00:02.00]hi <00:02.50>there');
  assert.deepEqual(p, [{ t: 1000, text: 'hi there' }, { t: 4000, text: 'hi there' }]);
});
