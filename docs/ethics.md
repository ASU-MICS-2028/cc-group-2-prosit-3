# SmartCity Accra: Ethics, Privacy and Responsible AI

**Status:** DRAFT v0.1, for team review.
**Owner:** Isaac (community, ethics and documentation).
**Purpose:** set out the ethical risks of the platform, what the design already does about them, and what is still open. It covers privacy under Ghana's Data Protection Act, 2012 (Act 843), human control of AI, fairness and inclusion, and what happens when the system gets it wrong.

*This is a student project, not legal advice. A real deployment would need review by the AMA's legal team and the Data Protection Commission (DPC).*

---

## 1. Summary

| Risk | Main safeguard | Status |
|---|---|---|
| Personal data leaks or is misused | Collect almost none: sensors measure the environment, citizens are anonymous, phone numbers never shown | Designed, partly built |
| AI sends a wrong or harmful alert | A person approves every alert; a second person for city-wide alerts; audit log | Built in prototype |
| False alarms make people stop trusting alerts | Evidence check on the review screen, rejection feedback to ML, "all clear" messages | Partly built |
| A missed flood (no alert) | Expiry escalation to a second officer and NADMO; sensor health warnings | Built in prototype |
| Some people can't get or read alerts | SMS (works on basic phones), English/Twi/Ga, trusted community messengers | Designed |
| The system puts some areas ahead of others | Only two pilot zones; the choice is explained, and expansion is planned | Open |
| Reports used to target traders or residents | Reports are about places, not people; no names; no enforcement use | Designed |

## 2. Privacy and Act 843

### 2.1 What we collect

| Data | Personal? | Why we need it | Who can see it |
|---|---|---|---|
| Drain level, bin fill, PM2.5, rain | **No.** They measure the environment, not people | Core purpose | Roles that need them ([CLARIFY](CLARIFY.md)) |
| Staff accounts (role, zone, login) | Yes, staff only | Access control, audit | Admin |
| Audit log (who did what) | Yes, staff only | Accountability | AMA, admin |
| Citizen device ID | Pseudonymous (a random ID, not linked to a name) | Lets citizens track their own reports | Nobody in the UI; the backend only |
| Citizen report (place, note, optional photo) | Possibly. A photo or note may show a person or a house | Fix drains and bins | AMA (without device ID) |
| Citizen phone number (SMS alerts) | **Yes** | Sending alerts | **Nobody in the UI.** Only the SMS provider receives it |

**In the prototype**, all of this is fake. The repo is public, so it holds no real names or numbers. Photos stay on the phone and are not uploaded.

### 2.2 How we meet Act 843's principles

| Principle | What we do |
|---|---|
| **Consent and purpose** | Citizens opt in to SMS alerts for one zone. The sign-up screen says what we send and why. Numbers are used for alerts only. |
| **Minimality** | No name, no login, no GPS tracking for citizens. Report location is the pin they choose, not their phone's location. |
| **Security** | Phone numbers encrypted at rest; API keys in AWS Secrets Manager; the backend filters every response by role and zone ([data contract §6.1](data-contract.md#61-logins-and-access)). |
| **Retention** | See 2.3. |
| **Data subject rights** | Replying STOP removes a number from alerts. A citizen can delete their reports from the app (to build). |
| **Accountability** | An audit log nobody can edit; a named data protection role in a real deployment (CLARIFY role 13). |

### 2.3 How long we keep data (proposal)

| Data | Keep for | Then |
|---|---|---|
| Sensor readings | Indefinitely | Not personal. Needed to train and check models. |
| Citizen reports | 12 months after "fixed" | Delete the note and photo. Keep only kind, zone and dates for statistics. |
| Report photos | 90 days after "fixed" | Delete. |
| Phone numbers | Until the person replies STOP, or 12 months with no alerts | Delete. Keep the number in the suppression list only as a one-way hash (a scrambled form that can't be turned back into the number). |
| Audit log | 5 years | Archive. |

### 2.4 Photos

Photos are the biggest privacy risk in a citizen report: a picture of a drain may show a face, a house number or a car plate.
- The app tells people, before they take the photo, to point at the problem and not at people.
- In a real deployment, photos would be blurred automatically (faces, plates) before an officer sees them, or at least reviewed before being shared.
- Photos never appear on the public open data portal.

## 3. Humans in control of AI

The ML models suggest. People decide. This is the key ethical choice in the design ([design brief §8](design-brief.md#8-alert-approval-workflow)).

| Safeguard | Why |
|---|---|
| **No alert goes out without an officer's approval** | A model can be wrong, and a public alert affects thousands of people |
| **Evidence on the review screen**: readings, thresholds, rain, nearby sensors, sensor health | The officer can check whether it's real in under a minute, and doesn't just approve whatever the model says |
| **Confidence shown in plain words** ("High (0.87)") | Officers should trust a suggestion only as much as the model's confidence justifies |
| **Two-person check for city-wide alerts** | The bigger the impact, the more checks |
| **Rejection reason required** | Gives the ML team feedback; shows the decision was made on purpose |
| **Audit log** | Anyone can trace who approved what, and when |

**Risk: automation bias.** Officers may start approving everything without really checking. To reduce it:
- the review screen shows evidence **before** the Approve button;
- officer approval rates are monitored, and a 100% approval rate over weeks is a warning sign;
- the team runs drills with deliberately wrong suggestions (e.g. a faulty sensor) to check that officers catch them.

## 4. When the system is wrong

### 4.1 False alarm (alert sent, no flood)
- **Harm:** traders move goods and lose sales; people stop trusting alerts (the "cry wolf" effect).
- **Safeguards:** human approval; a check for a single faulty sensor (do nearby sensors agree?); a **"watch"** level before **"act now"**; an **all clear** message once the risk passes.
- **After it happens:** the officer records why; the ML team looks at the case; the threshold is reviewed if it happens often.

### 4.2 Missed flood (no alert, flood happens)
- **Harm:** this is the worse error: damage to property, injury, death.
- **Safeguards:** red suggestions not reviewed within 10 minutes go to a second officer and to NADMO; offline sensors are clearly flagged so a silent sensor isn't read as "safe"; NADMO sees flood data directly.
- **Design choice:** for floods, we **prefer false alarms to missed floods**. Thresholds are set to warn early, and the "watch" level absorbs most of the cost of being cautious.
- **Responsibility:** the platform supports the AMA and NADMO; it does not replace them. Officers stay responsible for the decision. This must be clear in training and in public messaging, so nobody assumes "no SMS" means "safe".

### 4.3 Sensor tampering or failure
- Sensors in public places can be damaged, moved or blocked.
- Offline and low-battery sensors are shown as **grey ("do not trust")**, never as safe.
- The admin view puts failing sensors at the top of the list.

## 5. Fairness and inclusion

| Group | Risk | What we do |
|---|---|---|
| People without smartphones | Left out of app alerts | **SMS is the main channel** and works on any phone |
| People who don't read English well | Can't understand alerts | Twi and Ga alerts, short plain words, checked by native speakers (alert templates doc) |
| People who can't read, or have no phone | Left out completely | Trusted messengers: market association leaders and unit committees pass alerts on by word of mouth (CLARIFY roles 8–9). Future: voice calls in local languages. |
| People with poor eyesight or colour blindness | Can't read the app | Status is always a word **and** a colour; large text in the phone apps ([design brief §1](design-brief.md#1-principles)) |
| Areas outside the pilot | No sensors, no alerts | The pilot is two zones only. We say so openly, and plan expansion by flood history and need, not by wealth or influence. |

**Zone choice.** The pilot covers one well-off residential area (East Legon) and one dense, lower-income commercial area (Makola). Flood-prone low-income areas (e.g. along the Odaw) need the system most. Expansion should start there.

**Model bias.** The models learn from sensor data. If some areas have fewer or older sensors, their predictions will be worse. The ML team should report accuracy **per zone**, not only overall.

## 6. Citizen reports and enforcement

Reports about burning waste or overflowing bins could be used to blame or punish traders and residents. That would put people off reporting, and could be used unfairly against poorer groups.

- Reports are about **places and problems**, not people.
- No names, and no device IDs shown to officers.
- **Reports are for fixing problems, not for fines or enforcement.** This should be agreed with the AMA before a real pilot, and stated in the app.

## 7. Transparency

- Every screen carries a **"Simulated data"** label in the prototype.
- The citizen app has a plain-language "How this works" page: what sensors measure, that a person approves every alert, and what data we keep.
- The public open data portal publishes zone-level data with a delay (CLARIFY §5).
- Model versions are recorded with every suggestion (`modelVersion`, [data contract §5](data-contract.md#5-ml-outputs-clifford--backend)).

## 8. Environmental cost

The platform itself has an environmental cost: sensor batteries, hardware waste and cloud computing.
- Sensors report less often in normal weather and more often in storms ([data contract §3.3](data-contract.md#33-how-often-sensors-report)).
- Cloud services that cost money while idle (e.g. Kinesis) are avoided where possible (data contract open question 1).
- Plan for sensor batteries and devices to be collected and recycled at the end of their life.

## 9. Open questions

| # | Question | Who decides |
|---|---|---|
| 1 | Agree the retention periods in §2.3 | Isaac + Alice |
| 2 | Will the AMA agree that reports aren't used for enforcement (§6)? | AMA (real deployment) |
| 3 | Should we build photo blurring, or turn photo upload off for now? | Henry + Isaac |
| 4 | Which zone comes after the pilot, and on what criteria? | Team |
| 5 | Who trains officers on automation bias, and how often do we run drills? | AMA (real deployment) |
