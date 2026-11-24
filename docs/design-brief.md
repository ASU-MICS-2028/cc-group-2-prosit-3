# SmartCity Accra: Design Brief

The rules every screen follows, so the AMA dashboard, the partner views and the phone apps look like one product.

**Direction:** a light, calm, minimal style. Black, white and grey carry the layout, and colour appears **only when it means something** (a status).
**References:** five Dribbble and Pinterest shots, chosen by the frontend lead and kept outside this repo because the images belong to their designers. What we take from each is summarised in [section 9](#9-references-and-what-we-took).

---

## 1. Principles

1. **Colour means status, never decoration.** If something is coloured, it is safe, watch, act now or offline.
2. **Every number has context.** Show the unit, the threshold and the trend. "PM2.5 48 µg/m³ · limit 15 · ↑ since 06:00", not just "48".
3. **Every reading shows its age.** "Updated 2 min ago". A stale reading is greyed out, never shown as if it were live.
4. **Never rely on colour alone.** A status chip always includes a word ("High") as well as a colour dot, so colour-blind users and grey printouts still work.
5. **Humans decide.** The system suggests, and an officer approves. The UI makes the evidence easy to check before anything is sent.
6. **Simulated data is labelled.** A small "Simulated data" tag stays in the header of every screen (rule 6 in the project rules).

---

## 2. Colour tokens

### Base (neutral)
| Token | Hex | Use |
|---|---|---|
| `--canvas` | `#F2F2F0` | Page background behind panels |
| `--surface` | `#FFFFFF` | Panels and cards |
| `--ink` | `#111111` | Main text, big numbers, selected tabs (black pill) |
| `--ink-muted` | `#6B6B68` | Labels, units, secondary text |
| `--line` | `#E5E5E1` | Dividers, gauge tick marks, chart grid |
| `--water` | `#6E97BF` | Rainfall line and river/drain lines on the map |

### Status (the only "loud" colours)
| Status | Token | Hex | Meaning |
|---|---|---|---|
| Safe | `--safe` | `#2F9E55` | Normal. No action. |
| Watch | `--watch` | `#D9901A` | Rising. Keep an eye on it. |
| Act now | `--danger` | `#C9482D` | Threshold crossed. Action needed. |
| Offline | `--offline` | `#A3A3A0` | No data or low battery. Do not trust. |

Each status also has a pale tint (10% opacity) for map circles and chip backgrounds.

---

## 3. Typography

- **Font:** Geist (free, open licence) for all text, and **Geist Mono** for sensor IDs and timestamps.
- **Numbers** use tabular figures (every digit the same width), so values don't jump around as they update.

| Style | Size / weight | Use |
|---|---|---|
| Hero number | 96px / 300 (light) | The one key number on a panel, e.g. "72" flood risk |
| Gauge value | 32px / 400 | Inside a gauge |
| Title | 20px / 500 | Panel titles |
| Body | 14px / 400 | Most text |
| Label | 12px / 400, `--ink-muted` | Units, axis labels, captions |

---

## 4. Shapes and spacing

- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48px. Nothing in between.
- **Corners:** panels 20px, cards 12px, chips and buttons fully round (pill).
- **Shadows:** none. Panels sit on `--canvas` and are separated by colour, not shadow.
- **Lines:** 1px `--line`. Charts use thin 1.5px lines and small dots.
- **Icons:** one outline icon set (Lucide), 1.5px stroke. No emoji.

---

## 5. Components

| Component | Description | Taken from |
|---|---|---|
| **Status chip** | Pill with a coloured dot and a word: `● High` | Earthly |
| **Hero metric** | Huge number + status chip + one line of context | Earthly |
| **Gauge** | Circle of tick marks; ticks fill up to the value; value and chip in the middle | Earthly |
| **KPI tile** | Label, number, unit, and a comparison ("+12% vs last week") | Aquaculture dashboard |
| **Sensor health ring** | Ring split into Online / Low battery / Offline with counts | Aquaculture dashboard |
| **Alert row** | Severity icon, title, zone, time, and "reading vs threshold" | Aquaculture dashboard |
| **Timeline bar** | Day / Week / Month toggle (black pill = selected) and a time scale with a cursor | Earthly |
| **Freshness tag** | "Synced 2 min ago" in the header; turns `--watch` after 10 min, `--offline` after 30 min | Earthly |
| **Segmented control** | Row of text options, selected one is a black pill | Earthly |

---

## 6. The map

- **Base map:** a light, muted OpenStreetMap style (grey roads, no bright colours), so status colours stand out.
- **Focus:** the two pilot zones (East Legon, Makola Market) are outlined and bright. The rest of Accra is dimmed. *(Idea from the highway control platform.)*
- **Sensors:** small black circles with an icon inside (drain, bin, air). The outer ring takes the status colour.
- **Risk areas:** a soft tinted circle around a drain sensor shows the area likely to flood, with a radius set by the risk level. *(Idea from Earthly.)*
- **Legend:** bottom-left, as a small white card.
- **Layer switch:** a segmented control on the map: `All · Flood · Waste · Air`.
- **Timeline:** above the map. Dragging the cursor replays past readings, which drives the storm scenario in the demo.

---

## 7. Screens

### 7.1 AMA dashboard (desktop), the main screen
Layout follows Earthly: a **left panel** about 35% wide and the **map** filling the rest.

```
┌──────────────── header: logo · zone search · Synced 2 min ago · Simulated data · alerts bell · user ────────────────┐
│ LEFT PANEL                        │  [Day | Week | Month]   timeline ───────────|──────────                         │
│ Zone ▾  East Legon                │                                                                                │
│                                   │                         MAP (pilot zones lit, rest dimmed)                    │
│ 72   ● High                       │                                                                                │
│ Flood risk, next 6 h              │                                                                                │
│ ──────────────────────            │                                                                                │
│ (gauge) Drain level  (gauge) Bins │                                                                                │
│ ──────────────────────            │                                                                                │
│ Rain today / yesterday + chart    │   [Legend]                            [All | Flood | Waste | Air]             │
│ ──────────────────────            │                                                                                │
│ PM2.5 now · 24 h forecast         │                                                                                │
├───────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────┤
│ Pending approvals (3)  ·  Sensor health 46/48  ·  Top 5 drains at risk                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Alert approval (desktop)
See [section 8](#8-alert-approval-workflow).

### 7.3 NADMO view (desktop, read-only)
- The same layout as the AMA dashboard, but **flood layer only**. Waste and air are hidden.
- It can **acknowledge** an alert ("NADMO has seen this") but cannot approve or send.

### 7.4 Waste collector app (phone)
Structure from the recycling app reference; colours from this brief.
- **Home:** today's route as an ordered list of bins in their zone only, each with fill % and a chip.
- **Bin card:** large "Mark as emptied" button, usable with one thumb outdoors.
- **Bottom menu:** Route · Map · History · Profile.
- High contrast, with large text (16px minimum), for reading in sunlight.

### 7.5 Citizen app (phone)
- **Home:** current status for their zone (flood, air) as hero metrics with plain-language advice ("Avoid Kwame Nkrumah Ave underpass").
- **Report a problem:** blocked drain, overflowing bin or burning waste. Photo optional, location from the map pin, no name required.
- **My reports:** history list with status chips: `Received → Assigned → Fixed`.
- **Alerts:** the same text that went out by SMS.

### 7.6 Admin (desktop)
- Tables for **Users** (role, zone, status) and **Sensors** (ID, type, zone, battery, last seen).
- Offline sensors and low batteries float to the top.

---

## 8. Alert approval workflow

**Goal:** no AI-generated alert reaches the public until a person has checked it.

### 8.1 States
```
 Suggested ──► In review ──► Approved ──► Sent (SMS + app)
     │             │  │
     │             │  └──► Edited ──► Approved ──► Sent
     │             └─────► Rejected (reason required)
     └──► Expired (not reviewed in time → escalated)
```

| State | Who acts | What happens |
|---|---|---|
| **Suggested** | System | The ML model or a rule creates a suggestion. It appears in "Pending approvals" with a sound and a badge. |
| **In review** | AMA officer | The officer opens it. Others see "Being reviewed by Officer A" so two people don't handle it at once. |
| **Edited** | AMA officer | The officer changes the message, zone or severity. The original stays in the history. |
| **Approved** | AMA officer | Confirmation step: "Send to 1,240 people in East Legon by SMS and app?" |
| **Sent** | System | Delivery counts appear: delivered, failed, pending. |
| **Rejected** | AMA officer | A reason is required (false reading, already handled, wrong zone). This feedback goes to the ML team to improve the model. |
| **Expired** | System | A red ("act now") suggestion not reviewed within **10 minutes** goes to a second officer and to NADMO's view. |

### 8.2 The review screen
The officer must be able to answer "is this real?" in under a minute. One screen, three columns:

| Evidence (left) | Message (middle) | Who gets it (right) |
|---|---|---|
| Sensor readings that triggered it, as a small chart with the threshold line | SMS text, editable, with a **160-character counter** (one SMS) | Zone on a mini map |
| Reading vs threshold: "Drain DL-EL-03: 82 cm · limit 70 cm" | Language: English, Twi, Ga (one tab each) | Number of recipients |
| Rain in the last hour and forecast | Severity chip: Watch / Act now | Channels: SMS ✓ App ✓ |
| Model confidence: "High (0.87)", in plain words | Preview as it will look on a basic phone | NADMO copied: yes/no |
| Nearby sensors agreeing or not, which flags a single faulty sensor | | |
| Sensor health: battery, last seen | | |

Buttons along the bottom: **Reject** (outline) · **Edit** (outline) · **Approve and send** (black, filled).

### 8.3 Safety rules
- **Two-person check** for city-wide alerts (more than one zone): a second officer must also approve.
- **Offline-sensor warning:** if any sensor behind the suggestion is offline or has a low battery, a banner says so before approval.
- **Audit log:** every action (who, what, when, before and after text) is stored and cannot be edited. This supports accountability under Act 843.
- **No personal data** appears on this screen. Recipients are shown as counts, never as names or numbers.

---

## 9. References and what we took

| Reference | Take | Leave |
|---|---|---|
| Earthly climate dashboard (Dribbble) | Overall style, hero number + chip, gauges, timeline, map circles, freshness tag | The decorative wireframe-mesh map |
| Aquaculture monitoring dashboard | KPI tiles with comparison, sensor health ring, alert rows with thresholds | Dark theme |
| Highway control platform | Map as the main element, lit focus area, corner legend, ranked side list | Dark theme, glow, 3D effects |
| "Flow" service dashboard (marked "AI modified") | Left menu, schedule list idea for collector routes | Purple glow, glass cards, stock faces: everything on our avoid list |
| Recycling mobile app | Phone app structure: bottom menu, big cards, status history list | Bright green theme, rewards/wallet features |

## 10. Things we never do
- Gradients on panels or buttons.
- Glass (see-through, blurred) cards or glowing edges.
- Emoji as icons.
- A number with no unit, threshold or time.
- Colour as the only signal.
- Real names, photos or phone numbers. Demo data uses fake names and `0240000000`-style numbers.
