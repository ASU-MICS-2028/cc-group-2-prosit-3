# SmartCity Accra

**Clean drains, clean air, fewer floods.**

A cloud platform that uses IoT (connected sensors), machine learning and AI to give early warnings and better city services in Accra, Ghana. Built for ICS 534 Cloud Computing (PROSIT 3), Ashesi University.

> **All sensor data in this project is simulated.** No physical devices are used. See [Built vs simulated](#built-vs-simulated).

## Focus areas
We focus on three linked problems in Accra:

| Area | Why it matters | The link |
|---|---|---|
| **Flooding** | Drains overflow during heavy rain | Uncollected waste blocks drains → floods |
| **Waste** | Bins overflow, especially in markets | Burned waste → air pollution |
| **Air quality** | PM2.5 is high, worst in Harmattan | |

Traffic, water and energy are future work, because they need data from the Police, Ghana Water and ECG.

**Pilot areas:** East Legon (residential) and Makola Market (dense commerce).

## Users
The prototype builds five roles: **AMA officer**, **waste collector**, **citizen**, **NADMO** and **admin**. Each user is tied to a zone and gets only the access their job needs. AI suggestions are approved by a person before they are sent, and alerts go by SMS as well as the app.

The full user structure (14 roles + a public portal) is in [docs/CLARIFY.md](docs/CLARIFY.md).

## Architecture (draft)
```
Simulated sensors → simulated edge gateway → AWS IoT Core (MQTT)
  → streaming pipeline → time-series database → ML models
  → alerts + AI suggestions (human approval) → SMS
  → AMA dashboard · collector app · citizen app · open data portal
```

Message formats, API endpoints and ML outputs are defined in [docs/data-contract.md](docs/data-contract.md) (draft).
Visual rules and the alert approval workflow are in [docs/design-brief.md](docs/design-brief.md).

## Built vs simulated
| Part | Status |
|---|---|
| Sensors (drain level, bin fill, PM2.5) | **Simulated** in software |
| Edge gateway (Raspberry Pi) | **Simulated** in software |
| Radio network (LoRaWAN) | **Simulated** |
| AMA, Police, ECG, Ghana Water integrations | **Designed only**, not connected |
| Cloud pipeline, database, ML, dashboard, apps | Built (in progress) |
| SMS alert | Planned: real SMS to test numbers only |

## Repository layout
```
docs/        CLARIFY, design brief, architecture notes
simulator/   sensor + edge gateway simulation
backend/     API, AWS IoT Core and pipeline code
ml/          prediction models
frontend/    AMA dashboard + citizen and collector apps
```

## Run the dashboard locally
```bash
cd frontend
npm install
npm run dev
```
Then open the address it prints (usually http://localhost:5173).

## Team: Storm Surfers
| Member | Role |
|---|---|
| Alice Iris Kare Acquah | Cloud and infrastructure |
| Henry Kofi Brandoh | Application (dashboard and apps) |
| Clifford Yeboah | Data and ML |
| Isaac Ansah Amoah | Community, ethics and documentation |

## Data and privacy
This repo is public. It contains fake data only. No real names or phone numbers. Sensors collect no personal data (Ghana Data Protection Act, Act 843).
