# BA Decisions & Answers — Phase 2 Unblock
**Module:** Hunting License Medical Report Service (Seha)
**Governing document:** BRS v1.0 (author: Aram Alfuaim)
**Issued by:** Business Analysis
**Status:** Approved to proceed to Phase 2

---

## 0. HOW TO USE THIS DOCUMENT

1. Read every decision below. Each is tagged:
   - **[DECIDED]** — final. Implement as written.
   - **[PROVISIONAL]** — implement as written **now**, but the answer is pending formal client confirmation via RFI-001. Isolate the logic so it can be changed cheaply (config, constant, or single strategy class). Add a `// PROVISIONAL: RFI-001 / OQ-xx` comment at every implementation point.
   - **[BLOCKED]** — do **not** implement. Build the seam only.
2. Update `docs/OPEN_QUESTIONS.md`: mark each item Resolved / Provisional / Blocked and add the decision text.
3. Update `docs/GAP_ANALYSIS.md` verdicts affected by these decisions and re-baseline the counts.
4. Then proceed to Phase 2 in the required order: **UC01 → UC02 → UC03 → UC06 → UC04 → UC05 → UC07**, one commit per use case, each commit message referencing the BRS items satisfied.
5. The rules from the original brief still stand: the BRS overrides the codebase; do not invent requirements; anything newly ambiguous goes to `docs/OPEN_QUESTIONS.md` and stops there.

---

## 1. ARCHITECTURE DECISION (OQ-17) — **[DECIDED]**

**Decision: build a real .NET backend and wire the existing front-end to it.** The client-only / `localStorage` implementation is not an acceptable end state. BRS §11 requirements are enforced server-side.

Required backend characteristics:

| Concern | Requirement |
|---|---|
| Authorization | Permission keys (`Create Medical report`, `Create\Edit Medical report`, `Audit Medical report`, `View Medical report`, `Export Medical report`) enforced at the API layer. Hiding UI elements is **not** enforcement. |
| Data scoping | MC scoping, admin scoping and Draft visibility applied at the **query layer** (a global filter / specification), never in the controller or client. A Data Entry user must not be able to retrieve another MC's report by ID. |
| Report code | `HLR[YY][9-digit zero-padded sequence]`. Concurrency-safe: use a database sequence or a dedicated counter row with a locked read-modify-write inside the creation transaction. Never generate client-side. Sequence is system-level and never reset. Uniqueness enforced by a DB unique index as a second line of defence. |
| Expiry | A scheduled background job (hosted service / scheduler) evaluating Draft (90d from **first** save-as-draft), Requires Modification (90d from return date), Completed (360d from approval). Must be **idempotent** and must write an audit trail entry per transition. Status is a stored, filterable column — not computed at render time. |
| Audit log | Append-only table. No update or delete paths. Written inside the same transaction as the action it records. |
| PDF export | Generated **server-side** (e.g. QuestPDF) so the output is identical regardless of client, and so both logos and the footer block are guaranteed. |
| Dates | All Gregorian. Persist in UTC, render in Asia/Riyadh. |
| i18n | Bilingual AR/EN. The API returns message **IDs** and lookup **codes**; the front-end resolves display text. Do not return localized strings from the API. |

**Front-end:** migrate from `localStorage` to the API. Keep a thin client-side service layer so components are not coupled to transport.

**Migration:** existing `localStorage` records are prototype data, not production data. Do not build a migration path for them; seed the new backend instead.

---

## 2. SCOPE OF CHANGE (OQ-19) — **[DECIDED, one sub-item PROVISIONAL]**

**Decision: non-destructive update in place.** Update the existing implementation to conform to the BRS. Do **not** rewrite the module from scratch, and do **not** drop data or schema.

- No table drops, no column drops, no data deletion.
- Existing records remain readable.
- Out-of-BRS examination fields (vitals and the general examinations) are **[PROVISIONAL — confirm with BA]** removed from the hunting-license report **form**, from the submit/update **payload**, from UC04/UC05 **detail views**, and from the UC07 **PDF**, while remaining in the schema and in the codebase for legacy records. Rationale: the UC07 export layout is fixed by the BRS and admits no additional fields, and the BRS examination set is explicit and closed (visual acuity, colorblindness, eligibility, blood type, final result).
- If a legacy record contains values in those fields, they may be surfaced in a clearly separated read-only "Legacy data" block on UC05 only.

---

## 3. RESOLVED BY BA AUTHORITY — **[DECIDED]**

### OQ-06 — Use case numbering
The authoritative map is the document body headings and the table of contents. All `UC00` placeholders and all conflicting cross-references are transcription errors.

| UC | Title |
|---|---|
| UC01 | Medical Reports List (Main Page) |
| UC02 | Submit Medical Report |
| UC03 | Save Medical Report as Draft |
| UC04 | Audit (Approve) Medical Report |
| UC05 | View Medical Report |
| UC06 | Edit Medical Report |
| UC07 | Export Medical Report |

Corrections to apply: "Create New Report" button → **UC02**. "Save as draft" reference in the UC02 form → **UC03**. UC06 "Medical Report Form — refer to" → **UC02**. List "View" → **UC05**. List "Audit" → **UC04**. List "Print" → **UC07**.

### OQ-08 — Message IDs
The catalogue in §9 of the brief is authoritative. `MSG001` = `MSG01`, `MSG002` = `MSG02`. The `Notification's: MSG01` row repeated at the foot of every use case is a template artifact — ignore it; it does not mean MSG01 fires in that use case.

### OQ-07 — List sort
**Descending by last update date** (most recently updated first). The BRS wording is self-contradictory; descending is the standard and the only reading consistent with a working queue.

### OQ-10 — UC04 post-condition
`Medical report status = Completed` and the action log entry is written. Confirmed.

### OQ-13 — "Print" vs "Export"
The same action. Both invoke UC07 (server-generated PDF). Consequently the list `طباعة / Print` button is enabled **only** when status = `Completed`, matching the UC07 pre-condition.

### OQ-14 — System Admin capability
**Read-only in this module.** Admin appears as an actor on UC01 and UC05 only, and on UC07 through the "all roles" clause. Admin has **no** create, edit, submit, audit, approve or return capability. Do not add admin write endpoints.

### OQ-15 — State machine
The state machine in §3 of the brief is complete and authoritative. The empty "Service Process Flow" section in the BRS carries no additional requirements.

### OQ-16 — Expired reports
Remain **viewable** (UC05) by any role within their scope. **Not exportable** — UC07 restricts export to `Completed`. Not editable — UC06 restricts editing to `Draft` and `Requires Modification`. Not auditable — UC04 restricts to `Pending for Auditing`.

### OQ-05 — `سلامة الجسم / Body Health` field type
**Radio Button**, values `سليم / Passed` and `غير سليم / Failed`, mandatory, editable — identical to `سلامة العقل / Mental Health`. The BRS omitted the Type cell; symmetry within the Eligibility Test section is unambiguous.

### OQ-09 — Applicant uniqueness rule
Consolidated reading of BR01 + BR02 + BR03:

> An applicant shall not have more than one medical report that is **valid** or **in progress**, unless the existing report is **Expired** or its result is **Not Fit**.

Definitions to implement:
- **In progress** = `Draft`, `Pending for Auditing`, `Requires Modification`.
- **Valid** = `Completed` and within 360 days of approval.
- Blocking a submit because a **valid** report exists → **MSG06**.
- Blocking a submit because an **in-progress** report exists → **MSG07**, interpolating the actual status.

One edge case is **not** covered by the BRS and is raised in RFI-001 (see §5, RFI item 6): an existing report with a `Not Fit` result that is still `Pending for Auditing`. Until answered, treat the Not-Fit exemption as applying **only** to reports whose Not-Fit result has been approved (status `Completed` or `Expired`), i.e. an unapproved Not-Fit report still blocks. Tag this `// PROVISIONAL: RFI-001 / OQ-09`.

Related: BR08 (on creating a new report, set the existing Not-Fit report to `Expired`) applies at creation time, inside the same transaction.

---

## 4. PROVISIONAL — IMPLEMENT NOW, CONFIRM VIA RFI-001

### OQ-01 — MEWA sharing — **[BLOCKED as to contract, NOT a Phase 2 blocker]**
Do **not** block UC04 on this. Build the seam:
- Define an outbound port, e.g. `IExternalAuthorityReportSharing`, with a single method taking the approved report.
- Implement it with a **stub adapter** that logs and marks the share as `Pending dispatch`.
- Persist the intent using the **outbox pattern** inside the approval transaction, so nothing is lost when the real contract arrives.
- **Approval must succeed even if sharing fails.** The report reaches `Completed` regardless; dispatch is asynchronous with retry.
- Add a `SharingStatus` field (`Not applicable`, `Pending dispatch`, `Sent`, `Failed`) — internal only, not shown in the UI until the client defines the requirement.
- Do not invent endpoints, payload fields, authentication or retry limits.

### OQ-11 / OQ-12 / OQ-20 — Registry integration — **[PROVISIONAL]**
Assumed contract until confirmed:
- **Inputs:** ID Type, ID Number, Date of Birth (Gregorian).
- **Outputs:** Full Name Arabic, Full Name English, Nationality, Gender.
- **Failure or not found** → `MSG04`.

Editability rule resolving OQ-12 (`Y/N` in the BRS):
- Any field **returned** by the registry is displayed **read-only**.
- If the registry does not return a field, or the applicant is not found and manual entry is permitted, the field is **editable**.
- ID Type, ID Number and Date of Birth are always **not editable** after the registry lookup step.

Implement behind an `IApplicantRegistry` port with a mock adapter and a deterministic test fixture set. Do not hard-code any assumed vendor endpoint.

### OQ-04 — ID number length and format — **[PROVISIONAL]**
| ID Type | Assumed rule |
|---|---|
| مواطن / Citizen | Exactly 10 digits, first digit `1` |
| مقيم / Resident | Exactly 10 digits, first digit `2` |
| مواطن خليجي / GCC | Up to 20 characters, alphanumeric |

Implement as a **per-ID-type validation strategy** driven by configuration, not as inline regex scattered across the form. The search field and list column already carry a length of 20 per the BRS.

### OQ-02 — Nationality lookup — **[PROVISIONAL]**
The BRS table is empty. Assume the list is served by the Seha lookup service (`GET` nationality lookup) returning `{ code, nameAr, nameEn }`. Implement against a lookup abstraction with a seeded fallback list so the DDL is functional; the DDL must be **searchable** per the BRS. Do not hard-code a nationality list in a component.

### OQ-03 — Vision level lookups — **[PROVISIONAL]**
Assume **the same list** serves both "Levels of Eye vision" and "Levels of Eye vision with correction": `1, 2, 3, 4, 5, 6, لا يوجد نظر / No Vision`. Model them as two named lookup references pointing at one dataset, so they can be split later without touching the form.

### OQ-18 — Medical facility / city source — **[PROVISIONAL]**
`Medical Facility Name` and `City` on the report form are derived from the **authenticated user's session context** (the medical center the user belongs to), not entered or selected. Read-only in all use cases. On UC01 they are search/list fields visible to Admin only, populated from the Seha lookup service. Implement behind an `ISehaOrganizationContext` abstraction.

---

## 5. RFI-001 — RAISED WITH THE CLIENT

The following are pending formal answers. See `RFI-001` for the issued text. Items 1–8 map to OQ-01, OQ-02, OQ-03, OQ-04, OQ-09, OQ-11/12/20, OQ-18, and the OQ-09 edge case. Do not treat the provisional answers above as final, and do not implement anything for OQ-01 beyond the seam.

---

## 6. ITEM NOT COVERED

`OQ-21` was raised by the engineering side but its content was not supplied to Business Analysis. It has **no decision** in this document. Restate it in `docs/OPEN_QUESTIONS.md` and it will be answered separately. Do not implement anything that depends on it.

---

## 7. DEFINITION OF DONE FOR PHASE 2 (unchanged, plus)

- [ ] Every `[PROVISIONAL]` decision is isolated behind configuration or a single strategy/adapter class and carries a `// PROVISIONAL: RFI-001 / OQ-xx` comment.
- [ ] No authorization or scoping rule exists only on the client.
- [ ] Report code generation has a concurrency test proving no duplicates under parallel creation.
- [ ] The expiry job has tests for all three validity periods, including the rule that re-saving a draft does **not** reset the 90 days.
- [ ] `docs/OPEN_QUESTIONS.md` and `docs/GAP_ANALYSIS.md` are re-baselined against this document before the first Phase 2 commit.
