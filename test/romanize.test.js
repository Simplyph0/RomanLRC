const test = require('node:test');
const assert = require('node:assert');
const R = require('../romanize.js');
const { pinyin } = require('../vendor/pinyin-pro.js');

// Minimal stand-in for kuromoji: one token per call, pronunciation given by a lookup.
const fakeTok = map => ({ tokenize: t => (map[t] || [{ surface_form: t }]) });

test('kana to Hepburn', () => {
  assert.equal(R.kana2romaji('ありがとう'), 'arigatou');
  assert.equal(R.kana2romaji('きょうしゃ'), 'kyousha');
  assert.equal(R.kana2romaji('がっこう'), 'gakkou');
  assert.equal(R.kana2romaji('まっちゃ'), 'matcha');
  assert.equal(R.kana2romaji('ガッコー'), 'gakkoo');
  assert.equal(R.kana2romaji('ファイト'), 'faito');
  assert.equal(R.kana2romaji('しんあい'), "shin'ai");
  assert.equal(R.kana2romaji('じゃ'), 'ja');
});

test('Korean Revised Romanization', () => {
  assert.equal(R.korean('사랑해'), 'saranghae');
  assert.equal(R.korean('안녕하세요'), 'annyeonghaseyo');
  assert.equal(R.korean('음악'), 'eumak');
  assert.equal(R.korean('한국어'), 'hangugeo');
});

test('LRC tags are preserved and can be dropped', () => {
  const src = '[ti:Song]\n[00:01.00]사랑해\n[00:02.00][00:03.50]안녕\n\n[00:05.00]hello';
  const on = R.convert(src, {}, {}).text;
  assert.equal(on, '[ti:Song]\n[00:01.00]saranghae\n[00:02.00][00:03.50]annyeong\n\n[00:05.00]hello');
  const off = R.convert(src, { ts: false }, {}).text;
  assert.equal(off.split('\n')[1], 'saranghae');
});

test('Chinese via pinyin, tone styles', () => {
  const d = { pinyin };
  assert.equal(R.convert('[00:01.00]你好', { han: 'zh' }, d).text, '[00:01.00]nǐ hǎo');
  assert.equal(R.convert('你好', { han: 'zh', tone: 'num' }, d).text, 'ni3 hao3');
  assert.equal(R.convert('你好', { han: 'zh', tone: 'none' }, d).text, 'ni hao');
});

test('Japanese uses pronunciation (particles) and kana fallback', () => {
  const tok = fakeTok({ '私は': [{ surface_form: '私', pronunciation: 'ワタシ' }, { surface_form: 'は', pronunciation: 'ワ' }] });
  assert.equal(R.convert('私は', { han: 'ja' }, { tokenizer: tok }).text, 'watashi wa');
});

test('auto mode: kana anywhere makes Han-only lines Japanese', () => {
  const tok = fakeTok({ '世界': [{ surface_form: '世界', pronunciation: 'セカイ' }] });
  const r = R.convert('ありがとう\n世界', {}, { tokenizer: tok, pinyin });
  assert.equal(r.text.split('\n')[1], 'sekai');
});

test('missing dependencies are reported, not thrown', () => {
  const r = R.convert('你好\nありがとう', { han: 'zh' }, {});
  assert.deepEqual([...r.missing].sort(), ['pinyin', 'tokenizer']);
  assert.equal(r.text, '…\n…');
});

test('options: interleave and capitalize', () => {
  const r = R.convert('사랑해', { both: true, cap: true }, {}).text;
  assert.equal(r, '사랑해\nSaranghae\n');
});

test('CRLF and BOM input', () => {
  assert.equal(R.convert('﻿[00:01.00]사랑해\r\n[00:02.00]안녕', {}, {}).text, '[00:01.00]saranghae\n[00:02.00]annyeong');
});

test('unknown katakana tokens (no reading) are still romanized; Latin passes through', () => {
  const tok = fakeTok({ 'ティ ティ': [{ surface_form: 'ティ' }, { surface_form: ' ' }, { surface_form: 'ティ' }], 'Tic-Tac': [{ surface_form: 'Tic-Tac' }] });
  assert.equal(R.convert('ティ ティ', { han: 'ja' }, { tokenizer: tok }).text, 'ti ti');
  assert.equal(R.convert('Tic-Tac', { han: 'ja' }, { tokenizer: tok }).text, 'Tic-Tac');
});
