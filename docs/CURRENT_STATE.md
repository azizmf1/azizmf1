# CURRENT_STATE — Hunting License Medical Report module (as-built)

> Phase 0 discovery. Describes what exists **today** for this module, before any
> BRS-alignment change. Branch: `claude/hunting-medical-standalone`.

## 1. Architecture & stack

| Layer | Tech | Notes |
| --- | --- | --- |
| Frontend | React 19 + TypeScript, TanStack Router (file-based), Tailwind v4, Vite | SPA; **client-only** — data in `localStorage` (mock) |
| Backend | ASP.NET Core .NET 10 + EF Core + PostgreSQL (`backend/`) | Exists but **NOT wired** to the frontend; mirrors the same domain |
| i18n | **None** | UI strings are hard-coded **Arabic only**; no EN, no i18n layer |
| Auth | Mock login + OTP (`1234`); JWT on backend | Client stores session in `localStorage` |

## 2. Routes (frontend)

```
/login, /otp                         auth
/hunting-medical                     UC01-ish list (index.tsx)
/hunting-medical/new                 create — starts with a verification step
/hunting-medical/$id                 view (UC05-ish)
/hunting-medical/$id/edit            edit (UC06-ish)
/hunting-medical/$id/audit           audit (UC04-ish)
/hunting-medical/$id/print           A4 print (UC07-ish, generic)
```
Post-login lands directly on the list (Seha dashboard/catalog were removed in the standalone).

## 3. Domain model (`src/data/reports.ts`)

`Report`: `id` (code), `status`, `applicant`, `licenseType` (kept in model, **removed from UI**),
`vitals`, `exams[]`, `result`, `recommendation`, `auditNote`, `doctor`, `auditor?`,
`createdAt/updatedAt/submittedAt?/decidedAt?`, `timeline[]`.

- **Applicant:** `name, nationalId, dob, gender, nationality, phone, city, bloodType`.
  (Single `name`; **no** Full Name AR / Full Name EN split; **no** ID Type; **no** medical facility.)
- **Vitals:** `height, weight, bloodPressure, pulse` — **not in BRS at all**.
- **Exams:** generic `EXAM_ITEMS` = vision, hearing, motor, cardio, respiratory, neuro, psych, substance,
  each `passed|failed`. **Does not match** the BRS visual-acuity / eligibility / blood structure.
- **result:** `"fit" | "unfit" | null`; `recommendation` free text.
- **timeline[]:** `{ at, actorId, actorName, action, note? }` — partial action log.

## 4. Statuses (`src/data/lookups.ts`)

| Current code | AR label | Nearest BRS status |
| --- | --- | --- |
| `draft` | مسودة | Draft ✓ |
| `submitted` | بانتظار التدقيق | Pending for Auditing ✓ |
| `under_review` | قيد التدقيق | **(extra — not in BRS)** |
| `approved` | معتمد | Completed (label differs) |
| `returned` | مُعاد للتعديل | Requires Modification (label differs) |
| — | — | **Expired (MISSING)** |

No validity periods / expiry job. No EN labels.

## 5. Report code (`nextId` in `reports.ts`)

Format: `HM-2026-XXXX` (4-digit sequence, hard-coded year `2026`).
**Conflicts** with BRS `HLR[YY][9-digit]`. Not concurrency-safe (localStorage).

## 6. Roles & permissions (`src/data/users.ts`, `src/lib/permissions.ts`, `shared/permissions.json`)

| Current role | BRS role |
| --- | --- |
| `doctor` (طبيب فحص) | Data Entry |
| `auditor` (مدقّق طبي) | Data Auditor |
| `admin` (مدير النظام) | System Admin |

Actions: `report:list/view/create/edit/submit/delete/audit`.
**No** BRS permission keys (`Create Medical report`, `Create\Edit`, `Audit`, `View`, `Export`).
Permission checks are **client-side only** (UI hiding); backend has role checks but is not wired.
**No** medical-center (MC) data scoping; **no** draft-visibility scoping.

## 7. Messages (`src/data/messages.ts`)

Keys `MSG00..MSG18` exist but the **text and semantics differ** from the BRS catalogue
(Section 9). Arabic only. No `MSG10/11/15/16/17/18` with BRS wording; no status interpolation.

## 8. Applicant verification (`src/data/patientVerification.ts`, `ApplicantVerification.tsx`)

A separate step: **ID Number + Date of Birth** → mock verify → returns `name, nationality, dob`
(locked afterwards). Labelled "الأحوال المدنية / الهوية الوطنية".
Gap vs BRS: BRS "Registry" is undefined (OQ-11); BRS expects Full Name AR/EN + Gender too;
editability condition (OQ-12) not modelled; failure message is not BRS `MSG04`.

## 9. Print/export (`$id.print.tsx`)

Generic A4 HTML print via `window.print()`. **No** Seha logo, **no** MEWA logo, **no** PDF export,
**no** validity banner, **no** required footer block (contact/twitter/email/website).

## 10. Not present at all (module-level)

- Bilingual (EN) UI / i18n · Expired status + expiry job · Validity periods (90/90/360) ·
  BR-UNIQUE-REPORT (+ Not-Fit / Expired exceptions) · BR-EXPIRE-NOTFIT ·
  MC / admin / draft data scoping · MEWA sharing on approval · ID Types lookup ·
  Vision level / vision-with-correction / colorblindness fields · Mental/Body health fields ·
  Action-log record with `User's ID / Organization name` · PDF export · Registry integration spec.
