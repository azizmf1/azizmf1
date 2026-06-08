// قوائم مرجعية ثابتة (Lookups) — كلها mock، لا باكند.

export type ReportStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "returned";

export const STATUSES: Record<
  ReportStatus,
  { ar: string; tone: "gray" | "amber" | "orange" | "green" | "red" | "neutral" }
> = {
  draft: { ar: "مسودة", tone: "gray" },
  submitted: { ar: "بانتظار التدقيق", tone: "amber" },
  under_review: { ar: "قيد التدقيق", tone: "orange" },
  approved: { ar: "معتمد", tone: "green" },
  returned: { ar: "مُعاد للتعديل", tone: "red" },
};

export const STATUS_ORDER: ReportStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "returned",
  "approved",
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
