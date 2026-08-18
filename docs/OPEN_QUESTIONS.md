# OPEN_QUESTIONS — BRS v1.0 alignment

> Per Source-of-Truth rule 2: ambiguous/contradictory/missing items are recorded here
> with a **recommended resolution** and are **NOT implemented** until answered.
> OQ-01…OQ-16 are from BRS §12; OQ-17…OQ-21 were found during Phase 0/1.

Status key: 🔴 blocking implementation · 🟠 needs confirmation (low risk).

| ID | Question (summary) | Recommended resolution (for approval) | Status |
|---|---|---|---|
| OQ-01 | **MEWA integration undefined** — no endpoint/payload/trigger/retry/failure for sharing on approval. | Trigger on `Pending→Completed`; async outbox with retry; approval succeeds even if share pending; store share status + logs. Need the real API contract. | 🔴 |
| OQ-02 | **Nationality lookup empty.** | Retrieve from Seha/registry; until then use ISO-based seed list. Confirm source. | 🟠 |
| OQ-03 | **Two vision lookups, one defined** ("Levels of Eye vision" vs "…with correction"). | Assume both use the same 1–6/No-Vision list unless a separate list is provided. Confirm. | 🟠 |
| OQ-04 | **ID Number length/format per ID type.** | Citizen/Resident = 10 digits (KSA); GCC = up to 20 chars. Confirm exact rules + validation. | 🔴 |
| OQ-05 | **Body Health field Type missing.** | Assume Radio (Passed/Failed) like Mental Health. Confirm. | 🟠 |
| OQ-06 | **UC numbering inconsistent** (Submit=UC02 vs list points to "UC03: Submit"; UC00 placeholders). | Treat body numbering authoritative: UC01 List, UC02 Submit, UC03 Draft, UC04 Audit, UC05 View, UC06 Edit, UC07 Export. Confirm. | 🔴 |
| OQ-07 | **List sort direction** ("earliest to oldest" is contradictory). | Descending — most recently updated first. Confirm. | 🟠 |
| OQ-08 | **Message ID inconsistency** (MSG001 vs MSG01; stray `Notification's: MSG01`). | Catalogue §9 is authoritative (MSG00…MSG18 subset). Confirm. | 🟠 |
| OQ-09 | **BR truncated in UC02** ("…either … or"). | Interpret as Exceptions A (Not Fit) + B (Expired) per §4. Confirm full rule. | 🔴 |
| OQ-10 | **UC04 has no post-condition.** | Inferred: status = Completed. Confirm. | 🟠 |
| OQ-11 | **Registry validation source undefined** (UC02 step 3). | Need named system + endpoint + field mapping (input keys, returned fields). This is what MSG04 covers. | 🔴 |
| OQ-12 | **Editability "Y/N"** for Full Name AR/EN, Nationality, Gender. | Assume: not editable when returned by Registry; editable when Registry has no record. Confirm. | 🔴 |
| OQ-13 | **"Print" vs "Export"** (list Print vs UC05 Export→UC07). | Assume same action = PDF export (Completed only). Confirm whether a distinct "print" exists. | 🟠 |
| OQ-14 | **No use case for admin write actions.** | Assume System Admin is **read-only** in this module (view/search/export only). Confirm. | 🟠 |
| OQ-15 | **Process-flow diagram empty.** | Treat §3 state machine as complete. Confirm no missing transitions. | 🟠 |
| OQ-16 | **Expired viewable/exportable?** | Assume Expired remains **viewable**; export restricted to Completed (per UC07). Confirm. | 🟠 |
| OQ-17 | **Target tier for BRS compliance.** Current app is client-only (`localStorage`); BRS §11 demands **server-side** enforcement + query-layer scoping + concurrency-safe codes + background expiry job. Frontend mock cannot satisfy these. | Implement the enforced rules on the **.NET backend** and wire the frontend to it; keep localStorage only as a dev fallback. Confirm scope (backend in-scope for this alignment?). | 🔴 |
| OQ-18 | **Seha-sourced data** (Medical Facility, City, Region, Org Type, Medical Center list) has no integration. | Need the Seha lookup/profile API, or confirm mock values for now. | 🔴 |
| OQ-19 | **Non-BRS fields to remove.** Current module has `vitals` (height/weight/BP/pulse) and generic exams (hearing/cardio/respiratory/neuro/substance) that are **not** in the BRS. Rule 3 forbids deleting *unrelated* functionality, but these belong to *this* module and conflict with §6. | Recommend removing them (they are in-scope and conflicting). Confirm deletion is authorized. | 🔴 |
| OQ-20 | **Verification returned fields.** BRS Registry should return Full Name **AR + EN** and **Gender**; current mock returns only name/nationality/dob. | Align mock to return {idType?, fullNameAr, fullNameEn, nationality, gender, dob}; confirm the exact field set + which are locked (ties to OQ-11/OQ-12). | 🔴 |
| OQ-21 | **Language default & switching.** BRS mandates bilingual AR/EN but does not specify the language-switch mechanism or per-user default. | AR default (RTL); provide a UI language toggle; persist per user. Confirm. | 🟠 |
