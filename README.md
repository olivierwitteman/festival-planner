# 🎪 Festival Planner

Collaborative festival timetable for your WhatsApp group. Everyone marks the acts they want to see — picks sync in real time across all devices.

## 🚀 Deploy in 5 minutes

### 1. Host on GitHub Pages

1. Create a new GitHub repository (e.g. `festival-planner`)
1. Upload `index.html` to the repo root
1. Go to **Settings → Pages → Source → main branch / root**
1. Your site will be live at `https://yourusername.github.io/festival-planner`

### 2. Enable shared sync (JSONBin.io — free)

Without this step the app still works, but only saves locally per device (no collaboration).

1. Go to [jsonbin.io](https://jsonbin.io) and create a **free account**
1. Click **Create Bin** and paste this as initial content:
   
   ```json
   {"marks": {}, "members": {}}
   ```
1. Note your **Bin ID** (in the URL after `/b/`)
1. Go to **API Keys** and copy your **Master Key**
1. Open `index.html` and replace these two lines near the top:
   
   ```js
   const JSONBIN_BIN_ID = "YOUR_BIN_ID_HERE";
   const JSONBIN_API_KEY = "YOUR_API_KEY_HERE";
   ```
1. Commit and push — done!

### 3. Share the link in WhatsApp

Send `https://yourusername.github.io/festival-planner` to your group. Everyone:

1. Opens the link
1. Types their name → gets a unique color
1. Taps acts to mark them
1. Sees each other’s picks update every 12 seconds

-----

## 🎨 Features

- **Home overview** — onboarding landing page with feature cards, group activity stats, and a calendar subscribe CTA
- **3 days** — Friday, Saturday, Sunday with full lineup
- **Per-person colors** — each group member gets a distinct color dot
- **Stage view** — acts grouped by stage
- **Summary view** — see each person’s full pick list
- **Filter** — tap a name to see only their picks
- **Auto-sync** — polls every 12 s normally, every 5 s during the festival weekend
- **Map view** — drop a pin per act so the group can find each other on-site
- **Bring list** — shared checklist of things to pack; everyone can add items and claim what they'll bring
- **Mobile-first** — works great on phones

## 📅 Subscribe to a live calendar feed

A daily GitHub Action regenerates `.ics` files in `calendar/` from the shared
JSONBin and commits them back. Once the action has run at least once, point
any calendar app (Apple, Google, Outlook, Fantastical…) at:

- **Everyone's picks** — `webcal://<user>.github.io/<repo>/calendar/everyone.ics`
- **One person's picks** — `webcal://<user>.github.io/<repo>/calendar/person-<name>.ics`

The action runs daily at 05:00 UTC year-round, **and every 15 minutes from
12–15 June** so the calendar feed stays fresh during the festival weekend
(workflow file: `.github/workflows/generate-ics.yml`). Trigger it on demand
from the Actions tab. By default it reads JSONBin credentials from `config.js`.
To override, set `JSONBIN_BIN_ID` and `JSONBIN_API_KEY` as repository secrets.

> Calendar apps re-poll subscriptions on their own schedule (typically every
> 1–24 h), so changes can take up to a day to land. Edit the festival window
> in the workflow file when reusing this for a different year.

## 🛠 No-backend option

If you don’t want to set up JSONBin, the app runs in **local mode** — each device saves its own state. Good enough for planning individually, but picks won’t sync across devices.

For a fully free alternative to JSONBin you can also use:

- [Pocketbase](https://pocketbase.io) (self-hosted)
- [Supabase](https://supabase.com) free tier (requires small code change)
