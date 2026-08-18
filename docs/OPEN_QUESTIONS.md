# OPEN_QUESTIONS — BRS v1.0 alignment (re-baselined against BA Decisions)

> **⚠️ Owner override (supersedes BA OQ-17 for this delivery):** the product owner directed to **keep the existing client-side app** (localStorage) and modify it in place to meet the BRS — **no new .NET backend** in this delivery. Consequently the BRS rules (uniqueness, expiry, scoping, code generation) are implemented **client-side**; true server-side enforcement is deferred. Recorded as a documented deviation.


> Re-baselined per `docs/BA_DECISIONS_PHASE2.md` (Approved to proceed to Phase 2)
> and `docs/RFI-001.md` (raised with client). Status key:
> ✅ **Resolved** (implement as written) · 🟡 **Provisional** (implement now behind a
> single seam + `// PROVISIONAL: RFI-001 / OQ-xx`, pending client confirmation) ·
> ⛔ **Blocked** (build the seam only, do not implement).

| ID | Status | Decision (authoritative) |
|---|---|---|
| **OQ-17** Architecture | ✅ Resolved | Build a real **.NET backend**; wire FE to it. Server-side authz + query-layer scoping; `HLR[YY][9]` concurrency-safe DB sequence; scheduled idempotent expiry job; append-only audit log; **server-side PDF** (QuestPDF); UTC persist / Riyadh render; API returns message **IDs** + lookup **codes**, FE resolves text. FE migrates off `localStorage` (prototype data, not migrated). |
| **OQ-19** Scope of change | ✅ Resolved (1 sub 🟡) | **Non-destructive update in place** — no table/column/data drops. 🟡 Out-of-BRS exam fields (`vitals` + general exams) removed from **form/payload/UC04-05 detail/UC07 PDF**, kept in schema for legacy; legacy values shown in a read-only "Legacy data" block on **UC05 only**. |
| **OQ-06** UC numbering | ✅ Resolved | UC01 List · UC02 Submit · UC03 Save Draft · UC04 Audit · UC05 View · UC06 Edit · UC07 Export. Fix cross-refs accordingly. |
| **OQ-08** Message IDs | ✅ Resolved | Catalogue §9 authoritative. `MSG001=MSG01`, `MSG002=MSG02`. Ignore the repeated `Notification's: MSG01` footer artifact. |
| **OQ-07** List sort | ✅ Resolved | **Descending** by last update date. |
| **OQ-10** UC04 post-condition | ✅ Resolved | Status = **Completed** + action-log entry written. |
| **OQ-13** Print vs Export | ✅ Resolved | Same action → UC07 server PDF; enabled only when status = **Completed**. |
| **OQ-14** Admin capability | ✅ Resolved | **Read-only** in this module (UC01/UC05, and UC07 via "all roles"). No admin write endpoints. |
| **OQ-15** State machine | ✅ Resolved | §3 state machine is complete/authoritative. |
| **OQ-16** Expired reports | ✅ Resolved | Viewable (UC05); not exportable / not editable / not auditable. |
| **OQ-05** Body Health type | ✅ Resolved | **Radio** (سليم/Passed, غير سليم/Failed), mandatory, editable. |
| **OQ-09** Uniqueness rule | ✅ Resolved (1 edge 🟡) | *No more than one **valid** or **in-progress** report per applicant, unless the existing is **Expired** or its result is **Not Fit**.* In-progress = Draft/Pending/Requires-Modification; Valid = Completed within 360d. Valid dup → **MSG06**; in-progress dup → **MSG07** (interpolate status). BR08: on create, set prior Not-Fit → Expired (same transaction). 🟡 Edge: unapproved Not-Fit (still Pending) — treat Not-Fit exemption as **approved-only** for now (`// PROVISIONAL: RFI-001 / OQ-09`). |
| **OQ-01** MEWA sharing | ⛔ Blocked (seam only) | Do **not** block UC04. Build `IExternalAuthorityReportSharing` port + **stub adapter** + **outbox** inside the approval transaction; approval Completes regardless; internal `SharingStatus` field. No endpoints/payload/auth invented. |
| **OQ-11 / OQ-12 / OQ-20** Registry | 🟡 Provisional | Inputs: ID Type, ID Number, DOB. Outputs: Full Name AR, Full Name EN, Nationality, Gender. Failure/not-found → **MSG04**. Editability: registry-returned fields read-only; non-returned editable; ID Type/Number/DOB never editable post-lookup. Behind `IApplicantRegistry` port + mock + deterministic fixtures. |
| **OQ-04** ID length/format | 🟡 Provisional | Citizen = 10 digits starting `1`; Resident = 10 digits starting `2`; GCC = up to 20 alphanumeric. Per-ID-type **validation strategy** from config (no inline regex). |
| **OQ-02** Nationality lookup | 🟡 Provisional | Served by Seha lookup `{code,nameAr,nameEn}`; seeded fallback; DDL **searchable**. Behind a lookup abstraction (no hard-coded component list). |
| **OQ-03** Vision level lookups | 🟡 Provisional | Same list for both uncorrected + corrected: `1..6, لا يوجد نظر/No Vision`. Two named refs → one dataset. |
| **OQ-18** Facility/City source | 🟡 Provisional | From authenticated user's session/MC context (read-only). Admin UC01 search/list from Seha lookup. Behind `ISehaOrganizationContext`. |
| **OQ-21** (engineering-raised: i18n default/switch) | ⛔ No BA decision yet | Content was not supplied to BA. Restated for separate answer: AR default (RTL) + user-toggle + persist. Do not implement dependents. |
