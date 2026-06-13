# 📲 iOS live widget

A home-screen widget for iPhone that shows **your** picks live during Best Kept
Secret '26 — what's playing **now** and what's **up next** — pulled from the
same shared feed as the web planner.

![Small + Medium widget](#) <!-- add a screenshot once installed if you like -->

## Why Scriptable (and not a "real" app widget)?

The planner is a **static web app** (GitHub Pages PWA). iOS home-screen widgets
require native WidgetKit code, and there's no native app here to attach an
extension to. [Scriptable](https://scriptable.app) is a free App Store app that
runs JavaScript and renders **native** home-screen widgets — the standard,
no-build way to get a live, data-backed widget on iOS. The script reuses the
exact same JSONBin feed the web app and calendar feeds already use, so it's
always in sync.

## Install (about 2 minutes)

1. Install **[Scriptable](https://apps.apple.com/app/scriptable/id1405459188)**
   from the App Store (free).
2. Open Scriptable → tap **＋** (top-right) → paste the contents of
   [`bks-widget.js`](./bks-widget.js) → tap **Done** and name it `BKS '26`.
   - Tip: you can also tap the share/import button and paste the raw URL
     `https://<your-pages-host>/<repo>/widget/bks-widget.js`.
3. Go to your home screen → long-press → **＋** → search **Scriptable** → pick a
   **Small** or **Medium** widget → **Add Widget**.
4. Long-press the new widget → **Edit Widget**:
   - **Script:** `BKS '26`
   - **Parameter:** your name exactly as it appears in the planner
     (e.g. `Olivier`)
5. Done. The widget refreshes itself every few minutes through the weekend.

> Prefer not to use the Parameter field? Open the script and set `MY_NAME` near
> the top instead.

## What it shows

- **▶ NOW** — the act you marked that's playing right now (with which friends
  also picked it).
- **UP NEXT** — your next pick and how many minutes until it starts.
- Off-festival it shows your next upcoming pick, or a wrap-up once it's over.
- **Small** widget shows the single most relevant slot; **Medium** shows both
  *now* and *next*.

## Refresh notes

iOS decides when to actually re-run widgets; the script asks for a ~5-minute
refresh, but the system may stretch that to save battery. Tap-and-hold →
**Edit** → close, or open the app once, to force a refresh.
