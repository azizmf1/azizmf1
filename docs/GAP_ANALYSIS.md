# GAP_ANALYSIS — Codebase vs BRS v1.0 (Hunting License Medical Report Service)

> Phase 1. One row per atomic requirement. **No code changed.** Verdict ∈
> {Missing, Partial, Conflicting, Compliant}. Files are the *likely* touch points.
> Blocked items reference `docs/OPEN_QUESTIONS.md`.

Legend for "Files": FE = frontend `src/…`, BE = `backend/…`.

---

## A. Statuses & lifecycle (BRS §3)

| BRS Ref | Requirement | Current | Verdict | Proposed change | Files | Risk |
|---|---|---|---|---|---|---|
| §3 S1 | Status **Draft / مسودة** | `draft / مسودة` | Compliant | keep; add EN label | FE lookups | Low |
| §3 S2 | **Pending for Auditing / بانتظار التدقيق** | `submitted / بانتظار التدقيق` | Partial | rename key→`pending_audit`; add EN | FE lookups, reports, all screens | Med |
| §3 S3 | **Completed / مكتمل** | `approved / معتمد` | Conflicting | rename key + label→مكتمل/Completed | FE + BE enum | Med |
| §3 S4 | **Requires Modification / معاد إلى المدخل** | `returned / مُعاد للتعديل` | Conflicting | rename key + label + EN | FE + BE enum | Med |
| §3 S5 | **Expired / منتهي** | none | Missing | add status + EN/AR | FE lookups, reports; BE enum | Med |
| §3 | Remove non-BRS status | `under_review / قيد التدقيق` exists | Conflicting | remove `under_review` and all uses | FE list/audit/perms; BE | Med |
| §3 T1 | new→Draft (UC03) | draft on save | Partial | keep; align to UC03 flow | FE new | Low |
| §3 T2 | new→Pending (UC02) | submit sets `submitted` | Partial | rename target status | FE new/form | Low |
| §3 T3 | Draft→Pending (UC06) | supported | Partial | rename target | FE edit/form | Low |
| §3 T4 | Requires Modification→Pending (UC06) | `returned`→submit | Partial | rename statuses | FE edit/form | Low |
| §3 T5 | Pending→Completed (UC04 approve) | approve→`approved` | Partial | rename statuses | FE audit; BE workflow | Low |
| §3 T6 | Pending→Requires Modification (UC04 return, mandatory note) | return→`returned`, note required | Partial | rename; keep mandatory note | FE audit; BE | Low |
| §3 T7 | Draft/Req-Mod/Completed → **Expired** (auto) | none | Missing | expiry evaluator | BE job/service; FE read | **High** |
| §4 V1 | Draft expires **90 days from first** save-as-draft (no reset on re-save) | none | Missing | store `draftStartedAt`; evaluate | BE + model | High |
| §4 V2 | Requires Modification expires **90 days from return date** | none | Missing | store `returnedAt`; evaluate | BE + model | High |
| §4 V3 | Completed expires **360 days from approval** | none | Missing | evaluate from `decidedAt` | BE + model | High |
| §4 V4 | Pending has **no** validity | n/a | Compliant (by absence) | none | — | Low |
| §3 | Expiry is a **stored, filterable** attribute via scheduled job (not display-only) | none | Missing | idempotent background job | BE job | High |

---

## B. Cross-cutting business rules (BRS §4)

| BRS Ref | Requirement | Current | Verdict | Proposed change | Files | Risk |
|---|---|---|---|---|---|---|
| BR-UNIQUE-REPORT | ≤1 valid/in-progress report per applicant | none | Missing | uniqueness check on create/submit | BE query; FE MSG06/07 | High |
| …Exception A | allowed if existing is **Not Fit** | none | Missing | include in check | BE | Med |
| …Exception B | allowed if existing is **Expired** | none | Missing | include in check | BE | Med · **OQ-09** |
| BR-CODE-UNIQUE | report code unique system-wide | localStorage max+1 | Partial | DB unique + sequence | BE | Med |
| BR-CODE-FORMAT | `HLR[YY][9-digit,zero-pad,never reset]` e.g. `HLR26000000043` | `HM-2026-XXXX` | Conflicting | replace generator | FE reports.nextId; BE | Med |
| BR-EXPIRE-NOTFIT | new report ⇒ prior **Not Fit** report → Expired | none | Missing | on create, expire prior Not-Fit | BE | Med |
| BR-SCOPE-MC | MC users see only own medical center's reports | none (no MC concept) | Missing | add MC to model + query scoping | BE + model + FE | High |
| BR-SCOPE-ADMIN | Admin sees all | admin sees all (single store) | Partial | enforce at query layer | BE | Low |
| BR-SCOPE-DRAFT | Drafts visible only to Data Entry in same MC | none | Missing | query scoping | BE | High |
| BR-ACTION-LOG | every action logs user+timestamp+notes under action type | `timeline[]` (partial) | Partial | add Action Type lookup, User ID, Org | FE + BE model | Med |
| BR-EXPORT-PDF | export is PDF only | HTML `window.print()` | Conflicting | real PDF export | FE print/export | Med · **OQ-13** |
| BR-DRAFT-NO-VALIDATION | draft/save-for-later skips required-field validation | draft validation is lighter but still partial | Partial | fully skip on draft path | FE form | Low |

---

## C. Use cases (BRS §5)

| BRS Ref | Requirement | Current | Verdict | Proposed change | Files | Risk |
|---|---|---|---|---|---|---|
| UC01 | List main page for 3 roles | list exists | Partial | align columns/search/scoping | FE index | Med |
| UC01 EXC01 | no reports → **MSG01** | empty text (non-catalogue) | Partial | wire MSG01 | FE index, messages | Low |
| UC01 EXC02 | no search results → **MSG02** | generic empty text | Partial | wire MSG02 | FE index | Low |
| UC01 search | 12 search fields (AR/EN, types, City hidden for MC, Medical Center admin-only, future dates blocked) | search=name/id/code + status + license filter | Partial | rebuild search panel per spec | FE index | Med |
| UC01 columns | code, ID, name, City(admin), MC(admin), result, status, date approved, View/Audit(auditor)/Print | most present; **no City/MC columns**, license column removed | Partial | add columns + role gating | FE index | Med |
| UC01 sort | by last update date | sorted by `updatedAt` desc | Partial | confirm direction | FE index | Low · **OQ-07** |
| UC02 | Submit flow (validate vs Registry → form → submit → confirm → MSG00 → Pending) | create+verify+submit exists | Partial | align to exact flow/messages | FE new/form | Med |
| UC02 EXC01 | cancel → **MSG03** → return no save | cancel button, no MSG03 | Partial | wire MSG03 dialog | FE form | Low |
| UC02 EXC02 | valid report exists → **MSG06** | none | Missing | uniqueness check | BE+FE | High |
| UC02 EXC03 | in-progress report exists → **MSG07** (interpolate status) | none | Missing | check + interpolate | BE+FE | High |
| UC02 EXC04 | missing required → **MSG05** | validation present, non-catalogue msg | Partial | wire MSG05 | FE form | Low |
| UC02 EXC06 | save as draft → UC03 | draft path exists | Partial | align | FE form | Low |
| UC02 | Registry lookup failure → **MSG04** | verify returns error (non-catalogue) | Partial | wire MSG04 | FE verify | Low · **OQ-11** |
| UC02 confirm | Fit→**MSG15**, Not Fit→**MSG16**, optional notes | generic confirm modal | Partial | wire MSG15/16 + notes | FE form | Low |
| UC03 | Save as draft (MSG10 confirm + optional note → MSG00 → Draft) | draft save exists, non-catalogue | Partial | wire MSG10/MSG00 + note→log | FE form | Low |
| UC03 | Draft 90-day validity (not reset) | none | Missing | see §A V1 | BE | High |
| UC04 | Approve (open→details read-only→approve→MSG17/18→confirm→MSG00→Completed) | audit approve exists | Partial | read-only details + MSG17/18 | FE audit | Med |
| UC04 EXC01 | Return w/ **mandatory** justification (**MSG11**) → Requires Modification | return w/ mandatory note (non-catalogue msg) | Partial | wire MSG11 | FE audit | Low |
| UC04 EXC02 | back to main → MSG03 | plain nav | Partial | wire MSG03 | FE audit | Low |
| UC04 | on approval → **share with MEWA** | none | Missing | **blocked** | — | High · **OQ-01** |
| UC04 | page shows all fields read-only + History Logs | audit shows summary + note, **no History Logs** | Partial | full read-only + logs | FE audit | Med |
| UC05 | View details for 3 roles | view exists | Partial | align | FE $id | Low |
| UC05 | Validity banner **only for Completed** (exact AR/EN text) | none | Missing | add banner w/ exact text | FE $id | Low |
| UC05 | Admin-only block (Org Name/Type, Region, City) | none | Missing | add admin block | FE $id | Med · **OQ-14** |
| UC05 | History Logs section | none | Missing | add logs table | FE $id | Med |
| UC06 | Edit (Draft/Requires Modification) → submit → MSG15/16 → Pending | edit exists | Partial | align statuses/messages | FE edit/form | Med |
| UC06 ALT01 | save for later (MSG10) w/o required fields | partial | Partial | align | FE form | Low |
| UC06 EXC01/02 | MSG03 / MSG05 | partial | Partial | wire messages | FE form | Low |
| UC07 | Export PDF, Completed only, all roles, `Export` permission | HTML print, any status | Conflicting | PDF + status/permission gate | FE export | Med |
| UC07 layout | Seha+MEWA logos, title, code, validity, Org/City, applicant PII, exams/eligibility/blood/result, footer block | generic A4, no logos/footer | Missing | rebuild PDF layout | FE export, assets | Med |

---

## D. Medical report form fields (BRS §6)

| BRS Ref (field) | Requirement | Current | Verdict | Proposed change | Files | Risk |
|---|---|---|---|---|---|---|
| §6 Medical Facility Name | View, from Seha | none | Missing | add read-only field | FE form + model | Med |
| §6 City | View, from Seha | applicant.city (editable DDL) | Partial | make read-only from Seha | FE form | Low |
| §6 ID Type | DDL, M, not editable (Citizen/Resident/GCC) | none | Missing | add ID Types lookup + field | FE form, lookups | Med |
| §6 ID Number | Number, M, not editable | present (10-digit) | Partial | length per ID type | FE form | Med · **OQ-04** |
| §6 Date of Birth | Date, M, not editable, Gregorian | present | Partial | lock (verified) | FE form | Low |
| §6 Full Name **Arabic** | Text, M, from Registry | single `name` (no AR/EN split) | Conflicting | split name AR/EN | FE model+form | Med |
| §6 Full Name **English** | Text, M, from Registry | none | Missing | add EN name | FE model+form | Med |
| §6 Nationality | DDL, M, from Registry | present | Partial | lookup values | FE form | Low · **OQ-02** |
| §6 Gender | DDL, M (ذكر/أنثى) | present | Partial | from Registry (editability) | FE form | Low · **OQ-12** |
| §6 Phone Number | Number, M, starts with 5, 9 digits, +966 | 05XXXXXXXX (10) | Partial | +966 + 9-digit rule | FE form | Low |
| §6 Vision - Right Eye | Radio, M, Passed/Failed | none (generic `vision`) | Missing | add field | FE form, exams model | Med |
| §6 Vision - Left Eye | Radio, M, Passed/Failed | none | Missing | add field | FE form | Med |
| §6 Level of Right eye vision | DDL, M (Levels of Eye vision) | none | Missing | add lookup+field | FE form, lookups | Med |
| §6 Level of Left eye vision | DDL, M | none | Missing | add field | FE form | Med |
| §6 Right eye vision **with correction** | DDL, M | none | Missing | add lookup+field | FE form | Med · **OQ-03** |
| §6 Left eye vision with correction | DDL, M | none | Missing | add field | FE form | Med · **OQ-03** |
| §6 Colorblindness | Radio, M, Passed/Failed | none | Missing | add field | FE form | Med |
| §6 Mental Health | Radio, M, Passed/Failed | none (generic `psych`) | Missing | add field | FE form | Med |
| §6 Body Health | Radio(?), M, Passed/Failed | none (generic `motor`) | Missing | add field | FE form | Med · **OQ-05** |
| §6 Blood Type | DDL, M (8 values) | `bloodType` chips (8 values) | Partial | move into form spec | FE form | Low |
| §6 Final Result | Radio, M, Fit/Not Fit (لائق/غير لائق) | `result` fit/unfit | Partial | align labels | FE form | Low |
| §6 Not-fit justification | Textbox, appears+mandatory only when Not Fit | `recommendation` free text (always) | Partial | conditional+mandatory | FE form | Low |
| §6 | Remove non-BRS fields (vitals height/weight/BP/pulse; generic exams hearing/cardio/respiratory/neuro/substance) | present | Conflicting | remove from module | FE model+form+view+print | Med |
| §6 actions | Submit / Save as draft / Return to main | present (similar) | Partial | align labels bilingual | FE form | Low |

---

## E. History Logs & Action Log (BRS §7–8)

| BRS Ref | Requirement | Current | Verdict | Proposed change | Files | Risk |
|---|---|---|---|---|---|---|
| §7 | History Logs table: Action Type, User's Name, Date & Time, Notes | `timeline[]` has actorName/at/action/note | Partial | add Action Type lookup; render table in UC04/05/06 | FE + model | Med |
| §8 | Action Log record: Action Type, Notes, User's Name, **User's ID**, **Organization name**, Date&Time | timeline lacks User ID + Org + typed Action | Partial | extend record; append-only | FE + BE model | Med |
| §8 | Action Types lookup (Save Draft/Submit/Edit/Approve/Return) | free-text `action` strings | Partial | typed lookup | FE lookups | Low |
| §11 | Action log **append-only** (never update/delete) | array push (ok) but no guarantee | Partial | enforce (DB) | BE | Med |

---

## F. Message catalogue (BRS §9) — 14 messages

| BRS Ref | Requirement (ID + bilingual) | Current | Verdict | Proposed change | Files | Risk |
|---|---|---|---|---|---|---|
| MSG00 | Success (تمت العملية بنجاح! / Successfully Done!) | MSG00 differs | Conflicting | replace text; bilingual | FE messages | Low |
| MSG01 | No reports | non-matching | Conflicting | replace | FE messages | Low |
| MSG02 | No search results | non-matching | Conflicting | replace | FE messages | Low |
| MSG03 | Cancel confirm | none | Missing | add | FE messages | Low |
| MSG04 | Registry retrieval error | non-matching | Conflicting | replace | FE messages | Low |
| MSG05 | Required fields | non-matching | Conflicting | replace | FE messages | Low |
| MSG06 | Valid report exists | none | Missing | add | FE messages | Low |
| MSG07 | In-progress exists (interpolate status) | none | Missing | add + interpolation | FE messages | Low |
| MSG10 | Save for later confirm | none | Missing | add | FE messages | Low |
| MSG11 | Return needs notes | none | Missing | add | FE messages | Low |
| MSG15 | Submit Fit confirm | none | Missing | add | FE messages | Low |
| MSG16 | Submit Not-Fit confirm | none | Missing | add | FE messages | Low |
| MSG17 | Approve Fit (+ share w/ concerned) | none | Missing | add | FE messages | Low |
| MSG18 | Approve Not-Fit (+ share) | none | Missing | add | FE messages | Low |
| §9 | Bilingual keyed resource, no hard-coded strings | AR only, hard-coded across components | Conflicting | i18n layer, all strings by ID | FE global | **High** |

---

## G. Lookups (BRS §10)

| BRS Ref | Requirement | Current | Verdict | Proposed change | Files | Risk |
|---|---|---|---|---|---|---|
| ID Types | Citizen/Resident/GCC | none | Missing | add lookup | FE lookups | Low |
| Statuses | 5 values | 5 with 1 extra + label diffs | Partial | align (§A) | FE lookups | Med |
| Action Types | 5 values | none (free text) | Missing | add lookup | FE lookups | Low |
| Blood Type | 8 values | 8 present | Compliant | add EN | FE lookups | Low |
| Vision (levels) | 1–6, No Vision | none | Missing | add lookup | FE lookups | Low · **OQ-03** |
| Nationality | empty in BRS | present list | Partial | source of truth? | FE lookups | Low · **OQ-02** |
| City/Region/MC/Org Type | from Seha | static CITIES only | Missing | integration/lookup | FE + BE | Med |

---

## H. Non-functional (BRS §11)

| BRS Ref | Requirement | Current | Verdict | Proposed change | Files | Risk |
|---|---|---|---|---|---|---|
| §11 | Full bilingual AR(RTL)/EN(LTR) via i18n | AR only | Conflicting | i18n | FE global | High |
| §11 | Permissions enforced **server-side** + query-layer scoping | client-only; BE not wired | Conflicting | wire BE + scoping | FE+BE | High |
| §11 | Report code concurrency-safe | localStorage | Conflicting | DB sequence | BE | Med |
| §11 | Expiry job idempotent + auditable | none | Missing | job | BE | High |
| §11 | All dates Gregorian | Gregorian | Compliant | — | — | Low |
| §11 | Action log append-only | array push | Partial | enforce | BE | Med |

---

## Section: Breaking changes

1. **Status enum values change** (`submitted→pending_audit`, `approved→completed`,
   `returned→requires_modification`, drop `under_review`, add `expired`) — migrates stored
   reports (localStorage seed + BE enum/DB). Affects filters, badges, permissions, timeline.
2. **Report code format** `HM-2026-XXXX` → `HLR[YY][9]` — existing codes invalidated;
   any references/links to old codes break.
3. **Applicant model change**: single `name` → `fullNameAr` + `fullNameEn`; add `idType`,
   `medicalFacility`; **remove** `vitals` and generic exam keys — destructive to seed/BE schema.
4. **Exams restructure** to BRS visual-acuity/eligibility/blood/result — replaces `exams[]` shape.
5. **Message catalogue** text/semantics replaced — any test asserting old text breaks.
6. **Permission keys** replaced with BRS keys — RBAC matrix + backend policies change.
7. Introducing **MC scoping** changes list/query results for existing users.

## Section: Open questions

All ambiguities are tracked in [`docs/OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) — OQ-01…OQ-16
from BRS §12 plus newly-found items **OQ-17…OQ-20**. Items above tagged **OQ-xx** are
**blocked** and must not be implemented until answered (per Source-of-Truth rule 2).

## Summary counts (indicative)

- Missing: ~40 · Conflicting: ~14 · Partial: ~30 · Compliant: ~6.
- Highest-risk clusters: expiry engine + validity periods, uniqueness rule, MC/data scoping,
  server-side enforcement, i18n, MEWA integration (blocked).
