import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Heart,
  Save,
  Send,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/hms/Button";
import { Field, Select, TextInput, TextArea } from "@/components/hms/Field";
import { BloodChips } from "@/components/hms/BloodChips";
import { PassFailToggle } from "@/components/hms/PassFail";
import { ReportSection } from "@/components/hms/ReportSection";
import { ResultBadge } from "@/components/hms/Badges";
import { Modal } from "@/components/hms/Modal";
import { toast } from "@/components/hms/Toast";
import { CITIES, EXAM_ITEMS, GENDERS, NATIONALITIES } from "@/data/lookups";
import { BadgeCheck } from "lucide-react";
import {
  appendTimeline,
  saveReport,
  type ExamResult,
  type Report,
} from "@/data/reports";
import type { User } from "@/data/users";
import { msg } from "@/data/messages";
import { VERIFICATION_SOURCE } from "@/data/patientVerification";

type Mode = "create" | "edit";

export function ReportForm({
  initial,
  mode,
  user,
  lockApplicant = false,
}: {
  initial: Report;
  mode: Mode;
  user: User;
  /** أقفل الحقول الموثّقة من النظام الخارجي (الاسم/الهوية/الميلاد/الجنسية). */
  lockApplicant?: boolean;
}) {
  const navigate = useNavigate();
  const [report, setReport] = useState<Report>(() => normalizeExams(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);

  const setApplicant = <K extends keyof Report["applicant"]>(
    k: K,
    v: Report["applicant"][K],
  ) => setReport((r) => ({ ...r, applicant: { ...r.applicant, [k]: v } }));

  const setVitals = <K extends keyof Report["vitals"]>(
    k: K,
    v: Report["vitals"][K],
  ) => setReport((r) => ({ ...r, vitals: { ...r.vitals, [k]: v } }));

  const setExam = (key: string, value: ExamResult["value"]) =>
    setReport((r) => ({
      ...r,
      exams: r.exams.map((e) => (e.key === key ? { ...e, value } : e)),
    }));

  // ---- اكتمال الأقسام (شريط التقدّم) ----
  const sections = useMemo(() => computeSections(report), [report]);
  const completed = sections.filter((s) => s.done).length;
  const progress = Math.round((completed / sections.length) * 100);

  // ---- التحقق ----
  function validate(forSubmit: boolean): boolean {
    const e: Record<string, string> = {};
    const a = report.applicant;
    if (!a.name.trim()) e.name = msg("MSG06");
    if (!/^\d{10}$/.test(a.nationalId)) e.nationalId = msg("MSG07");
    if (!a.dob) e.dob = msg("MSG06");
    if (!a.gender) e.gender = msg("MSG06");
    if (!/^05\d{8}$/.test(a.phone)) e.phone = "رقم جوال غير صحيح (05XXXXXXXX).";
    if (forSubmit) {
      if (!a.bloodType) e.bloodType = "يرجى تحديد فصيلة الدم.";
      if (!report.vitals.height) e.height = msg("MSG06");
      if (!report.vitals.weight) e.weight = msg("MSG06");
      if (!report.result) e.result = "يرجى تحديد النتيجة النهائية.";
      if (!report.recommendation.trim())
        e.recommendation = "يرجى كتابة التوصية الطبية.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function persist(status: Report["status"], action: string): Report {
    const now = new Date().toISOString();
    let next: Report = {
      ...report,
      status,
      doctor: { id: user.id, name: user.name, org: user.org },
      updatedAt: now,
    };
    if (status === "pending_audit") next.submittedAt = now;
    next = appendTimeline(next, {
      at: now,
      actorId: user.id,
      actorName: user.name,
      action,
    });
    return saveReport(next);
  }

  const saveDraft = () => {
    if (!validate(false)) {
      toast.warn(msg("MSG06"));
      return;
    }
    persist("draft", mode === "create" ? "إنشاء مسودة" : "تحديث المسودة");
    toast.success(msg("MSG04"));
    navigate({ to: "/hunting-medical/$id", params: { id: report.id } });
  };

  const doSubmit = () => {
    setConfirm(false);
    persist("pending_audit", "إرسال للتدقيق");
    toast.success(msg("MSG05"));
    navigate({ to: "/hunting-medical/$id", params: { id: report.id } });
  };

  const trySubmit = () => {
    if (!validate(true)) {
      toast.error(msg("MSG06"));
      return;
    }
    setConfirm(true);
  };

  return (
    <div className="relative">
      <div className="grid gap-6 p-4 pb-28 lg:grid-cols-[1fr_300px] lg:p-10 lg:pb-28">
        {/* العمود الرئيسي */}
        <div className="space-y-6">
          {report.status === "requires_modification" && report.auditNote && (
            <div className="rounded-[var(--r-lg)] border border-[var(--err-100)] bg-[var(--err-50)] p-4">
              <div className="text-[13px] font-bold text-[var(--err-700)]">
                ملاحظة المدقّق — مُعاد للتعديل
              </div>
              <p className="mt-1 text-[13px] leading-6 text-[var(--err-700)]/90">
                {report.auditNote}
              </p>
            </div>
          )}

          {/* بيانات المتقدّم */}
          <ReportSection
            title="بيانات المتقدّم"
            subtitle="المعلومات الشخصية وبيانات التواصل"
            icon={<UserRound className="size-4" />}
          >
            {lockApplicant && (
              <div className="mb-4 flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--ok-100)] bg-[var(--ok-50)] px-3 py-2 text-[12px] font-medium text-[var(--ok-700)]">
                <BadgeCheck className="size-4" />
                بيانات موثّقة من {VERIFICATION_SOURCE} — غير قابلة للتعديل
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل" required error={errors.name}>
                <TextInput
                  value={report.applicant.name}
                  onChange={(e) => setApplicant("name", e.target.value)}
                  placeholder="الاسم الرباعي"
                  invalid={!!errors.name}
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="رقم الهوية" required error={errors.nationalId}>
                <TextInput
                  ltr
                  value={report.applicant.nationalId}
                  onChange={(e) =>
                    setApplicant(
                      "nationalId",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="10 أرقام"
                  invalid={!!errors.nationalId}
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="تاريخ الميلاد" required error={errors.dob}>
                <TextInput
                  ltr
                  type="date"
                  value={report.applicant.dob}
                  onChange={(e) => setApplicant("dob", e.target.value)}
                  invalid={!!errors.dob}
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="الجنس" required error={errors.gender}>
                <Select
                  value={report.applicant.gender}
                  onChange={(e) =>
                    setApplicant(
                      "gender",
                      e.target.value as Report["applicant"]["gender"],
                    )
                  }
                  options={GENDERS}
                  placeholder="اختر الجنس"
                  invalid={!!errors.gender}
                />
              </Field>
              <Field label="الجنسية">
                <Select
                  value={report.applicant.nationality}
                  onChange={(e) => setApplicant("nationality", e.target.value)}
                  options={NATIONALITIES}
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="المدينة">
                <Select
                  value={report.applicant.city}
                  onChange={(e) => setApplicant("city", e.target.value)}
                  options={CITIES}
                />
              </Field>
              <Field label="رقم الجوال" required error={errors.phone}>
                <TextInput
                  ltr
                  value={report.applicant.phone}
                  onChange={(e) =>
                    setApplicant(
                      "phone",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="05XXXXXXXX"
                  invalid={!!errors.phone}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="فصيلة الدم" error={errors.bloodType}>
                <BloodChips
                  value={report.applicant.bloodType}
                  onChange={(v) => setApplicant("bloodType", v)}
                />
              </Field>
            </div>
          </ReportSection>

          {/* العلامات الحيوية */}
          <ReportSection
            title="العلامات الحيوية"
            subtitle="القياسات الأساسية وقت الفحص"
            icon={<Heart className="size-4" />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="الطول (سم)" required error={errors.height}>
                <TextInput
                  ltr
                  value={report.vitals.height}
                  onChange={(e) =>
                    setVitals("height", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="175"
                  invalid={!!errors.height}
                />
              </Field>
              <Field label="الوزن (كجم)" required error={errors.weight}>
                <TextInput
                  ltr
                  value={report.vitals.weight}
                  onChange={(e) =>
                    setVitals("weight", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="78"
                  invalid={!!errors.weight}
                />
              </Field>
              <Field label="ضغط الدم">
                <TextInput
                  ltr
                  value={report.vitals.bloodPressure}
                  onChange={(e) => setVitals("bloodPressure", e.target.value)}
                  placeholder="120/80"
                />
              </Field>
              <Field label="النبض">
                <TextInput
                  ltr
                  value={report.vitals.pulse}
                  onChange={(e) =>
                    setVitals("pulse", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="72"
                />
              </Field>
            </div>
          </ReportSection>

          {/* بنود الفحص */}
          <ReportSection
            title="بنود الفحص الطبي"
            subtitle="حدّد حالة كل بند من بنود الفحص"
            icon={<Stethoscope className="size-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {report.exams.map((ex) => {
                const def = EXAM_ITEMS.find((x) => x.key === ex.key);
                return (
                  <div
                    key={ex.key}
                    className="rounded-[var(--r-md)] border border-[var(--ink-20)] p-3"
                  >
                    <div className="mb-2">
                      <div className="text-[13px] font-semibold text-[var(--ink-90)]">
                        {def?.label ?? ex.key}
                      </div>
                      {def?.hint && (
                        <div className="text-[11px] text-[var(--ink-60)]">
                          {def.hint}
                        </div>
                      )}
                    </div>
                    <PassFailToggle
                      value={ex.value}
                      onChange={(v) => setExam(ex.key, v)}
                    />
                  </div>
                );
              })}
            </div>
          </ReportSection>

          {/* النتيجة والتوصية */}
          <ReportSection
            title="النتيجة النهائية"
            subtitle="القرار الطبي والتوصية"
            icon={<ClipboardCheck className="size-4" />}
          >
            <Field label="القرار" required error={errors.result}>
              <div className="grid grid-cols-2 gap-3">
                {(["fit", "unfit"] as const).map((res) => {
                  const active = report.result === res;
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setReport((r) => ({ ...r, result: res }))}
                      className={`flex items-center justify-center gap-2 rounded-[var(--r-md)] border px-4 py-3 text-[14px] font-semibold transition-colors ${
                        active && res === "fit"
                          ? "border-[var(--ok-600)] bg-[var(--ok-50)] text-[var(--ok-700)]"
                          : active && res === "unfit"
                            ? "border-[var(--err-600)] bg-[var(--err-50)] text-[var(--err-700)]"
                            : "border-[var(--ink-20)] bg-white text-[var(--ink-70)] hover:bg-[var(--ink-10)]"
                      }`}
                    >
                      {res === "fit" ? "لائق طبيًا" : "غير لائق"}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="mt-4">
              <Field
                label="التوصية الطبية"
                required
                error={errors.recommendation}
              >
                <TextArea
                  rows={4}
                  value={report.recommendation}
                  onChange={(e) =>
                    setReport((r) => ({ ...r, recommendation: e.target.value }))
                  }
                  placeholder="اكتب التوصية أو الملاحظات الطبية…"
                  invalid={!!errors.recommendation}
                />
              </Field>
            </div>
          </ReportSection>
        </div>

        {/* شريط التقدّم الجانبي */}
        <aside className="no-print">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-[var(--r-2xl)] border border-[var(--ink-20)] bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3">
                <div className="relative size-14">
                  <svg className="size-14 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="var(--ink-20)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="var(--brand-60)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${progress} 100`}
                      pathLength={100}
                    />
                  </svg>
                  <span className="num absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[var(--brand-90)]">
                    {progress}%
                  </span>
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[var(--ink-90)]">
                    اكتمال التقرير
                  </div>
                  <div className="num text-[12px] text-[var(--ink-60)]">
                    {completed} من {sections.length} أقسام
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {sections.map((s) => (
                  <li
                    key={s.key}
                    className="flex items-center gap-2 text-[13px]"
                  >
                    <CheckCircle2
                      className={`size-4 ${
                        s.done
                          ? "text-[var(--ok-600)]"
                          : "text-[var(--ink-30)]"
                      }`}
                    />
                    <span
                      className={
                        s.done ? "text-[var(--ink-80)]" : "text-[var(--ink-50)]"
                      }
                    >
                      {s.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[var(--r-2xl)] border border-[var(--ink-20)] bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--ink-80)]">
                <Activity className="size-4 text-[var(--brand-60)]" /> النتيجة
                الحالية
              </div>
              <div className="mt-3">
                <ResultBadge result={report.result} size="lg" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* شريط الإجراءات الثابت */}
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-[var(--ink-20)] bg-white/95 backdrop-blur lg:start-72">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-10">
          <div className="num hidden text-[13px] text-[var(--ink-60)] sm:block">
            {report.id}
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate({ to: "/hunting-medical" })}
            >
              إلغاء
            </Button>
            <Button
              variant="secondary"
              icon={<Save className="size-4" />}
              onClick={saveDraft}
            >
              حفظ كمسودة
            </Button>
            <Button icon={<Send className="size-4" />} onClick={trySubmit}>
              إرسال للتدقيق
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="تأكيد الإرسال للتدقيق"
        description="بعد الإرسال لن تتمكن من تعديل التقرير حتى يتم تدقيقه. هل تريد المتابعة؟"
        tone="warn"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              تراجع
            </Button>
            <Button icon={<Send className="size-4" />} onClick={doSubmit}>
              تأكيد الإرسال
            </Button>
          </>
        }
      />
    </div>
  );
}

// تهيئة بنود الفحص في حال كانت ناقصة
function normalizeExams(r: Report): Report {
  if (r.exams.length === EXAM_ITEMS.length) return r;
  const existing = new Map(r.exams.map((e) => [e.key, e]));
  return {
    ...r,
    exams: EXAM_ITEMS.map(
      (def) => existing.get(def.key) ?? { key: def.key, value: "passed" },
    ),
  };
}

function computeSections(r: Report) {
  const a = r.applicant;
  return [
    {
      key: "applicant",
      label: "بيانات المتقدّم",
      done:
        !!a.name.trim() &&
        /^\d{10}$/.test(a.nationalId) &&
        !!a.dob &&
        !!a.gender &&
        /^05\d{8}$/.test(a.phone),
    },
    {
      key: "vitals",
      label: "العلامات الحيوية",
      done: !!r.vitals.height && !!r.vitals.weight,
    },
    {
      key: "exams",
      label: "بنود الفحص",
      done: r.exams.length > 0,
    },
    {
      key: "result",
      label: "النتيجة والتوصية",
      done: !!r.result && !!r.recommendation.trim(),
    },
  ];
}
