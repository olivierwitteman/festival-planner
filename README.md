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

- **3 days** — Friday, Saturday, Sunday with full lineup
- **Per-person colors** — each group member gets a distinct color dot
- **Stage view** — acts grouped by stage
- **Summary view** — see each person’s full pick list
- **Filter** — tap a name to see only their picks
- **Auto-sync** — polls every 12 seconds, no refresh needed
- **Mobile-first** — works great on phones

## 🛠 No-backend option

If you don’t want to set up JSONBin, the app runs in **local mode** — each device saves its own state. Good enough for planning individually, but picks won’t sync across devices.

For a fully free alternative to JSONBin you can also use:

- [Pocketbase](https://pocketbase.io) (self-hosted)
- [Supabase](https://supabase.com) free tier (requires small code change)
