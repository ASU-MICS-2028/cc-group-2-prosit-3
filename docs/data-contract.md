# SmartCity Accra: Data Contract

**Status:** DRAFT v0.1, for team review. Nothing here is final until Alice, Clifford and Henry agree.
**Purpose:** fix the shape of every message and API response, so the simulator, backend, ML and frontend can be built in parallel and still fit together.

| Part | Produces | Consumes | Owner |
|---|---|---|---|
| Simulator + edge gateway | Sensor messages (§3) | — | Alice / Clifford |
| Backend (IoT Core → pipeline → DB → API) | API responses (§6) | Sensor messages, ML outputs | Alice |
| ML models | Predictions (§5) | Stored readings | Clifford |
| Frontend (dashboard + apps) | User actions (§6) | API responses | Henry |

**Rule:** if you need to change something here, open a pull request on this file first, so everyone sees it.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Format | JSON, UTF-8 |
| Field names | `camelCase` in JSON; `snake_case` in database columns |
| Time | ISO 8601 in **UTC** with `Z`, e.g. `2026-11-24T16:00:00Z`. Ghana uses GMT (UTC+0) all year, so local time = UTC. |
| Which time | `ts` = when the sensor **measured** the value. `receivedAt` = when the cloud got it. They differ when the gateway was offline. |
| Numbers | Plain numbers, no units inside values. Units go in the `unit` field. |
| Units | `"percent"`, `"ug/m3"`, `"mm/h"` (ASCII, no µ symbol) |
| Missing data | `null`, never `0` or `-1` |
| Simulated data | Every simulated message carries `"simulated": true`. Real devices send `false`. |
| Versions | Messages carry `"v": 1`. API paths start with `/api/v1`. |

## 2. IDs

| Thing | Format | Examples |
|---|---|---|
| Zone | lowercase slug | `east-legon`, `makola` |
| Sensor | `{TYPE}-{ZONE}-{NN}` | `DL-MK-02` (drain level), `BF-EL-04` (bin fill), `AQ-MK-01` (air quality) |
| Gateway | `GW-{ZONE}-{NN}` | `GW-MK-01` |
| Sensor type | lowercase | `drain`, `bin`, `air` |

Zone codes inside IDs: `EL` = East Legon, `MK` = Makola Market.
The sensor ID is also the **AWS IoT Core "thing name"** (the device's identity), so each real device later gets its own certificate under the same ID.

## 3. Sensor messages (simulator → AWS IoT Core)

### 3.1 MQTT topics
MQTT (a lightweight publish/subscribe protocol for devices) sends each message to a **topic** (a named channel).

```
sca/v1/{zoneId}/{sensorType}/{sensorId}/reading     a measurement
sca/v1/{zoneId}/{sensorType}/{sensorId}/status      battery and health, every 15 min
sca/v1/gateway/{gatewayId}/status                   gateway online / buffering
```
Example: `sca/v1/makola/drain/DL-MK-02/reading`

### 3.2 Reading message
```json
{
  "v": 1,
  "sensorId": "DL-MK-02",
  "type": "drain",
  "zoneId": "makola",
  "ts": "2026-11-24T16:00:00Z",
  "value": 89,
  "unit": "percent",
  "battery": 69,
  "seq": 10422,
  "gatewayId": "GW-MK-01",
  "buffered": false,
  "simulated": true
}
```

| Field | Type | Meaning |
|---|---|---|
| `value` | number \| null | Drain: water level as % of drain depth. Bin: fill %. Air: PM2.5 in µg/m³. |
| `battery` | number | Battery %, 0–100 |
| `seq` | integer | Counts up by 1 per message from this sensor. Gaps mean lost messages; repeats mean duplicates the backend should drop. |
| `buffered` | boolean | `true` if the gateway stored this during an outage and sent it later |

### 3.3 How often sensors report

| Type | Normal | During a storm (rain > 10 mm/h) |
|---|---|---|
| Drain | every 5 min | every 1 min |
| Bin | every 15 min | every 15 min |
| Air | every 10 min | every 10 min |

### 3.4 Offline and battery rules
- A sensor is **offline** if no message arrives for **30 minutes**.
- **Low battery** is below **20%**.
- The gateway keeps up to **24 hours** of readings during an outage, then sends them in order with `"buffered": true`.

## 4. Stored data (TimescaleDB proposal)

TimescaleDB is PostgreSQL with extra features for time-series data (data recorded over time). Alice decides the final design; this is a starting point.

```sql
-- One row per sensor (the registry)
CREATE TABLE sensors (
  sensor_id      text PRIMARY KEY,
  type           text NOT NULL,          -- drain | bin | air
  zone_id        text NOT NULL,
  place          text NOT NULL,          -- e.g. "Okaishie main drain"
  lat            double precision NOT NULL,
  lng            double precision NOT NULL,
  installed_at   timestamptz,
  in_maintenance boolean NOT NULL DEFAULT false
);

-- One row per reading (a TimescaleDB "hypertable", split by time automatically)
CREATE TABLE readings (
  sensor_id   text NOT NULL REFERENCES sensors,
  ts          timestamptz NOT NULL,
  value       double precision,          -- null = no value
  battery     smallint,
  seq         bigint,
  buffered    boolean NOT NULL DEFAULT false,
  simulated   boolean NOT NULL DEFAULT true,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sensor_id, ts)            -- also blocks duplicates
);
SELECT create_hypertable('readings', 'ts');
```

Rainfall is stored the same way, with `type = 'rain'`, one simulated rain gauge per zone (`RG-EL-01`, `RG-MK-01`).

## 5. ML outputs (Clifford → backend)

### 5.1 Flood risk (per zone, every 15 min)
```json
{
  "zoneId": "makola",
  "at": "2026-11-24T16:00:00Z",
  "score": 74,
  "horizonHours": 6,
  "confidence": 0.8,
  "topFactors": ["DL-MK-02 at 89%", "rain 31 mm/h", "3 of 4 drains rising"],
  "modelVersion": "flood-0.1"
}
```
`score` is 0–100. `confidence` is 0–1. `topFactors` are short plain-English reasons, shown to the officer on the review screen.

### 5.2 Bin full time (per bin)
```json
{ "sensorId": "BF-MK-02", "at": "2026-11-24T16:00:00Z", "predictedFullAt": "2026-11-24T18:20:00Z", "modelVersion": "bins-0.1" }
```

### 5.3 Air forecast (per zone, hourly for 48 h)
```json
{
  "zoneId": "makola",
  "issuedAt": "2026-11-24T16:00:00Z",
  "hourly": [{ "ts": "2026-11-24T17:00:00Z", "pm25": 34, "low": 28, "high": 41 }],
  "modelVersion": "air-0.1"
}
```

## 6. REST API (backend → frontend)

### 6.1 Logins and access
- Staff log in with **Cognito** (AWS's login service). The app sends the login token with every request: `Authorization: Bearer <token>`.
- Each user's **role** is a Cognito group (`ama`, `nadmo`, `collector`, `admin`) and their **zone** is a user attribute (`custom:zone`).
- **The backend filters every response by role and zone.** The frontend hiding things is not enough. Examples: a collector asking for drains gets `403`; a Makola collector asking for East Legon bins gets `403`.
- Citizens do **not** log in. The citizen app creates a random **device ID** on first launch and sends it as `X-Device-Id`, so people can track their own reports without giving a name or phone number.

### 6.2 Endpoints

| Method and path | Who | Returns / does |
|---|---|---|
| `GET /api/v1/zones` | all | Zones with outlines |
| `GET /api/v1/sensors?zone=&type=` | ama, nadmo (drain only), collector (own zone, bin only), admin | Registry + health (§6.3) |
| `GET /api/v1/readings/latest?zone=&type=` | same as above | Latest reading per sensor |
| `GET /api/v1/readings?sensorId=&from=&to=&step=1h` | ama, nadmo, admin | Time series for charts |
| `GET /api/v1/rain?zone=&from=&to=&step=1h` | ama, nadmo | Rain series |
| `GET /api/v1/zones/{zoneId}/flood-risk` | ama, nadmo, citizen | Latest flood risk (§5.1) |
| `GET /api/v1/zones/{zoneId}/air-forecast` | ama, citizen | Air forecast (§5.3) |
| `GET /api/v1/suggestions?status=pending` | ama | AI suggestions waiting for review (§6.4) |
| `GET /api/v1/suggestions/{id}` | ama | One suggestion + its review + audit log |
| `POST /api/v1/suggestions/{id}/actions` | ama | Workflow action (§6.5) |
| `GET /api/v1/alerts?zone=&kind=` | ama, nadmo (flood only), citizen (own zone, public only) | Sent alerts |
| `POST /api/v1/alerts/{id}/acknowledge` | nadmo | Records NADMO saw it |
| `GET /api/v1/collector/route` | collector | Bins in own zone, in route order, + tasks |
| `POST /api/v1/bins/{sensorId}/emptied` | collector | Records a bin as emptied |
| `POST /api/v1/reports` | citizen | New problem report (§6.6) |
| `GET /api/v1/reports/mine` | citizen | Own reports, by device ID |
| `GET /api/v1/reports?zone=&status=` | ama | All reports (no device IDs shown) |
| `GET /api/v1/users` · `POST /api/v1/users` · `PATCH /api/v1/users/{id}` | admin | List, invite, suspend/reactivate staff |
| `PATCH /api/v1/sensors/{sensorId}` | admin | `{ "inMaintenance": true }` |
| `GET /api/v1/audit?subject=` | ama, admin | Audit entries |

### 6.3 Sensor with health
```json
{
  "sensorId": "BF-EL-04",
  "type": "bin",
  "zoneId": "east-legon",
  "place": "Boundary Rd market",
  "lat": 5.6284,
  "lng": -0.1625,
  "battery": 4,
  "lastSeenAt": "2026-11-24T15:08:00Z",
  "health": "offline",
  "inMaintenance": false,
  "latest": { "ts": "2026-11-24T15:08:00Z", "value": null, "unit": "percent", "status": "offline" }
}
```
`health` is one of `ok`, `low-battery`, `offline`, `maintenance`.
`status` is one of `safe`, `watch`, `danger`, `offline`. **The backend computes `status` from the thresholds in §7**, so every screen shows the same colour for the same reading.

### 6.4 Suggestion
```json
{
  "id": "sug_01HF3K",
  "kind": "flood",
  "zoneId": "makola",
  "title": "Flood warning: Makola Market",
  "severity": "danger",
  "trigger": { "sensorId": "DL-MK-02", "value": 89, "limit": 80, "unit": "percent" },
  "evidence": "DL-MK-02 at 89% (limit 80%) · rain 31.1 mm/h",
  "confidence": 0.8,
  "source": "flood-0.1",
  "createdAt": "2026-11-24T15:58:00Z",
  "expiresAt": "2026-11-24T16:08:00Z",
  "draft": { "en": "AMA FLOOD ALERT: High flood risk in Makola Market now. ...", "tw": "", "ga": "" },
  "audience": { "label": "Residents and traders", "count": 1240, "isPublic": true },
  "review": { "state": "suggested" }
}
```
`kind` is `flood`, `waste` or `air`. `severity` is `watch` or `danger`.
`review.state` is one of `suggested`, `in-review`, `edited`, `waiting-second`, `sent`, `rejected`, `expired`.
`audience` is **a count only**. The API never returns phone numbers.

### 6.5 Workflow actions
`POST /api/v1/suggestions/{id}/actions`

| `action` | Body | Rules enforced by the backend |
|---|---|---|
| `open` | — | Marks "in review" and locks it to this officer |
| `approve` | `{ "messages": {...}, "severity": "danger", "scope": "zone", "channels": { "sms": true, "app": true }, "copyNadmo": true }` | If `scope` is `all`, the state becomes `waiting-second` and a **different** officer must approve |
| `reject` | `{ "reason": "False reading or faulty sensor", "note": "" }` | `reason` is required |

Every action writes an **audit entry** that cannot be edited:
```json
{ "at": "2026-11-24T16:02:00Z", "subject": "sug_01HF3K", "who": "U-01", "role": "ama", "action": "approve", "detail": { "before": "...", "after": "..." } }
```

### 6.6 Citizen report
```json
// POST /api/v1/reports   (header X-Device-Id: 3f9c…)
{ "kind": "drain", "zoneId": "makola", "place": "Kinbu Rd culvert", "note": "Sand and plastic in the drain", "photo": null }
// response
{ "ref": "R-1042", "status": "received", "createdAt": "2026-11-24T16:40:00Z" }
```
`kind` is `drain`, `bin` or `burning`. `status` goes `received` → `assigned` → `fixed`. No name or phone number is collected.

### 6.7 Errors
```json
{ "error": { "code": "forbidden", "message": "Collectors can only see bins in their own zone." } }
```
Codes: `bad_request` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409, e.g. another officer is already reviewing), `server_error` (500).

## 7. Thresholds (DRAFT: Clifford to confirm)

| Measure | Watch from | Act now from | Notes |
|---|---|---|---|
| Drain level | 60% | 80% | % of drain depth |
| Bin fill | 70% | 90% | |
| PM2.5 | 15 µg/m³ | 35 µg/m³ | WHO 24-hour guideline is 15 |
| Flood risk score | 40 | 70 | 0–100 |

These match `frontend/src/lib/status.ts`. Change both together.

## 8. Open questions

| # | Question | Who decides |
|---|---|---|
| 1 | Kinesis, or IoT Core rule → Lambda → database directly? (Kinesis charges per hour even when idle.) | Alice |
| 2 | TimescaleDB on our existing RDS, or a separate instance? | Alice |
| 3 | Final thresholds and flood-risk formula | Clifford |
| 4 | SMS provider for Ghana numbers, and sender ID registration time | Alice + Isaac |
| 5 | Who writes the Twi and Ga alert templates? | Isaac |
| 6 | Polling every 60 s, or WebSockets (a live connection) for the dashboard? Polling is simpler; start there. | Henry + Alice |

## 9. How the frontend maps to this

The frontend currently uses fake data in `frontend/src/data/mock.ts`. Each function will be replaced by one API call:

| Mock function | API call |
|---|---|
| `SENSORS`, `isOffline`, `isLowBattery` | `GET /sensors` |
| `readingsAt(hour)` | `GET /readings/latest` (live) or `GET /readings` (replay) |
| `rainAt(zone, hour)` | `GET /rain` |
| `floodRiskAt(zone, hour)` | `GET /zones/{id}/flood-risk` |
| `suggestionsAt(hour)` | `GET /suggestions?status=pending` |
| `stores/approvals.ts` actions | `POST /suggestions/{id}/actions` |
| `stores/field.ts` | `POST /bins/{id}/emptied`, `POST /reports`, `GET /reports/mine` |
| `stores/admin.ts` | `/users`, `PATCH /sensors/{id}` |
