# SmartCity Accra: Alert Templates (English, Twi, Ga)

**Status:** DRAFT v0.1. Answers open question 5 in [data-contract.md](data-contract.md#8-open-questions).
**Owner:** Isaac (community, ethics and documentation).
**Purpose:** fix the wording of every alert we send by SMS and in the app, so that a person can check it, it fits in one SMS, and it reads naturally to residents and traders in East Legon and Makola.

> **Translation warning.** The Twi lines below are **first drafts only**. A native Twi speaker must check them before we use them. The Ga lines are **not written yet**. We need a native Ga speaker, ideally from the Makola trading community. Until a line is signed off in [section 7](#7-review-and-sign-off), the review screen must show the English text only.

---

## 1. Rules for every template

1. **One SMS.** The longest zone name is "Makola Market" (13 characters). With that zone, the English text must fit in **160 characters**. See [section 2](#2-sms-length-and-the-twi-letters-ɛ-and-ɔ) for Twi and Ga.
2. **Start with who and what.** Every message starts with `AMA` and the alert type in capitals (e.g. `AMA FLOOD ALERT:`), so people can tell a real alert from spam.
3. **Say what to do.** Every public alert gives at least one action ("Avoid low roads and drains").
4. **Plain words.** No jargon, no model scores, no sensor IDs in public alerts. `PM2.5` is the one exception, because people see it in the news and on the app.
5. **No personal data.** Templates never include names or phone numbers (Act 843).
6. **Tell people when it is over.** Every alert type has an "all clear" message. Without one, people stay afraid, or they stop trusting alerts that never end.
7. **Calm, not alarming.** Use "High flood risk", not "DANGER! FLOODING!". Only use capitals in the prefix.
8. **The officer can edit, but the meaning stays.** If an officer changes the English text, the review screen should warn that the Twi and Ga text must be checked again.

## 2. SMS length and the Twi letters ɛ and ɔ

A plain SMS uses the **GSM-7** alphabet (the basic SMS character set) and holds **160 characters**. Twi and Ga use the letters **ɛ** and **ɔ**, which are **not** in GSM-7. A single one of these letters switches the whole SMS to **UCS-2** (the Unicode SMS format), and the limit drops to **70 characters**. Long messages are then split into 67-character parts.

So a 150-character Twi alert costs **1 SMS** without ɛ/ɔ but **3 SMS** with them. Every recipient pays that cost, and each part can arrive separately.

**Proposal:** we send each Twi/Ga alert in two forms:

| Channel | Spelling | Why |
|---|---|---|
| App (citizen app, alerts list) | Correct spelling with ɛ and ɔ | No length limit; respects the language |
| SMS | ASCII form: ɛ → `e`, ɔ → `o` | Fits in one 160-character SMS. Many Ghanaians already text Twi this way. |

The native-speaker reviewer should confirm the ASCII form is still easy to read.

**Note for Henry:** `smsParts()` in `frontend/src/data/messages.ts` always counts 160/153. It should count 70/67 when the text contains any character outside GSM-7.

## 3. Placeholders

| Placeholder | Filled from | Example |
|---|---|---|
| `{zone}` | Zone name from `GET /api/v1/zones` | `Makola Market` |
| `{value}` | `trigger.value` (air only) | `48` |
| `{evidence}` | `evidence` on the suggestion (collector tasks only) | `BF-MK-02 at 94%` |
| `{time}` | Deadline, local time (GMT), 24-hour | `18:00` |
| `{ref}` | Citizen report reference | `R-1042` |

Zone names stay in English in every language ("Makola Market", "East Legon"), because that is how people say them.

## 4. Public alerts (SMS + app)

These need approval on the review screen ([design brief §8](design-brief.md#8-alert-approval-workflow)).

### 4.1 Flood alert (`kind: flood`, `severity: danger`)

| Lang | Text |
|---|---|
| en | `AMA FLOOD ALERT: High flood risk in {zone} now. Drains are nearly full. Avoid low roads and drains. Move goods off the ground.` |
| tw *(draft)* | `AMA NSUYIRI KOKOBƆ: Nsuyiri asiane kɛse wɔ {zone} seesei. Nsukwan no aka kakra ma. Mfa akwan a ɛda fam ne nsukwan ho. Yi w'adeɛ fi fam.` |
| ga | *To be written* |

### 4.2 Flood watch (`kind: flood`, `severity: watch`)

| Lang | Text |
|---|---|
| en | `AMA FLOOD WATCH: Drains in {zone} are rising after heavy rain. Avoid walking near drains. We will update you.` |
| tw *(draft)* | `AMA NSUYIRI HWƐ YIE: Nsu rekɔ soro wɔ {zone} nsukwan mu esiane osu kɛse. Nnantew mmɛn nsukwan. Yɛbɛka nsɛm foforɔ akyerɛ wo.` |
| ga | *To be written* |

### 4.3 Flood all clear (new)

| Lang | Text |
|---|---|
| en | `AMA FLOOD UPDATE: Flood risk in {zone} is now low. Take care on roads that were flooded. Report blocked drains in the app.` |
| tw *(draft)* | `AMA NSUYIRI NSƐM: Nsuyiri asiane wɔ {zone} so atew seesei. Hwɛ yie wɔ akwan a nsu faa so no. Bɔ nsukwan a asiw ho amanneɛ wɔ app no so.` |
| ga | *To be written* |

### 4.4 Air advisory (`kind: air`)

| Lang | Text |
|---|---|
| en | `AMA AIR ADVISORY: Air in {zone} is unhealthy (PM2.5 {value}). Limit time outdoors, do not burn waste, wear a mask if you can.` |
| tw *(draft)* | `AMA MFRAMA HO KOKOBƆ: Mframa a ɛwɔ {zone} nye mma apɔmuden (PM2.5 {value}). Ntena abɔnten nkyɛ, nhyew nwura, fa mask hyɛ sɛ wobetumi a.` |
| ga | *To be written* |

### 4.5 Air all clear (new)

| Lang | Text |
|---|---|
| en | `AMA AIR UPDATE: Air in {zone} is better now. Please keep from burning waste. Report burning in the app.` |
| tw *(draft)* | `AMA MFRAMA NSƐM: Mframa a ɛwɔ {zone} ayɛ yie seesei. Yɛsrɛ wo, nhyew nwura. Bɔ nwura hyew ho amanneɛ wɔ app no so.` |
| ga | *To be written* |

## 5. Collector tasks (app, SMS backup)

These go to waste collectors in their own zone only. They are not public, but they still pass the review screen.

### 5.1 Collection task (`kind: waste`)

| Lang | Text |
|---|---|
| en | `AMA TASK: {evidence} in {zone}. Please collect before {time}. Route is in the app.` |
| tw *(draft)* | `AMA ADWUMA: {evidence} wɔ {zone}. Yɛsrɛ wo, yi nwura no ansa na {time} adu. Kwan no wɔ app no mu.` |
| ga | *To be written* |

**Question for the team:** do collectors want Twi/Ga, or is English fine for task messages? We should ask the collector teams instead of guessing.

## 6. Citizen report updates (app only, no SMS)

These are not reviewed, because they only confirm the citizen's own report. They are shown in the app, so length and the ɛ/ɔ letters don't matter here.

| Status | en | tw *(draft)* | ga |
|---|---|---|---|
| `received` | `Thank you. We got your report {ref}. An AMA officer will look at it.` | `Yɛda wo ase. Yɛanya wo amanneɛbɔ {ref}. AMA panin bi bɛhwɛ so.` | *To be written* |
| `assigned` | `Report {ref}: a team has been sent to fix it.` | `Amanneɛbɔ {ref}: yɛasoma kuw bi sɛ wɔnkɔsiesie.` | *To be written* |
| `fixed` | `Report {ref}: this problem is marked as fixed. Thank you for helping keep {zone} clean.` | `Amanneɛbɔ {ref}: yɛasiesie ɔhaw yi. Yɛda wo ase sɛ woboa ma {zone} ho te.` | *To be written* |

## 7. Review and sign-off

A line counts as ready only when a native speaker has checked it. The reviewer checks that it:
- means the same as the English,
- sounds natural, not like a word-for-word translation,
- is clear to someone with little schooling,
- is still readable in the ASCII SMS form (ɛ → e, ɔ → o).

Reviewers are recorded by **role only** (the repo is public).

| Language | Reviewer (role) | Date | Status |
|---|---|---|---|
| English | Team | | Draft |
| Twi | *Native Twi speaker, to be found* | | Draft, not checked |
| Ga | *Native Ga speaker, ideally a Makola trader* | | Not started |

## 8. Glossary for translators

Please use the same word for each term in every template.

| English | Twi (draft) | Ga |
|---|---|---|
| Flood | nsuyiri | |
| Drain / gutter | nsukwan | |
| Alert / warning | kokobɔ | |
| Watch / be careful | hwɛ yie | |
| Update / news | nsɛm | |
| Air | mframa | |
| Waste / rubbish | nwura | |
| Burn | hyew | |
| Report (noun) | amanneɛbɔ | |
| Task / work | adwuma | |
| Risk / danger | asiane | |
