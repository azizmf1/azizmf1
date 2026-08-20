// نموذج التقرير الطبي + تخزين mock في localStorage.
// البذرة تُحقن عند أول تشغيل، ثم كل عمليات CRUD تذهب إلى localStorage.

import type { ReportStatus } from "@/data/lookups";

export type Result = "fit" | "unfit" | null;
export type ExamValue = "passed" | "failed";
export type PassFail = "passed" | "failed";
export type IdType = "citizen" | "resident" | "gcc" | "";
// حالة مشاركة التقرير مع الجهات المختصة (MEWA) — OQ-01 (بوابة داخلية فقط)
export type SharingStatus = "not_shared" | "pending" | "shared" | "failed";

export interface Applicant {
  name: string; // الاسم الكامل بالعربية — من سجل الأحوال (BRS §6)
  fullNameEn?: string; // الاسم الكامل بالإنجليزية — من السجل (BRS §6)
  idType?: IdType; // نوع الهوية — BRS §6 (مواطن/مقيم/خليجي)
  nationalId: string; // رقم الهوية (كان يُسمّى الهوية الوطنية)
  dob: string; // YYYY-MM-DD
  gender: "male" | "female" | ""; // من السجل (BRS §6)
  nationality: string; // lookup value — من السجل
  phone: string; // 05XXXXXXXX — حقل قديم (خارج BRS، محفوظ للتوافق)
  city: string; // lookup value
  bloodType: string;
}

export interface Vitals {
  height: string; // سم
  weight: string; // كجم
  bloodPressure: string; // 120/80
  pulse: string; // نبضة/دقيقة
}

export interface ExamResult {
  key: string;
  value: ExamValue;
  note?: string;
}

// فحص حدّة الإبصار — BRS §6
export interface VisualAcuity {
  visionRight: PassFail; // نظر العين اليمنى (نجاح/رسوب)
  visionLeft: PassFail; // نظر العين اليسرى
  levelRight: string; // مستوى إبصار العين اليمنى (بدون تصحيح) — كود VISION_LEVELS
  levelLeft: string; // مستوى إبصار العين اليسرى (بدون تصحيح)
  correctedRight: string; // مستوى الإبصار مع التصحيح — يمين
  correctedLeft: string; // مستوى الإبصار مع التصحيح — يسار
  colorVision: PassFail; // عمى الألوان (سليم/مصاب)
}

// فحص الأهلية — BRS §6
export interface Eligibility {
  mentalHealth: PassFail; // الصحة النفسية
  bodyHealth: PassFail; // صحة الجسد
}

export interface TimelineEntry {
  at: string; // ISO
  actorId: string;
  actorName: string;
  action: string; // وصف الإجراء
  note?: string;
}

export interface Report {
  id: string; // HLR[YY][9-digit] e.g. HLR26000000001
  status: ReportStatus;
  applicant: Applicant;
  // ---- بنود الفحص وفق BRS §6 ----
  visualAcuity?: VisualAcuity;
  eligibility?: Eligibility;
  result: Result; // النتيجة النهائية: fit=لائق / unfit=غير لائق
  notFitJustification?: string; // مبرّر عدم اللياقة — إلزامي عند "غير لائق"
  sharingStatus?: SharingStatus; // مشاركة الجهات المختصة (MEWA) — OQ-01
  // ---- حقول قديمة (خارج BRS، محفوظة للتوافق — OQ-19) ----
  licenseType: string; // legacy
  vitals: Vitals; // legacy
  exams: ExamResult[]; // legacy (بنود الفحص العامة السابقة)
  recommendation: string;
  auditNote?: string; // ملاحظة المدقّق عند الإعادة
  doctor: { id: string; name: string; org: string };
  auditor?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  decidedAt?: string;
  timeline: TimelineEntry[];
}

// النسخة v2: مخطط BRS §6 (حقول/رموز حالة جديدة). تغيير المفتاح يتجاهل أي بيانات
// قديمة غير متوافقة في المتصفح ويعيد تحميل البذرة الجديدة تلقائيًا.
const KEY = "hms_reports_v2";

function isBrowser() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function emptyApplicant(): Applicant {
  return {
    name: "",
    fullNameEn: "",
    idType: "",
    nationalId: "",
    dob: "",
    gender: "",
    nationality: "sa",
    phone: "",
    city: "riyadh",
    bloodType: "",
  };
}

export function emptyVisualAcuity(): VisualAcuity {
  return {
    visionRight: "passed",
    visionLeft: "passed",
    levelRight: "",
    levelLeft: "",
    correctedRight: "",
    correctedLeft: "",
    colorVision: "passed",
  };
}

export function emptyEligibility(): Eligibility {
  return { mentalHealth: "passed", bodyHealth: "passed" };
}

export function emptyReport(doctor: Report["doctor"]): Report {
  const now = new Date().toISOString();
  return {
    id: nextId(),
    status: "draft",
    applicant: emptyApplicant(),
    visualAcuity: emptyVisualAcuity(),
    eligibility: emptyEligibility(),
    result: null,
    notFitJustification: "",
    licenseType: "land",
    vitals: { height: "", weight: "", bloodPressure: "", pulse: "" },
    exams: [],
    recommendation: "",
    doctor,
    createdAt: now,
    updatedAt: now,
    timeline: [],
  };
}

// BR-CODE-FORMAT: HLR[YY][9-digit zero-padded sequential], never reset. e.g. HLR26000000043
export function nextId(): string {
  const yy = String(new Date().getFullYear() % 100).padStart(2, "0");
  const all = listReports();
  const max = all.reduce((m, r) => {
    const n = parseInt(r.id.replace(/^HLR\d{2}/, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `HLR${yy}${String(max + 1).padStart(9, "0")}`;
}

function read(): Report[] {
  if (!isBrowser()) return SEED;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    window.localStorage.setItem(KEY, JSON.stringify(SEED));
    return SEED;
  }
  try {
    return JSON.parse(raw) as Report[];
  } catch {
    return SEED;
  }
}

function write(reports: Report[]) {
  if (isBrowser()) window.localStorage.setItem(KEY, JSON.stringify(reports));
}

export function listReports(): Report[] {
  return read().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getReport(id: string): Report | undefined {
  return read().find((r) => r.id === id);
}

export function saveReport(report: Report): Report {
  const all = read();
  const idx = all.findIndex((r) => r.id === report.id);
  const next = { ...report, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  write(all);
  return next;
}

export function deleteReport(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function appendTimeline(report: Report, entry: TimelineEntry): Report {
  return { ...report, timeline: [...report.timeline, entry] };
}

// ---------------------------------------------------------------- BR-UNIQUE-REPORT (§4)
// لا يُسمح بأكثر من تقرير "ساري" أو "تحت الإجراء" لنفس المراجع، ما لم يكن
// القائم "منتهيًا" أو نتيجته "غير لائق" (الإعفاء معتمد فقط بعد الاعتماد — PROVISIONAL OQ-09).
const IN_PROGRESS_STATUSES: ReportStatus[] = [
  "draft",
  "pending_audit",
  "requires_modification",
];
const VALID_DAYS = 360; // صلاحية التقرير المكتمل من تاريخ الاعتماد (§4)

export interface UniquenessBlock {
  kind: "valid" | "in_progress";
  report: Report;
}

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

/**
 * يعيد التقرير المانع (إن وُجد) لنفس رقم الهوية، مع تجاهل التقرير الحالي.
 * valid → MSG06، in_progress → MSG07.
 */
export function findUniquenessBlock(
  idNumber: string,
  excludeId?: string,
): UniquenessBlock | null {
  if (!idNumber) return null;
  for (const r of read()) {
    if (r.id === excludeId) continue;
    if (r.applicant.nationalId !== idNumber) continue;
    // إعفاءات: منتهي، أو مكتمل بنتيجة غير لائق (معتمد)
    if (r.status === "expired") continue;
    if (r.status === "completed" && r.result === "unfit") continue;
    // تقرير ساري: مكتمل خلال 360 يومًا من الاعتماد
    if (r.status === "completed") {
      const base = r.decidedAt ?? r.updatedAt;
      if (daysSince(base) <= VALID_DAYS) return { kind: "valid", report: r };
      continue; // مكتمل قديم يُعامل كمنتهٍ فعليًا
    }
    // تقرير تحت الإجراء
    if (IN_PROGRESS_STATUSES.includes(r.status))
      return { kind: "in_progress", report: r };
  }
  return null;
}

/**
 * BR08: عند إنشاء/إرسال تقرير جديد لمراجع لديه تقرير سابق "غير لائق" معتمد،
 * يُنقل السابق إلى "منتهٍ" ضمن نفس العملية.
 */
export function expirePriorNotFit(idNumber: string, exceptId?: string) {
  const all = read();
  let changed = false;
  for (const r of all) {
    if (r.id === exceptId) continue;
    if (r.applicant.nationalId !== idNumber) continue;
    if (r.status === "completed" && r.result === "unfit") {
      r.status = "expired";
      changed = true;
    }
  }
  if (changed) write(all);
}

// ---------------------------------------------------------------- الصلاحية (§4)
// تقرير منتهي الصلاحية إن كانت حالته expired، أو مكتمل تجاوز 360 يومًا من الاعتماد.
export function isReportExpired(r: Report): boolean {
  if (r.status === "expired") return true;
  if (r.status === "completed") {
    const base = r.decidedAt ?? r.updatedAt;
    return daysSince(base) > VALID_DAYS;
  }
  return false;
}

// تاريخ انتهاء صلاحية التقرير المكتمل (ISO)، أو null لغير المكتمل.
export function validUntil(r: Report): string | null {
  if (r.status !== "completed") return null;
  const base = r.decidedAt ?? r.updatedAt;
  const d = new Date(base);
  d.setDate(d.getDate() + VALID_DAYS);
  return d.toISOString();
}

// إعادة تهيئة البذرة (لزر "إعادة ضبط البيانات التجريبية")
export function resetSeed() {
  write(SEED);
}

// ------------------------------------------------------------------ بذرة

function ts(daysAgo: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 12, 0, 0);
  return d.toISOString();
}

const DR = { id: "1024501", name: "د. سارة العتيبي", org: "مجمع صحة الطبي — الرياض" };
const AUD = { id: "2038114", name: "د. خالد القحطاني" };

function exams(allPassed: boolean, failedKeys: string[] = []): ExamResult[] {
  const keys = [
    "vision",
    "hearing",
    "motor",
    "cardio",
    "respiratory",
    "neuro",
    "psych",
    "substance",
  ];
  return keys.map((key) => ({
    key,
    value: !allPassed && failedKeys.includes(key) ? "failed" : "passed",
  }));
}

const RAW_SEED: Report[] = [
  {
    id: "HLR26000000001",
    status: "completed",
    applicant: {
      name: "عبدالله محمد الشهري",
      nationalId: "1098234571",
      dob: "1990-04-12",
      gender: "male",
      nationality: "sa",
      phone: "0551234567",
      city: "riyadh",
      bloodType: "O+",
    },
    licenseType: "land",
    vitals: { height: "176", weight: "78", bloodPressure: "120/80", pulse: "72" },
    exams: exams(true),
    result: "fit",
    recommendation: "لائق لمزاولة الصيد البري دون تحفظات.",
    doctor: DR,
    auditor: AUD,
    createdAt: ts(12),
    updatedAt: ts(8),
    submittedAt: ts(10),
    decidedAt: ts(8),
    timeline: [
      { at: ts(12), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(10), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
      { at: ts(8), actorId: AUD.id, actorName: AUD.name, action: "اعتماد التقرير", note: "مطابق للمعايير." },
    ],
  },
  {
    id: "HLR26000000002",
    status: "pending_audit",
    applicant: {
      name: "فهد سعد القحطاني",
      nationalId: "1076551203",
      dob: "1985-09-02",
      gender: "male",
      nationality: "sa",
      phone: "0533219988",
      city: "abha",
      bloodType: "A+",
    },
    licenseType: "falconry",
    vitals: { height: "182", weight: "90", bloodPressure: "130/85", pulse: "78" },
    exams: exams(true),
    result: "fit",
    recommendation: "لائق طبيًا للصيد بالصقور.",
    doctor: DR,
    createdAt: ts(4),
    updatedAt: ts(2),
    submittedAt: ts(2),
    timeline: [
      { at: ts(4), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(2), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
    ],
  },
  {
    id: "HLR26000000003",
    status: "requires_modification",
    applicant: {
      name: "ريم خالد الدوسري",
      nationalId: "1099887766",
      dob: "1996-01-20",
      gender: "female",
      nationality: "sa",
      phone: "0501122334",
      city: "jeddah",
      bloodType: "B+",
    },
    licenseType: "marine",
    vitals: { height: "165", weight: "60", bloodPressure: "118/76", pulse: "70" },
    exams: exams(false, ["vision"]),
    result: "unfit",
    recommendation: "يلزم تقرير أخصائي عيون قبل البتّ.",
    auditNote: "النتيجة غير متسقة مع نتائج فحص النظر — يرجى إرفاق تقرير الأخصائي.",
    doctor: DR,
    auditor: AUD,
    createdAt: ts(6),
    updatedAt: ts(3),
    submittedAt: ts(5),
    decidedAt: ts(3),
    timeline: [
      { at: ts(6), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(5), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
      { at: ts(3), actorId: AUD.id, actorName: AUD.name, action: "إعادة للتعديل", note: "النتيجة غير متسقة مع فحص النظر." },
    ],
  },
  {
    id: "HLR26000000004",
    status: "draft",
    applicant: {
      name: "سلطان ناصر العنزي",
      nationalId: "1055443322",
      dob: "1979-11-30",
      gender: "male",
      nationality: "sa",
      phone: "0544455667",
      city: "tabuk",
      bloodType: "AB+",
    },
    licenseType: "hunting_rifle",
    vitals: { height: "178", weight: "85", bloodPressure: "", pulse: "" },
    exams: exams(true),
    result: null,
    recommendation: "",
    doctor: DR,
    createdAt: ts(1),
    updatedAt: ts(0),
    timeline: [
      { at: ts(1), actorId: DR.id, actorName: DR.name, action: "إنشاء مسودة" },
    ],
  },
  {
    id: "HLR26000000005",
    status: "completed",
    applicant: {
      name: "ماجد علي الغامدي",
      nationalId: "1011223344",
      dob: "1988-06-18",
      gender: "male",
      nationality: "sa",
      phone: "0509988776",
      city: "dammam",
      bloodType: "O-",
    },
    licenseType: "land",
    vitals: { height: "180", weight: "82", bloodPressure: "122/79", pulse: "68" },
    exams: exams(true),
    result: "fit",
    recommendation: "لائق طبيًا.",
    doctor: DR,
    auditor: AUD,
    createdAt: ts(20),
    updatedAt: ts(16),
    submittedAt: ts(18),
    decidedAt: ts(16),
    timeline: [
      { at: ts(20), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(18), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
      { at: ts(16), actorId: AUD.id, actorName: AUD.name, action: "اعتماد التقرير" },
    ],
  },
  {
    id: "HLR26000000006",
    status: "pending_audit",
    applicant: {
      name: "هند فيصل المالكي",
      nationalId: "1066778899",
      dob: "1993-03-05",
      gender: "female",
      nationality: "sa",
      phone: "0566677889",
      city: "makkah",
      bloodType: "A-",
    },
    licenseType: "marine",
    vitals: { height: "168", weight: "63", bloodPressure: "115/74", pulse: "74" },
    exams: exams(true),
    result: "fit",
    recommendation: "لائق طبيًا للصيد البحري.",
    doctor: DR,
    createdAt: ts(3),
    updatedAt: ts(1),
    submittedAt: ts(1),
    timeline: [
      { at: ts(3), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(1), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
    ],
  },
  {
    id: "HLR26000000007",
    status: "pending_audit",
    applicant: {
      name: "تركي بندر الحربي",
      nationalId: "1033445566",
      dob: "1982-12-12",
      gender: "male",
      nationality: "sa",
      phone: "0522233445",
      city: "madinah",
      bloodType: "B-",
    },
    licenseType: "falconry",
    vitals: { height: "175", weight: "88", bloodPressure: "128/84", pulse: "80" },
    exams: exams(false, ["cardio"]),
    result: "unfit",
    recommendation: "يُحال لعيادة القلب لمزيد من التقييم.",
    doctor: DR,
    auditor: AUD,
    createdAt: ts(5),
    updatedAt: ts(1),
    submittedAt: ts(4),
    timeline: [
      { at: ts(5), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(4), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
      { at: ts(1), actorId: AUD.id, actorName: AUD.name, action: "بدء التدقيق" },
    ],
  },
  {
    id: "HLR26000000008",
    status: "expired",
    applicant: {
      name: "نواف عبدالعزيز السبيعي",
      nationalId: "1088990011",
      dob: "1991-07-07",
      gender: "male",
      nationality: "sa",
      phone: "0577788990",
      city: "hail",
      bloodType: "O+",
    },
    licenseType: "land",
    vitals: { height: "179", weight: "80", bloodPressure: "119/78", pulse: "71" },
    exams: exams(true),
    result: "fit",
    recommendation: "لائق طبيًا.",
    doctor: DR,
    auditor: AUD,
    createdAt: ts(30),
    updatedAt: ts(27),
    submittedAt: ts(29),
    decidedAt: ts(27),
    timeline: [
      { at: ts(30), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(29), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
      { at: ts(27), actorId: AUD.id, actorName: AUD.name, action: "اعتماد التقرير" },
    ],
  },
  {
    id: "HLR26000000009",
    status: "draft",
    applicant: {
      name: "بدر صالح المطيري",
      nationalId: "1044556677",
      dob: "1975-02-28",
      gender: "male",
      nationality: "sa",
      phone: "0500011223",
      city: "riyadh",
      bloodType: "AB-",
    },
    licenseType: "hunting_rifle",
    vitals: { height: "172", weight: "95", bloodPressure: "", pulse: "" },
    exams: [],
    result: null,
    recommendation: "",
    doctor: DR,
    createdAt: ts(0),
    updatedAt: ts(0),
    timeline: [
      { at: ts(0), actorId: DR.id, actorName: DR.name, action: "إنشاء مسودة" },
    ],
  },
  {
    id: "HLR26000000010",
    status: "requires_modification",
    applicant: {
      name: "العنود ماجد الشمري",
      nationalId: "1077665544",
      dob: "1998-10-10",
      gender: "female",
      nationality: "sa",
      phone: "0588877665",
      city: "jeddah",
      bloodType: "A+",
    },
    licenseType: "marine",
    vitals: { height: "162", weight: "58", bloodPressure: "110/70", pulse: "66" },
    exams: exams(true),
    result: "fit",
    recommendation: "لائق طبيًا.",
    auditNote: "بيانات التواصل ناقصة — يرجى تحديث رقم الجوال.",
    doctor: DR,
    auditor: AUD,
    createdAt: ts(7),
    updatedAt: ts(2),
    submittedAt: ts(6),
    decidedAt: ts(2),
    timeline: [
      { at: ts(7), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(6), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
      { at: ts(2), actorId: AUD.id, actorName: AUD.name, action: "إعادة للتعديل", note: "بيانات التواصل ناقصة." },
    ],
  },
  {
    id: "HLR26000000011",
    status: "completed",
    applicant: {
      name: "يوسف إبراهيم الدخيل",
      nationalId: "1022334455",
      dob: "1986-05-23",
      gender: "male",
      nationality: "sa",
      phone: "0511223344",
      city: "dammam",
      bloodType: "B+",
    },
    licenseType: "falconry",
    vitals: { height: "177", weight: "76", bloodPressure: "121/80", pulse: "69" },
    exams: exams(true),
    result: "fit",
    recommendation: "لائق طبيًا للصيد بالصقور.",
    doctor: DR,
    auditor: AUD,
    createdAt: ts(15),
    updatedAt: ts(12),
    submittedAt: ts(14),
    decidedAt: ts(12),
    timeline: [
      { at: ts(15), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(14), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
      { at: ts(12), actorId: AUD.id, actorName: AUD.name, action: "اعتماد التقرير" },
    ],
  },
  {
    id: "HLR26000000012",
    status: "pending_audit",
    applicant: {
      name: "منيرة سعود الرشيد",
      nationalId: "1099001122",
      dob: "1994-08-14",
      gender: "female",
      nationality: "sa",
      phone: "0555544332",
      city: "riyadh",
      bloodType: "O+",
    },
    licenseType: "land",
    vitals: { height: "170", weight: "65", bloodPressure: "117/75", pulse: "73" },
    exams: exams(false, ["hearing"]),
    result: "unfit",
    recommendation: "يلزم تقييم سمعي تخصصي.",
    doctor: DR,
    createdAt: ts(2),
    updatedAt: ts(0),
    submittedAt: ts(0),
    timeline: [
      { at: ts(2), actorId: DR.id, actorName: DR.name, action: "إنشاء التقرير" },
      { at: ts(0), actorId: DR.id, actorName: DR.name, action: "إرسال للتدقيق" },
    ],
  },
];

// يشتق حقول BRS §6 (حدّة الإبصار/الأهلية) من بنود الفحص القديمة، لتظهر بيانات
// متسقة في العرض والطباعة دون إعادة كتابة كل عنصر بذرة يدويًا.
function withBrsDefaults(r: Report): Report {
  const examVal = (k: string): PassFail =>
    r.exams.find((e) => e.key === k)?.value === "failed" ? "failed" : "passed";
  const vision = examVal("vision");
  const bodyFailed = ["hearing", "motor", "cardio", "respiratory", "neuro"].some(
    (k) => examVal(k) === "failed",
  );
  const mentalFailed =
    examVal("psych") === "failed" || examVal("substance") === "failed";
  return {
    ...r,
    applicant: {
      ...r.applicant,
      idType: r.applicant.idType ?? "citizen",
      fullNameEn: r.applicant.fullNameEn ?? "",
    },
    visualAcuity: r.visualAcuity ?? {
      visionRight: vision,
      visionLeft: vision,
      levelRight: vision === "failed" ? "4" : "1",
      levelLeft: vision === "failed" ? "4" : "1",
      correctedRight: "1",
      correctedLeft: "1",
      colorVision: "passed",
    },
    eligibility: r.eligibility ?? {
      mentalHealth: mentalFailed ? "failed" : "passed",
      bodyHealth: bodyFailed ? "failed" : "passed",
    },
    notFitJustification:
      r.notFitJustification ?? (r.result === "unfit" ? r.recommendation : ""),
  };
}

export const SEED: Report[] = RAW_SEED.map(withBrsDefaults);
