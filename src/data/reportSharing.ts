// مشاركة التقارير المعتمدة مع الجهات المختصة (وزارة البيئة والمياه والزراعة — MEWA).
// OQ-01: ⛔ محجوب — نبني المنفذ (Port) + مُهايئ وهمي (Stub) + صندوق صادر (Outbox) فقط.
// الاعتماد (UC04) يكتمل بغضّ النظر عن نتيجة المشاركة؛ لا نُخترع مسارات/تفويضًا حقيقيًا.
//
// عند توفر التكامل الحقيقي: استبدل StubSharingAdapter بمُهايئ ينفّذ نداء الـ API.

import type { Report, SharingStatus } from "@/data/reports";

export interface OutboxEntry {
  reportId: string;
  applicantId: string;
  result: Report["result"];
  enqueuedAt: string;
  status: SharingStatus;
}

const OUTBOX_KEY = "hms.sharing.outbox";

function readOutbox(): OutboxEntry[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeOutbox(entries: OutboxEntry[]) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
}

export function listOutbox(): OutboxEntry[] {
  return readOutbox();
}

/** منفذ المشاركة الخارجي (Port) — الواجهة التي سيُبنى عليها التكامل الحقيقي. */
export interface IExternalAuthorityReportSharing {
  share(report: Report): SharingStatus;
}

/**
 * مُهايئ وهمي: يسجّل نيّة المشاركة فقط ويعيد "pending".
 * لا يقوم بأي نداء شبكي (OQ-01 محجوب).
 */
const StubSharingAdapter: IExternalAuthorityReportSharing = {
  share(): SharingStatus {
    return "pending";
  },
};

/**
 * يُستدعى ضمن عملية الاعتماد: يضيف التقرير إلى صندوق الصادر ويعيد حالة المشاركة.
 * الاعتماد يكتمل مهما كانت النتيجة.
 */
export function enqueueApprovedReport(report: Report): SharingStatus {
  const status = StubSharingAdapter.share(report);
  const entry: OutboxEntry = {
    reportId: report.id,
    applicantId: report.applicant.nationalId,
    result: report.result,
    enqueuedAt: new Date().toISOString(),
    status,
  };
  const box = readOutbox().filter((e) => e.reportId !== report.id);
  box.push(entry);
  writeOutbox(box);
  return status;
}
