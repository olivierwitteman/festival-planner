// 🎪 BKS '26 — iOS home-screen "live" widget
// ---------------------------------------------------------------------------
// A Scriptable widget that shows YOUR picks live during the festival:
// what's playing now and what's up next, straight from the same shared
// JSONBin feed the web planner uses.
//
// Why Scriptable? The planner is a static web app (GitHub Pages PWA), so there
// is no native iOS app to attach a WidgetKit extension to. Scriptable is a free
// App Store app that runs JavaScript and renders native home-screen widgets —
// the standard way to put a live, data-backed widget on the iOS home screen
// without shipping a native binary.
//
// ── Install ────────────────────────────────────────────────────────────────
//   1. Install "Scriptable" from the App Store (free).
//   2. Open Scriptable → tap "+" → paste this whole file → name it "BKS '26".
//   3. Long-press the home screen → add a Scriptable widget (Small or Medium).
//   4. Edit the widget → choose this script. In the "Parameter" field type
//      YOUR name exactly as it appears in the planner (e.g. "Olivier").
//   5. The widget refreshes itself every few minutes during the weekend.
//
// You can also set your name by editing MY_NAME below instead of using the
// widget Parameter field.
// ---------------------------------------------------------------------------

// ── Config ───────────────────────────────────────────────────────────────────
// These are the same public client credentials the web planner ships with.
const JSONBIN_BIN_ID  = "69ebccc136566621a8eac940";
const JSONBIN_API_KEY = "$2a$10$EB5InxQnSxUJsP.QVOjEHuayBwPG5ayDZ33jtN6O.m8tDCqh29kAu";

// Fallback name if no widget Parameter is set. Leave "" to require a parameter.
let MY_NAME = "";

// Festival timing (Europe/Amsterdam, CEST = +02:00), mirrors the web app.
const FESTIVAL_DATES = { friday: "2026-06-12", saturday: "2026-06-13", sunday: "2026-06-14" };
const DAY_ORDER      = { friday: 0, saturday: 1, sunday: 2 };
const TZ_OFFSET      = "+02:00";

// Theme — matches the planner.
const COL_BG     = new Color("#0a0a0a");
const COL_ACCENT = new Color("#FF5C4D");
const COL_TEXT   = new Color("#ffffff");
const COL_MUTED  = new Color("#9a9a9a");
const COL_CARD   = new Color("#161616");

// ── Helpers ────────────────────────────────────────────────────────────────
// Absolute instant for an act, treating times before 06:00 as the next day.
function actToDate(dayKey, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const realH  = h < 6 ? h + 24 : h;
  const base   = new Date(`${FESTIVAL_DATES[dayKey]}T00:00:00${TZ_OFFSET}`);
  return new Date(base.getTime() + (realH * 60 + m) * 60000);
}

function actName(act, actEdits) {
  const custom = (actEdits[act.id] || {}).name;
  return custom || act.name;
}

function fmtClock(date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit", hour12: false
  }).format(date);
}

function dayLabel(dayKey) {
  return { friday: "Fri 12 Jun", saturday: "Sat 13 Jun", sunday: "Sun 14 Jun" }[dayKey] || "";
}

// Date parts in Europe/Amsterdam, regardless of the phone's own timezone.
function amsParts(date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
  return Object.fromEntries(f.formatToParts(date).map(p => [p.type, p.value]));
}

// Which festival day is "now"? Before 06:00 counts as the previous evening,
// matching the web app's festivalDay().
function festivalDayKey(date) {
  const p = amsParts(date);
  let y = +p.year, mo = +p.month, d = +p.day;
  if (+p.hour < 6) {
    const prev = new Date(Date.UTC(y, mo - 1, d));
    prev.setUTCDate(prev.getUTCDate() - 1);
    y = prev.getUTCFullYear(); mo = prev.getUTCMonth() + 1; d = prev.getUTCDate();
  }
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  for (const [k, v] of Object.entries(FESTIVAL_DATES)) if (v === iso) return k;
  return null;
}

async function fetchDB() {
  const req = new Request(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`);
  req.headers = { "X-Access-Key": JSONBIN_API_KEY };
  const j = await req.loadJSON();
  return (j && j.record) || { marks: {}, members: {}, actEdits: {}, lineup: {} };
}

// Flatten lineup into an act map keyed by id, tagging each with its day.
function buildActMap(lineup) {
  const map = {};
  for (const [dayKey, day] of Object.entries(lineup || {})) {
    for (const a of (day.acts || [])) map[a.id] = { ...a, dayKey };
  }
  return map;
}

// My picks as enriched, time-sorted act objects with absolute start/end.
function myPicks(db, name) {
  const actMap   = buildActMap(db.lineup);
  const actEdits = db.actEdits || {};
  const picks = [];
  for (const [id, pickers] of Object.entries(db.marks || {})) {
    if (!pickers.includes(name)) continue;
    const act = actMap[id];
    if (!act) continue;
    picks.push({
      id,
      name:   actName(act, actEdits),
      stage:  act.stage,
      dayKey: act.dayKey,
      start:  actToDate(act.dayKey, act.start),
      end:    actToDate(act.dayKey, act.end),
      others: pickers.filter(p => p !== name)
    });
  }
  picks.sort((a, b) => a.start - b.start);
  return picks;
}

// ── Build widget ─────────────────────────────────────────────────────────────
function headerRow(w, name) {
  const row = w.addStack();
  row.centerAlignContent();
  const dot = row.addText("●");
  dot.textColor = COL_ACCENT;
  dot.font = Font.boldSystemFont(11);
  row.addSpacer(5);
  const t = row.addText("BKS '26");
  t.textColor = COL_TEXT;
  t.font = Font.boldSystemFont(13);
  row.addSpacer();
  if (name) {
    const n = row.addText(name);
    n.textColor = COL_MUTED;
    n.font = Font.mediumSystemFont(11);
  }
}

function actBlock(w, label, pick, accent) {
  const lbl = w.addText(label);
  lbl.textColor = accent ? COL_ACCENT : COL_MUTED;
  lbl.font = Font.boldSystemFont(9);

  const title = w.addText(pick ? pick.name : "—");
  title.textColor = COL_TEXT;
  title.font = Font.boldSystemFont(15);
  title.lineLimit = 1;
  title.minimumScaleFactor = 0.7;

  if (pick) {
    const meta = w.addText(`${fmtClock(pick.start)}–${fmtClock(pick.end)} · ${pick.stage}`);
    meta.textColor = COL_MUTED;
    meta.font = Font.systemFont(10);
    meta.lineLimit = 1;
    meta.minimumScaleFactor = 0.7;
    if (pick.others.length) {
      const friends = w.addText(`with ${pick.others.join(", ")}`);
      friends.textColor = COL_MUTED;
      friends.font = Font.systemFont(9);
      friends.lineLimit = 1;
      friends.minimumScaleFactor = 0.7;
    }
  }
}

function messageWidget(text, sub) {
  const w = new ListWidget();
  w.backgroundColor = COL_BG;
  headerRow(w, "");
  w.addSpacer();
  const t = w.addText(text);
  t.textColor = COL_TEXT;
  t.font = Font.boldSystemFont(15);
  t.centerAlignText();
  if (sub) {
    w.addSpacer(4);
    const s = w.addText(sub);
    s.textColor = COL_MUTED;
    s.font = Font.systemFont(11);
    s.centerAlignText();
  }
  w.addSpacer();
  return w;
}

// One timeline row for the Large widget: "14:00  ▶ Act name        Stage".
function listRow(stack, pick, now) {
  const isNow = pick.start <= now && now < pick.end;
  const row = stack.addStack();
  row.centerAlignContent();

  const time = row.addText(fmtClock(pick.start));
  time.font = Font.mediumSystemFont(12);
  time.textColor = isNow ? COL_ACCENT : COL_MUTED;
  time.lineLimit = 1;
  row.addSpacer(8);

  const title = row.addText((isNow ? "▶ " : "") + pick.name);
  title.font = isNow ? Font.boldSystemFont(13) : Font.systemFont(13);
  title.textColor = COL_TEXT;
  title.lineLimit = 1;
  title.minimumScaleFactor = 0.7;
  row.addSpacer();

  const stage = row.addText(pick.stage);
  stage.font = Font.systemFont(10);
  stage.textColor = COL_MUTED;
  stage.lineLimit = 1;
  stage.minimumScaleFactor = 0.7;
}

// Large widget: the rest of today's picks as a timeline list.
function buildLargeWidget(name, picks, now, nowP, next) {
  const w = new ListWidget();
  w.backgroundColor = COL_BG;
  w.setPadding(14, 16, 14, 16);
  headerRow(w, name);

  const activeDay = festivalDayKey(now)
    || (nowP && nowP.dayKey) || (next && next.dayKey) || null;
  let remaining = picks.filter(p => p.dayKey === activeDay && p.end > now);
  // Off-day (or between days): just show whatever's still upcoming.
  if (!remaining.length) remaining = picks.filter(p => p.end > now);

  w.addSpacer(4);
  const sub = w.addText(activeDay ? `${dayLabel(activeDay)} · rest of day` : "Upcoming");
  sub.font = Font.boldSystemFont(10);
  sub.textColor = COL_ACCENT;
  w.addSpacer(8);

  const MAX = 9;
  for (const p of remaining.slice(0, MAX)) {
    listRow(w, p, now);
    w.addSpacer(7);
  }
  if (remaining.length > MAX) {
    const more = w.addText(`+${remaining.length - MAX} more`);
    more.font = Font.systemFont(10);
    more.textColor = COL_MUTED;
  }
  w.addSpacer();
  return w;
}

function buildWidget(db, name, family) {
  if (!name) {
    return messageWidget("Set your name", "Long-press → Edit Widget → Parameter");
  }

  const picks = myPicks(db, name);
  if (!picks.length) {
    return messageWidget("No picks yet", `Mark some acts as ${name} in the planner`);
  }

  const now  = new Date();
  const nowP = picks.find(p => p.start <= now && now < p.end) || null;
  const next = picks.find(p => p.start > now) || null;

  // Festival's over or hasn't started and nothing is live/upcoming.
  if (!nowP && !next) {
    const last = picks[picks.length - 1];
    return messageWidget("That's a wrap 🎉", `${picks.length} acts seen · last was ${last.name}`);
  }

  if (family === "large") return buildLargeWidget(name, picks, now, nowP, next);

  const small = family === "small";
  const w = new ListWidget();
  w.backgroundColor = COL_BG;
  w.setPadding(12, 14, 12, 14);

  headerRow(w, name);
  w.addSpacer(8);

  if (nowP) {
    actBlock(w, "▶ NOW", nowP, true);
  } else if (next) {
    // Nothing playing now — promote "next" to the hero slot.
    const mins = Math.round((next.start - now) / 60000);
    const when = mins > 90 ? dayLabel(next.dayKey) : `in ${mins} min`;
    actBlock(w, `UP NEXT · ${when}`, next, true);
  }

  if (!small && nowP && next) {
    w.addSpacer(8);
    const mins = Math.round((next.start - now) / 60000);
    const when = mins > 90 ? dayLabel(next.dayKey) : `in ${mins} min`;
    actBlock(w, `UP NEXT · ${when}`, next, false);
  }

  w.addSpacer();
  return w;
}

// ── Run ──────────────────────────────────────────────────────────────────────
const paramName = (args.widgetParameter || "").trim();
const name = paramName || MY_NAME.trim();

// When run inside a widget iOS tells us the size; when run in-app for a preview
// we default to Large so the new timeline view is visible.
const family = config.widgetFamily || "large";

let widget;
try {
  const db = await fetchDB();
  widget = buildWidget(db, name, family);
} catch (e) {
  widget = messageWidget("Couldn't load", String(e).slice(0, 60));
}

// Nudge iOS to refresh roughly every 5 minutes so "now/next" stays current.
widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else if (family === "small") {
  await widget.presentSmall();
} else if (family === "large") {
  await widget.presentLarge();
} else {
  await widget.presentMedium();
}
Script.complete();
