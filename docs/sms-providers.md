# SmartCity Accra: SMS Provider Comparison

**Status:** DRAFT v0.1, for team review. Answers open question 4 in [data-contract.md](data-contract.md#8-open-questions): *"SMS provider for Ghana numbers, and sender ID registration time"*.
**Owners:** Isaac (research, compliance) + Alice (integration).
**Researched:** 2026-11-25, from vendor websites and docs. Prices change often, so **check them again before buying credits.**

---

## 1. Recommendation

**Use Arkesel**, with **Hubtel as the backup**.

| Why Arkesel | |
|---|---|
| Cheapest of the options we checked | ~GHS 0.022–0.031 per SMS |
| Developer-friendly | REST + JSON API, API key in a header |
| Delivery callbacks | Arkesel calls our endpoint with the delivery status, which fills the "delivered / failed / pending" counts on the review screen ([design brief §8.1](design-brief.md#81-states)) |
| Free to start | Free sign-up, free test credits, no credit card |
| Scheduling and sender IDs | Both supported |

**Don't use** AWS End User Messaging or Twilio for Ghana. They cost far more per SMS and still need the same sender ID registration.

## 2. What we need

| Need | Why |
|---|---|
| Sends to MTN, Telecel and AirtelTigo | Covers almost all Ghanaian numbers |
| HTTP API we can call from AWS Lambda | The backend sends the alert after an officer approves it |
| Delivery reports, ideally pushed to us | The review screen shows delivered / failed / pending |
| Unicode (UCS-2) support | Twi and Ga letters ɛ and ɔ (see the alert templates doc, PR #1) |
| Custom sender ID | People must be able to tell a real alert from spam |
| Low cost, prepaid, no monthly fee | Student budget; we only text test numbers in the prototype |

## 3. Comparison

| | **Arkesel** | **Hubtel** | **mNotify (now "BMS")** | **AWS End User Messaging** | **Twilio** |
|---|---|---|---|---|---|
| Price per SMS to Ghana | GHS 0.022–0.029 (credits expire in 3 months); GHS 0.025–0.031 (no expiry) | GHS 0.033 (Hubtel SMS); network routes listed at 0.015–0.030 | About GHS 0.027–0.035 (from an earlier search; pricing page now 404) | Not confirmed. Ghana rate is in AWS's pricing CSV | US$0.3741 |
| API | REST + JSON, `api-key` header | API with an "integration key" from the developer portal | API v2.0 (docs site would not load) | AWS SDK, native to our stack | REST |
| Delivery reports | **Pushed callbacks** to our endpoint | Not confirmed (developer portal blocked us) | Reported to be polling only | Yes (AWS events) | Yes (callbacks) |
| Unicode | Not stated on the pages we read: **test it** | Not stated | Not stated | Yes | Yes (UCS-2) |
| Free trial | Free sign-up and test credits | Not stated | Free SMS on sign-up (reported) | Sandbox mode | Trial credit |
| Sender ID | Custom sender IDs, registered through Arkesel | Supported | Supported | Supported in Ghana; pre-registered ID needed | Required on MTN; ~2 weeks |
| Two-way (replies) | Not stated | Not stated | Not stated | Yes | No |

**Cost in practice.** Local providers charge about **GHS 0.03** per SMS. The global providers charge more than 100 times that: Twilio's US$0.37 is roughly GHS 4–5 per SMS.

## 4. What it would cost

The pilot zones have about **2,100 subscribers** (fake figures from `frontend/src/data/messages.ts`: 860 in East Legon, 1,240 in Makola).

| Scenario | SMS sent | Cost at GHS 0.03 |
|---|---|---|
| **Prototype demo** (test numbers only, ~10 phones, ~50 alerts) | ~500 | **~GHS 15** |
| One flood alert to all pilot subscribers, plain text (1 part) | 2,100 | ~GHS 63 |
| Same alert in Twi **with** ɛ/ɔ (UCS-2, 3 parts) | 6,300 | ~GHS 189 |
| A rainy-season month: 8 alerts + 8 all clears, 1 part each | 33,600 | ~GHS 1,000 |

The third row is why the alert templates doc proposes **ASCII spelling by SMS** (ɛ → e, ɔ → o). It cuts the cost of a Twi alert by about two thirds.

## 5. Sender ID

A **sender ID** is the name shown instead of a phone number, e.g. `SCAccra`.

- **It must be registered.** Since **8 July 2026**, MTN blocks messages from unregistered sender IDs (Twilio Ghana guidelines). Registration goes through the SMS provider, which submits it to the NCA and to each network.
- **Time:** sources range from 1–3 days to 4 weeks. Two sources say about **2 weeks**. **Plan for 2–4 weeks.**
- **Rules:** at most **11 characters**; it must match the organisation's name; generic IDs (e.g. `ALERT`, `INFO`) are rejected; promotional content can't be registered.
- **Our proposal:** `SCAccra` (7 characters). We must **not** register `AMA` or anything like it, because we are not the Accra Metropolitan Assembly. In a real deployment, the AMA would register its own ID.
- **For the demo:** if registration isn't done in time, send to the team's test phones using the provider's default sender ID, and say so in the demo.

**Action:** apply for the sender ID **this week**. It is the slowest step.

## 6. Consent, opt-out and the law

*This is based on vendor guides, not legal advice. Check it against the Data Protection Commission and NCA before a real pilot.*

| Topic | Rule | What we do |
|---|---|---|
| **Consent (Act 843, s.20)** | Processing personal data needs the person's prior consent, for a stated purpose | Citizens **opt in** to alerts for one zone. The sign-up screen says what we send and why. Numbers are used for alerts only, never anything else. |
| **Opt-out** | Ghana has no national do-not-disturb list. Senders must offer STOP and check their own suppression list before every send. | Every SMS ends with `STOP to 1234`-style text **if it fits**. If not, put it in the welcome SMS and the app. Suppression list checked before every send. |
| **Sending hours** | Promotional SMS only 08:00–19:00, Mon–Sat. Transactional and service messages are exempt. | Our alerts are **public safety, not promotional**. **Danger** alerts go any time. Watch alerts, air advisories and all clears wait for 08:00–19:00. |
| **Data controller registration** | Organisations processing Ghanaian personal data register with the Data Protection Commission | Not needed for the student prototype (team test numbers only). A real AMA deployment would need it. |
| **Who sees numbers** | — | Nobody in the app. Phone numbers live only in the subscriber store, encrypted, and are sent only to the SMS provider. Screens show counts ([data contract §6.4](data-contract.md#64-suggestion)). |

## 7. How it connects (for Alice)

```
Officer approves (POST /api/v1/suggestions/{id}/actions)
  → Lambda "send-alert"
      reads subscribers for the zone (minus the suppression list)
      reads the Arkesel API key from AWS Secrets Manager
      POST https://sms.arkesel.com/api/v2/sms/send   (batches)
  → Arkesel delivers to MTN / Telecel / AirtelTigo
  → Arkesel calls our delivery webhook (API Gateway → Lambda)
      updates delivered / failed / pending on the suggestion
```

- **Never send twice.** Use the suggestion ID as an idempotency key (a key that makes a repeated request do nothing), so that a Lambda retry doesn't double-send.
- **Keep the provider swappable.** Put the provider call behind one small `sendSms(numbers, text)` function, so moving to Hubtel only changes that one function.
- **Test numbers only** in the prototype (README, "Built vs simulated").

## 8. Still to check

| # | Question | How |
|---|---|---|
| 1 | Does Arkesel send Unicode (ɛ/ɔ) correctly, and how does it count parts? | Send a Twi test SMS with free credits |
| 2 | Arkesel's sender ID steps, fee and timeline | Read developers.arkesel.com / ask support |
| 3 | Hubtel API details (the developer portal blocked automated access) | Open it in a browser |
| 4 | mNotify/BMS current pricing (old pricing page is gone) | Check bms.africa manually |
| 5 | AWS Ghana SMS rate | AWS pricing CSV (only if we reconsider AWS) |
| 6 | Do public-safety alerts count as "transactional/service" for the sending-hours rule? | Ask the provider or the NCA |

## Sources

- [Arkesel SMS API](https://arkesel.com/developer-api/sms-api/) · [Arkesel pricing](https://arkesel.com/pricing/)
- [Hubtel SMS](https://hubtel.com/consumer/sms)
- [mNotify pricing](https://mnotifybms.com/pricing/) (now redirects to bms.africa)
- [AWS SMS supported countries](https://docs.aws.amazon.com/sms-voice/latest/userguide/phone-numbers-sms-by-country.html) · [AWS End User Messaging pricing](https://aws.amazon.com/end-user-messaging/pricing/)
- [Twilio Ghana SMS guidelines](https://www.twilio.com/en-us/guidelines/gh/sms) · [Twilio Ghana pricing](https://www.twilio.com/en-us/sms/pricing/gh)
- [Telerivet: Ghana SMS compliance, NCA sender ID and Act 843](https://www.telerivet.com/blog/ghana-sms-compliance-nca-sender-id-registration-and-act-843)
- [Arkesel: Is bulk SMS legal in Ghana?](https://arkesel.com/legal-and-regulatory-policies-of-bulk-sms-in-ghana/)
- [Sent.dm: Ghana SMS guidance](https://www.sent.dm/resources/sms-compliance/gh-sms-guidance) · [BulkGate: Ghana sender registration](https://help.bulkgate.com/docs/en/text-sender-registration-ghana.html)
