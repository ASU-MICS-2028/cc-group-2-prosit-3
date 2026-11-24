# frontend/

AMA dashboard (and, later, the collector and citizen apps). Owner: Henry.

**Stack:** Vite · Vue 3 · TypeScript · Leaflet (OpenStreetMap tiles) · ECharts · Lucide icons · Geist font.
Visual rules: [../docs/design-brief.md](../docs/design-brief.md).

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```
Add `?hour=16` to the URL to open the dashboard at the storm peak.
Click **Review** on a pending approval to open the approval screen (`#/review/<id>`).

### Roles (use "View as" in the header, demo only)
| Address | Role | What it shows |
|---|---|---|
| `#/` | AMA officer | Full dashboard, pending approvals, review screen |
| `#/nadmo` | NADMO | Flood data only; flood alerts AMA sent or that escalated; Acknowledge (no approve/send) |
| `#/collector` | Waste collector (phone) | Bins in Makola only, AMA tasks, Mark as emptied, map, history |
| `#/citizen` | Citizen (phone) | Zone status in plain words, alerts, anonymous problem reports, report tracking |

The role switcher is a **demo tool**. Hiding things in the browser is not security: in the real
system each person logs in and the backend only sends data their role is allowed to see.

Demo story: AMA approves the Makola flood alert and the bin task → NADMO acknowledges →
the collector sees the task → the citizen sees the alert and reports a blocked drain.
Approvals, delivery counts and the audit log are **simulated** and reset when the page reloads.

## Data
All data comes from `src/data/mock.ts`, a **simulated** storm day that stands in for the backend API.
It models cause and effect: rain peaks at 15:00 → drains peak about an hour later; Makola bins fill faster;
PM2.5 peaks with traffic and drops when it rains; one sensor is offline and one has a low battery.
Thresholds in `src/lib/status.ts` are drafts, to be confirmed with the ML team.

## Layout
```
src/
  App.vue                 page layout (design brief §7.1)
  components/
    AppHeader.vue         logo, "Simulated data" tag, freshness, alerts, user
    ZonePanel.vue         zone picker, flood risk, gauges, rain + PM2.5 charts
    TimelineBar.vue       Live / Replay, hour scrubber
    CityMap.vue           Leaflet map, pilot zones, sensors, risk circles, legend, layers
    PendingApprovals.vue  AI suggestions waiting for an officer ("Review" opens the review screen)
    FloodAlerts.vue       NADMO's alert list with Acknowledge
    RoleSwitcher.vue      demo-only "View as" switch
    phone/                PhoneShell, BottomNav, CollectorApp, CitizenApp, BinMap
    review/
      ReviewScreen.vue    approval workflow (brief §8): steps, countdown, actions, dialogs, audit log
      ReviewEvidence.vue  trigger reading vs limit, 24 h chart, nearby sensors, confidence
      ReviewMessage.vue   editable SMS, 160-character counter, English/Twi/Ga tabs, phone preview
      ReviewRecipients.vue  area, recipient count, channels, NADMO copy (counts only)
      ZoneMiniMap.vue     small map of the alert area
    SensorHealth.vue      online / low battery / offline ring
    TopDrains.vue         5 fullest drains
    Gauge.vue, StatusChip.vue
  data/mock.ts            simulated readings (replace with API calls later)
  data/messages.ts        draft alert text and recipient counts (mock)
  stores/approvals.ts     approval state + audit log (browser only; moves to the backend later)
  stores/field.ts         emptied bins and citizen reports (browser only)
  lib/                    status thresholds, icons, chart setup
  styles/                 design tokens and base styles
```
