// Daily ICS generator for the BKS Planner.
//
// Fetches the shared state (picks + lineup) from JSONBin and writes:
//
//   calendar/everyone.ics            — every picked act, with all pickers
//   calendar/person-<safe-name>.ics  — per-member feed
//
// Run on a schedule by .github/workflows/generate-ics.yml; subscribe with
// webcal://<your-pages-host>/<repo>/calendar/everyone.ics

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// ─── Config ───────────────────────────────────────────────────────────────────
function fromConfig(key) {
  try {
    const txt = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
    const m = txt.match(new RegExp(`${key}\\s*=\\s*"([^"]+)"`));
    return m ? m[1] : null;
  } catch { return null; }
}
const BIN_ID  = process.env.JSONBIN_BIN_ID  || fromConfig('JSONBIN_BIN_ID');
const API_KEY = process.env.JSONBIN_API_KEY || fromConfig('JSONBIN_API_KEY');
if (!BIN_ID || !API_KEY) {
  console.error('Missing JSONBIN_BIN_ID or JSONBIN_API_KEY (set repo secrets or fill config.js).');
  process.exit(1);
}

const FESTIVAL_DATES = {
  friday:   '2026-06-12',
  saturday: '2026-06-13',
  sunday:   '2026-06-14'
};
const DAY_ORDER = { friday: 0, saturday: 1, sunday: 2 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  return (h < 6 ? h + 24 : h) * 60 + m;
}

function actToDate(dayKey, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const realH  = h < 6 ? h + 24 : h;
  const base   = new Date(`${FESTIVAL_DATES[dayKey]}T00:00:00+02:00`);
  return new Date(base.getTime() + (realH * 60 + m) * 60000);
}

function icsStamp(d) {
  const p = n => String(n).padStart(2, '0');
  return d.getUTCFullYear()
       + p(d.getUTCMonth() + 1)
       + p(d.getUTCDate()) + 'T'
       + p(d.getUTCHours())
       + p(d.getUTCMinutes())
       + p(d.getUTCSeconds()) + 'Z';
}

function icsEsc(s) {
  return String(s).replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
}

function buildActMap(days) {
  const map = {};
  for (const [dayKey, d] of Object.entries(days)) {
    for (const a of d.acts) map[a.id] = { ...a, dayKey };
  }
  return map;
}

function vcalendarWrap(calName, vevents) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BKS Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEsc(calName)}`,
    // Hint for subscribers: this feed is regenerated daily.
    'REFRESH-INTERVAL;VALUE=DURATION:P1D',
    'X-PUBLISHED-TTL:P1D',
    vevents,
    'END:VCALENDAR'
  ].join('\r\n');
}

function buildPersonICS(name, picks) {
  const stamp = icsStamp(new Date());
  const events = picks.map(a => [
    'BEGIN:VEVENT',
    `UID:bks26-${a.id}-${name.replace(/[^a-z0-9]+/gi,'-')}@festival-planner`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsStamp(actToDate(a.dayKey, a.start))}`,
    `DTEND:${icsStamp(actToDate(a.dayKey, a.end))}`,
    `SUMMARY:${icsEsc(a.name)}`,
    `LOCATION:${icsEsc(a.stage)} — Best Kept Secret, Beekse Bergen`,
    `DESCRIPTION:${icsEsc('Picked by ' + name + ' via BKS Planner')}`,
    'END:VEVENT'
  ].join('\r\n')).join('\r\n');
  return vcalendarWrap("BKS '26 — " + name, events);
}

function buildCombinedICS(events) {
  const stamp = icsStamp(new Date());
  const vevents = events.map(a => {
    const pickers = a.pickers.join(', ');
    return [
      'BEGIN:VEVENT',
      `UID:bks26-${a.id}-group@festival-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsStamp(actToDate(a.dayKey, a.start))}`,
      `DTEND:${icsStamp(actToDate(a.dayKey, a.end))}`,
      `SUMMARY:${icsEsc(a.name + ' (' + pickers + ')')}`,
      `LOCATION:${icsEsc(a.stage)} — Best Kept Secret, Beekse Bergen`,
      `DESCRIPTION:${icsEsc('Picked by ' + pickers)}`,
      `CATEGORIES:${a.pickers.map(p => icsEsc(p)).join(',')}`,
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');
  return vcalendarWrap("BKS '26 — Group picks", vevents);
}

function safeFilename(name) {
  return name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'picks';
}

function sortByDayThenTime(a, b) {
  return (DAY_ORDER[a.dayKey] - DAY_ORDER[b.dayKey])
      || (timeToMins(a.start) - timeToMins(b.start));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function fetchDB() {
  const r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Access-Key': API_KEY }
  });
  if (!r.ok) throw new Error(`JSONBin fetch failed: ${r.status} ${r.statusText}`);
  const j = await r.json();
  return j.record || { marks: {}, members: {} };
}

async function main() {
  const db     = await fetchDB();
  const lineup = db.lineup || {};
  if (!Object.keys(lineup).length) {
    console.error('No lineup data found in JSONBin record (db.lineup is empty).');
    process.exit(1);
  }
  const actMap = buildActMap(lineup);
  const outDir = path.join(ROOT, 'calendar');
  fs.mkdirSync(outDir, { recursive: true });

  // Combined feed — one event per picked act, with all pickers in SUMMARY.
  const combined = Object.entries(db.marks || {})
    .map(([id, pickers]) => actMap[id] && { ...actMap[id], pickers })
    .filter(Boolean)
    .sort(sortByDayThenTime);
  fs.writeFileSync(path.join(outDir, 'everyone.ics'), buildCombinedICS(combined));
  console.log(`wrote calendar/everyone.ics (${combined.length} events)`);

  // Per-person feeds — wipe stale ones first so removed members vanish.
  for (const f of fs.readdirSync(outDir)) {
    if (f.startsWith('person-') && f.endsWith('.ics')) fs.unlinkSync(path.join(outDir, f));
  }
  const members = [...new Set(Object.values(db.marks || {}).flat())].sort();
  for (const name of members) {
    const picks = Object.entries(db.marks)
      .filter(([, v]) => v.includes(name))
      .map(([id]) => actMap[id])
      .filter(Boolean)
      .sort(sortByDayThenTime);
    if (!picks.length) continue;
    const filename = `person-${safeFilename(name)}.ics`;
    fs.writeFileSync(path.join(outDir, filename), buildPersonICS(name, picks));
    console.log(`wrote calendar/${filename} (${picks.length} events)`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
