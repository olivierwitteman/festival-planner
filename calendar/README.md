# Calendar feeds

Files in this directory are regenerated daily by
`.github/workflows/generate-ics.yml`. Don't edit them by hand — your changes
will be overwritten.

## Subscribe

After GitHub Pages serves this folder, point your calendar app at one of:

- **Everyone** — `webcal://<your-pages-host>/<repo>/calendar/everyone.ics`
- **Per person** — `webcal://<your-pages-host>/<repo>/calendar/person-<name>.ics`

Most calendar apps re-fetch subscriptions on their own schedule (typically
every 1–24 h); the feeds advertise `REFRESH-INTERVAL:P1D` to nudge them
toward daily polling.

If you only need a one-shot snapshot, the in-app "Download .ics" button on
the Summary view does the same thing without subscribing.
