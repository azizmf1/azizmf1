// قوائم مرجعية ثابتة (Lookups) — كلها mock، لا باكند.

// حالات التقرير — BRS §3 (رموز + AR/EN).
export type ReportStatus =
  | "draft"
  | "pending_audit"
  | "completed"
  | "requires_modification"
  | "expired";

export const STATUSES: Record<
  ReportStatus,
  {
    ar: string;
    en: string;
    tone: "gray" | "amber" | "orange" | "green" | "red" | "neutral";
  }
> = {
  draft: { ar: "مسودة", en: "Draft", tone: "gray" },
  pending_audit: { ar: "بانتظار التدقيق", en: "Pending for Auditing", tone: "amber" },
  completed: { ar: "مكتمل", en: "Completed", tone: "green" },
  requires_modification: {
    ar: "معاد إلى المدخل",
    en: "Requires Modification",
    tone: "red",
  },
  expired: { ar: "منتهي", en: "Expired", tone: "gray" },
};

export const STATUS_ORDER: ReportStatus[] = [
  "draft",
  "pending_audit",
  "requires_modification",
  "completed",
  "expired",
];

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const GENDERS: { value: string; label: string }[] = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
];

export const NATIONALITIES: { value: string; label: string }[] = [
  { value: "sa", label: "سعودي" },
  { value: "non_sa", label: "غير سعودي" },
];

export const CITIES: { value: string; label: string }[] = [
  { value: "riyadh", label: "الرياض" },
  { value: "jeddah", label: "جدة" },
  { value: "dammam", label: "الدمام" },
  { value: "makkah", label: "مكة المكرمة" },
  { value: "madinah", label: "المدينة المنورة" },
  { value: "abha", label: "أبها" },
  { value: "tabuk", label: "تبوك" },
  { value: "hail", label: "حائل" },
];

// أنواع رخص الصيد (UC02)
export const LICENSE_TYPES: { value: string; label: string }[] = [
  { value: "land", label: "صيد بري" },
  { value: "marine", label: "صيد بحري" },
  { value: "falconry", label: "صيد بالصقور" },
  { value: "hunting_rifle", label: "صيد بالأسلحة" },
];

// بنود الفحص الطبي (PassFail) — UC02/UC07
export interface ExamItemDef {
  key: string;
  label: string;
  hint?: string;
}

export const EXAM_ITEMS: ExamItemDef[] = [
  { key: "vision", label: "فحص النظر", hint: "حدة الإبصار وقدرة تمييز الألوان" },
  { key: "hearing", label: "فحص السمع" },
  { key: "motor", label: "السلامة الحركية والعضلية" },
  { key: "cardio", label: "القلب والأوعية الدموية" },
  { key: "respiratory", label: "الجهاز التنفسي" },
  { key: "neuro", label: "الفحص العصبي" },
  { key: "psych", label: "التقييم النفسي والسلوكي" },
  { key: "substance", label: "خلو من المؤثرات العقلية" },
];

export function lookupLabel(
  list: { value: string; label: string }[],
  value: string,
): string {
  return list.find((x) => x.value === value)?.label ?? value;
}
