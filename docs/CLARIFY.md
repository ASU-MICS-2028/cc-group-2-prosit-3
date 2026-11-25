# SmartCity Accra: CLARIFY (Users, Roles and Access)

**Status:** DRAFT v0.1, for team review. Replaces the missing file that the [README](../README.md#users) links to.
**Owner:** Isaac (community, ethics and documentation).
**Purpose:** set out who uses the platform, what each role can see and do, and which roles the prototype builds. The other parts of the system (backend filtering, Cognito groups, frontend views) follow this file.

> **Note for the team.** The README promises "14 roles + a public portal". The five **built** roles below come from the code (`frontend/src/stores/admin.ts`) and the [data contract](data-contract.md#61-logins-and-access). The nine **designed-only** roles are my proposal. If an earlier version of this list exists (e.g. from the PROSIT write-up), please send it and I will merge the two.

---

## 1. Principles

1. **Least privilege.** Each role sees only what its job needs, in its own zone where possible.
2. **The backend enforces access.** Hiding a button in the UI is not enough ([data contract §6.1](data-contract.md#61-logins-and-access)).
3. **Humans decide.** AI suggestions are only suggestions. Only an AMA officer can approve and send an alert.
4. **No personal data in the platform's views.** No role, admin included, can see citizen phone numbers. Recipients appear as counts only (Act 843).
5. **Every action is audited.** Who, what, when, before and after. Nobody can edit the audit log.
6. **Citizens are anonymous.** They don't log in. A random device ID lets them track their own reports.

## 2. All roles at a glance

| # | Role | Organisation | Prototype | Login | Zone-scoped |
|---|---|---|---|---|---|
| 1 | **AMA officer** | Accra Metropolitan Assembly | **Built** | Cognito `ama` | No (all pilot zones) |
| 2 | **Waste collector** | AMA / contracted waste company | **Built** | Cognito `collector` | Yes |
| 3 | **Citizen** (resident or trader) | Public | **Built** | None (device ID) | Yes (own zone) |
| 4 | **NADMO officer** | National Disaster Management Organisation | **Built** | Cognito `nadmo` | No |
| 5 | **System admin** | Platform team | **Built** | Cognito `admin` | No |
| 6 | AMA supervisor (second approver) | AMA | Designed only | | No |
| 7 | Waste company supervisor | Contracted waste company | Designed only | | Yes |
| 8 | Market association leader | Makola traders' association | Designed only | | Yes |
| 9 | Assembly member / unit committee | Local government | Designed only | | Yes |
| 10 | EPA officer | Environmental Protection Agency | Designed only | | No |
| 11 | GMet forecaster | Ghana Meteorological Agency | Designed only | | No |
| 12 | Data and ML analyst | Platform team | Designed only | | No |
| 13 | Data protection officer / auditor | AMA | Designed only | | No |
| 14 | Utility partner (Police, ECG, Ghana Water) | External | Designed only (future work) | | No |
| — | **Public open data portal** | Anyone | Designed only | None | — |

## 3. Built roles (the prototype)

### 3.1 AMA officer
- **Job:** watches the pilot zones and decides which alerts go out.
- **Sees:** flood, waste and air data for all pilot zones; pending AI suggestions; citizen reports (without device IDs); the audit log.
- **Does:** opens, edits, approves or rejects suggestions. City-wide alerts need a **second, different** officer to approve.
- **Screens:** AMA dashboard, alert review screen.

### 3.2 Waste collector
- **Job:** empties bins on a daily route.
- **Sees:** bins in **their own zone only**, in route order, with fill % and tasks.
- **Does:** marks bins as emptied.
- **Cannot:** see drains, air quality or other zones (`403`).
- **Screens:** collector phone app.

### 3.3 Citizen (resident or market trader)
- **Job:** stays safe, and reports problems.
- **Sees:** a simple flood and air status for their zone, and the alerts sent to it.
- **Does:** reports a blocked drain, an overflowing bin or waste burning (photo optional, no name). Tracks their own reports.
- **Gets:** SMS alerts in English, Twi or Ga (see [alert-templates.md](alert-templates.md)).
- **Screens:** citizen phone app, SMS.

### 3.4 NADMO officer
- **Job:** prepares the disaster response when flood risk is high.
- **Sees:** **flood data only**, plus flood alerts that were sent. Gets red suggestions that nobody reviewed within 10 minutes.
- **Does:** acknowledges alerts ("NADMO has seen this").
- **Cannot:** approve or send alerts.
- **Screens:** NADMO view (read-only dashboard).

### 3.5 System admin
- **Job:** keeps the platform and sensors running.
- **Sees:** sensor health (battery, last seen), the user list, the audit log.
- **Does:** invites, suspends and reactivates staff; puts sensors into maintenance.
- **Cannot:** approve alerts, or see citizen phone numbers.
- **Screens:** admin view.

## 4. Designed-only roles

These are not built. They show how the platform would grow after the pilot.

| Role | Would see | Would do | Why it matters |
|---|---|---|---|
| **AMA supervisor** | Everything an AMA officer sees | Gives the second approval for city-wide alerts; reviews rejected suggestions | Makes the two-person rule a separate, senior role |
| **Waste company supervisor** | Bins, routes and collector progress in their contract zones | Reassigns routes; confirms tasks are done | Collection is often contracted out, so contractors need their own view |
| **Market association leader** | Makola flood and waste status; reports from the market | Passes alerts on to traders by word of mouth; adds reports for traders without smartphones | Trusted messengers reach people SMS misses |
| **Assembly member / unit committee** | Status and report summaries for their area | Raises issues with the AMA | Local accountability; brings community feedback into the system |
| **EPA officer** | Air quality data and forecasts | Gives advice on air thresholds; enforces rules on burning | EPA holds the national air quality mandate |
| **GMet forecaster** | Rain gauge data | Shares official rain forecasts with the platform | Better flood predictions; official weather source |
| **Data and ML analyst** | Readings with no personal data; rejected suggestions and their reasons | Retrains and checks models | Officers' rejections are the feedback that improves the models ([design brief §8.1](design-brief.md#81-states)) |
| **Data protection officer / auditor** | Audit log, access logs, consent records | Checks compliance with Act 843; handles data requests | Independent check on how the platform uses data |
| **Utility partner** (Police, ECG, Ghana Water) | Only the data shared under an agreement | Future: traffic, power and water feeds | Listed as future work in the README |

## 5. Public open data portal

- **Who:** anyone. No login.
- **Shows:** zone-level summaries (daily drain levels, bin collection rates, hourly air quality), with a **delay** (e.g. 1 hour) so that live alerts still come from the AMA.
- **Never shows:** device IDs, report photos, exact report locations, or anything else that could identify a person.
- **Licence:** open, e.g. CC BY 4.0 (to be agreed).
- **Why:** transparency, and lets researchers, journalists and students use the data.

## 6. Access matrix (built roles)

This matches `PERMISSIONS` in `frontend/src/stores/admin.ts`. Change both together.

| Action | AMA | NADMO | Collector | Citizen | Admin |
|---|---|---|---|---|---|
| See flood data | ✓ | ✓ | — | Own zone, simple view | Sensor health only |
| See waste data | ✓ | — | Own zone | — | Sensor health only |
| See air quality | ✓ | — | — | Own zone, simple view | Sensor health only |
| Approve and send alerts | ✓ | — | — | — | — |
| Acknowledge flood alerts | — | ✓ | — | — | — |
| Mark bins as emptied | — | — | ✓ | — | — |
| Report a problem | — | — | — | ✓ | — |
| Manage users and sensors | — | — | — | — | ✓ |
| See citizen phone numbers | — | — | — | — | — |

## 7. Open questions

| # | Question | Who decides |
|---|---|---|
| 1 | Is this the right list of 14 roles? Does an earlier version exist? | Team |
| 2 | Should the AMA supervisor (role 6) be built, so the two-person check uses a real separate role? | Henry + Alice |
| 3 | How do citizens sign up for SMS (USSD short code, app, community sign-up) and how do they opt out? | Isaac + Alice |
| 4 | How long do we keep citizen reports and photos? | Isaac |
| 5 | Should the market association leader be able to submit reports on behalf of traders? | Isaac (ask the traders) |
