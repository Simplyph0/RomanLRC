/* RomanLRC core: romanize CJK LRC lyrics. Public domain (Unlicense).
   Works in the browser (global `RomanLRC`) and in Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RomanLRC = factory();
})(typeof self !== 'undefined' ? self : this, function () {

/* ---------- Japanese kana -> Hepburn ---------- */
const T = {};
function add(k, r) { const rs = r.split(' '); [...k].forEach((c, i) => T[c] = rs[i]); }
add('あいうえお','a i u e o'); add('かきくけこ','ka ki ku ke ko'); add('がぎぐげご','ga gi gu ge go');
add('さしすせそ','sa shi su se so'); add('ざじずぜぞ','za ji zu ze zo'); add('たちつてと','ta chi tsu te to');
add('だぢづでど','da ji zu de do'); add('なにぬねの','na ni nu ne no'); add('はひふへほ','ha hi fu he ho');
add('ばびぶべぼ','ba bi bu be bo'); add('ぱぴぷぺぽ','pa pi pu pe po'); add('まみむめも','ma mi mu me mo');
add('やゆよ','ya yu yo'); add('らりるれろ','ra ri ru re ro'); add('わゐゑを','wa i e o'); add('ゔ','vu');
add('ぁぃぅぇぉ','a i u e o'); add('ゎ','wa');
const SMALL_Y = { 'ゃ':'a', 'ゅ':'u', 'ょ':'o' }, SMALL_V = { 'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o' };
const kata2hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));

function kana2romaji(s) {
  s = kata2hira(s);
  let o = '', geminate = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1];
    let r;
    if (c === 'っ') { geminate = true; continue; }
    if (c === 'ー') { const m = o.match(/[aiueo]$/); if (m) o += m[0]; continue; }
    if (c === 'ん') {
      const nx = T[n] || '';
      r = /^[aiueoy]/.test(nx) ? "n'" : 'n';
    } else if (T[c] && n in SMALL_Y) {
      const b = T[c]; r = /^(shi|chi|ji)$/.test(b) ? b.slice(0, -1) + SMALL_Y[n] : b.slice(0, -1) + 'y' + SMALL_Y[n]; i++;
    } else if (T[c] && n in SMALL_V && c !== 'ぁ' && !(c in SMALL_V)) {
      const b = T[c], cons = b.replace(/[aiueo]$/, '') || 'w';
      r = (b === 'u' ? 'w' : cons) + SMALL_V[n]; i++;
    } else if (T[c]) r = T[c];
    else { r = c; geminate = false; }
    if (geminate && /^[a-z]/.test(r)) r = (r.startsWith('ch') ? 't' : r[0]) + r;
    geminate = false;
    o += r;
  }
  return o;
}

/* A lone kanji with no dictionary reading (line split mid-word, e.g. 惹|かれ): borrow it from kanji+verb ending (惹か -> ヒカ -> ヒ). */
function kanjiReading(tokenizer, c) {
  for (const s of 'かきくけいるれっ') {
    const t = tokenizer.tokenize(c + s)[0], rest = t.surface_form.slice(c.length), r = t.reading;
    if (t.surface_form.startsWith(c) && rest && r && r !== '*' && kata2hira(r).endsWith(rest)) return r.slice(0, -rest.length);
  }
  return null;
}

/* Tokens that belong to the word before them: auxiliaries (nai, tai, masu), verb suffixes (reru) and te/de.
   です/だ stay separate ("sei desu"); the dictionary's separate verbs like いる/しまう stay separate too. */
const joins = t => t.pos === '助動詞' ? !['だ', 'です'].includes(t.basic_form)
  : t.pos === '助詞' ? t.pos_detail_1 === '接続助詞' && ['て', 'で'].includes(t.surface_form)
  : t.pos === '動詞' && t.pos_detail_1 === '接尾';

function japanese(tokenizer, text) {
  const words = [];
  for (const t of tokenizer.tokenize(text)) {
    const p = t.pronunciation !== '*' && t.pronunciation, r = t.reading !== '*' && t.reading;
    // pronunciation gives は=wa but writes long vowels as ー; when that is the only difference prefer the reading (daijoubu, not daijoobu)
    const k = p && r && p.length === r.length && [...p].every((c, i) => c === r[i] || (c === 'ー' && 'ウオイ'.includes(r[i]))) ? r : p || r
      || (t.surface_form.length === 1 && reHan.test(t.surface_form) ? kanjiReading(tokenizer, t.surface_form) : null);
    const kana = k || t.surface_form; // unknown words have no reading: still convert bare kana
    // join in kana, so a trailing っ doubles the next consonant (あっ+て -> atte)
    if (words.length && joins(t)) words[words.length - 1] += kana; else words.push(kana);
  }
  return words.map(w => kana2romaji(w)).join(' ').replace(/ +([,.!?;:、。！？)\]」』])/g, '$1').replace(/([(\[「『]) +/g, '$1').replace(/ {2,}/g, ' ').trim();
}

/* ---------- Korean (Revised Romanization, with basic liaison + final sounds) ---------- */
const KL = 'g kk n d tt r m b pp s ss  j jj ch k t p h'.split(' ');
const KV = 'a ae ya yae eo e yeo ye o wa wae oe yo u wo we wi yu eu ui i'.split(' ');
const KT_FINAL = ['', 'k','k','k','n','n','n','t','l','k','m','l','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t'];
const KT_INIT = { 1:'g',2:'kk',4:'n',7:'d',8:'r',16:'m',17:'b',19:'s',20:'ss',22:'j',23:'ch',24:'k',25:'t',26:'p',27:'h' };
function korean(run) {
  const cs = [...run].map(c => c.charCodeAt(0) - 0xAC00);
  let o = '';
  cs.forEach((c, i) => {
    const L = Math.floor(c / 588), V = Math.floor(c % 588 / 28), Tt = c % 28;
    const nxt = cs[i + 1], link = nxt !== undefined && Math.floor(nxt / 588) === 11 && KT_INIT[Tt];
    let init = KL[L];
    if (i > 0 && cs[i - 1] % 28 && KT_INIT[cs[i - 1] % 28] && L === 11) init = KT_INIT[cs[i - 1] % 28];
    o += init + KV[V] + (link ? '' : KT_FINAL[Tt]);
  });
  return o;
}

/* ---------- line handling ---------- */
const reKana = /[぀-ヿㇰ-ㇿ]/, reHan = /[㐀-鿿豈-﫿]/, reHangul = /[가-힣]/;
const reTime = /^((?:\[\d+:\d+(?:[.:]\d+)?\])+)(.*)$/;
const reMeta = /^(\[[A-Za-z#]+:)(.*)(\])\s*$/;
const reWordTime = /<\d+:\d+(?:[.:]\d+)?>/g;

/* deps = { tokenizer, pinyin }. Sets deps-missing names on `missing` and returns null when a needed dep is absent. */
function romanizeText(t, han, tone, deps, missing) {
  t = t.replace(reWordTime, '');
  if (reHangul.test(t)) t = t.replace(/[가-힣]+/g, korean);
  if (reKana.test(t) || (reHan.test(t) && han === 'ja')) {
    if (!deps.tokenizer) { missing.add('tokenizer'); return null; }
    return japanese(deps.tokenizer, t);
  }
  if (reHan.test(t)) {
    if (!deps.pinyin) { missing.add('pinyin'); return null; }
    return deps.pinyin(t, { toneType: tone, nonZh: 'consecutive' }).replace(/ {2,}/g, ' ').replace(/ +([，。！？、；：,.!?;:])/g, '$1');
  }
  return t;
}

/* opts = { han: 'auto'|'zh'|'ja', tone: 'symbol'|'num'|'none', ts, cap, both }
   returns { text, missing: Set<'tokenizer'|'pinyin'> } */
function convert(text, opts, deps) {
  const missing = new Set();
  let han = opts.han || 'auto';
  if (han === 'auto') han = reKana.test(text) ? 'ja' : 'zh';
  const lines = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^﻿/, '');
    let m, tags = '', body = line, pre = '', post = '';
    if ((m = line.match(reTime))) { tags = m[1]; body = m[2].trim(); }
    else if ((m = line.match(reMeta))) { pre = m[1]; body = m[2]; post = m[3]; }
    let r = body.trim() ? romanizeText(body, han, opts.tone || 'symbol', deps, missing) : body;
    if (r === null) r = '…';
    if (opts.cap && r) r = r.replace(/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/, c => c.toUpperCase());
    const rom = (opts.ts !== false ? tags : '') + pre + r + post;
    if (opts.both && body.trim() && r !== body) lines.push(line, rom, '');
    else lines.push(rom);
  }
  return { text: lines.join('\n'), missing };
}

return { kana2romaji, korean, japanese, convert };
});
