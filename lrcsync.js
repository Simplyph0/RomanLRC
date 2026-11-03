/* LRC timing helpers. Public domain (Unlicense). Browser global `LrcSync` / Node module. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LrcSync = factory();
})(typeof self !== 'undefined' ? self : this, function () {

const reTag = /([\[<])(\d+):(\d+(?:[.:]\d+)?)([\]>])/g;
const reOffset = /^\s*\[offset:\s*([+-]?\d+)\s*\]\s*$/i;

const toMs = (m, s) => Math.round((+m * 60 + parseFloat(s.replace(':', '.'))) * 1000);
function fmt(ms) {
  const cs = Math.max(0, Math.round(ms / 10));
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(cs / 6000))}:${p(Math.floor(cs % 6000 / 100))}.${p(cs % 100)}`;
}

/* [offset:N] per the LRC convention: positive N makes lyrics appear EARLIER. Returns ms or 0. */
function readOffset(text) {
  for (const l of text.split(/\r?\n/)) { const m = l.match(reOffset); if (m) return +m[1]; }
  return 0;
}

/* Parsed lines for playback: [{ t (ms, offset tag applied), text }] sorted by time. */
function parse(text) {
  const off = readOffset(text), out = [];
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^((?:\[\d+:\d+(?:[.:]\d+)?\])+)(.*)$/);
    if (!m) continue;
    const body = m[2].replace(/<\d+:\d+(?:[.:]\d+)?>/g, '').trim();
    for (const t of m[1].matchAll(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g)) out.push({ t: toMs(t[1], t[2]) - off, text: body });
  }
  return out.sort((a, b) => a.t - b.t);
}

/* shiftMs > 0 makes lyrics appear LATER. mode 'stamps' rewrites every timestamp;
   mode 'tag' leaves timestamps alone and writes/updates a single [offset:] line. */
function shift(text, shiftMs, mode) {
  if (mode === 'tag') {
    const cur = readOffset(text), tag = `[offset:${cur - shiftMs}]`;
    const lines = text.split(/\r?\n/);
    const i = lines.findIndex(l => reOffset.test(l));
    if (i >= 0) lines[i] = tag;
    else {
      let at = 0;
      while (at < lines.length && /^\[[A-Za-z#]+:.*\]\s*$/.test(lines[at])) at++;
      lines.splice(at, 0, tag);
    }
    return lines.join('\n');
  }
  return text.replace(reTag, (_, o, m, s, c) => o + fmt(toMs(m, s) + shiftMs) + c);
}

return { parse, shift, readOffset, fmt };
});
