import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Droplet,
  Eye,
  Save,
  Send,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/hms/Button";
import { Field, Select, TextInput, TextArea } from "@/components/hms/Field";
import { PassFailToggle } from "@/components/hms/PassFail";
import { ReportSection } from "@/components/hms/ReportSection";
import { ResultBadge } from "@/components/hms/Badges";
import { Modal } from "@/components/hms/Modal";
import { toast } from "@/components/hms/Toast";
import {
  BLOOD_TYPE_OPTIONS,
  CITIES,
  GENDERS,
  ID_TYPES,
  NATIONALITIES,
  STATUSES,
  VISION_LEVELS,
} from "@/data/lookups";
import {
  appendTimeline,
  emptyEligibility,
  emptyVisualAcuity,
  expirePriorNotFit,
  findUniquenessBlock,
  saveReport,
  type Eligibility,
  type Report,
  type VisualAcuity,
} from "@/data/reports";
import type { User } from "@/data/users";
import { brsMsg } from "@/data/brsMessages";
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
  /** أقفل الحقول الموثّقة من السجل الوطني (النوع/الرقم/الاسم/الجنسية/الجنس/الميلاد). */
  lockApplicant?: boolean;
}) {
  const navigate = useNavigate();
  const [report, setReport] = useState<Report>(() => normalize(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [confirmDraft, setConfirmDraft] = useState(false); // UC03 — MSG10
  const [confirmCancel, setConfirmCancel] = useState(false); // UC06 — MSG03

  const va = report.visualAcuity ?? emptyVisualAcuity();
  const elig = report.eligibility ?? emptyEligibility();

  const setApplicant = <K extends keyof Report["applicant"]>(
    k: K,
    v: Report["applicant"][K],
  ) => setReport((r) => ({ ...r, applicant: { ...r.applicant, [k]: v } }));

  const setVA = <K extends keyof VisualAcuity>(k: K, v: VisualAcuity[K]) =>
    setReport((r) => ({
      ...r,
      visualAcuity: { ...(r.visualAcuity ?? emptyVisualAcuity()), [k]: v },
    }));

  const setElig = <K extends keyof Eligibility>(k: K, v: Eligibility[K]) =>
    setReport((r) => ({
      ...r,
      eligibility: { ...(r.eligibility ?? emptyEligibility()), [k]: v },
    }));

  // ---- اكتمال الأقسام (شريط التقدّم) ----
  const sections = useMemo(() => computeSections(report), [report]);
  const completed = sections.filter((s) => s.done).length;
  const progress = Math.round((completed / sections.length) * 100);

  // ---- التحقق من الحقول الإلزامية (MSG05) ----
  function validate(forSubmit: boolean): boolean {
    const e: Record<string, string> = {};
    const v = report.visualAcuity ?? emptyVisualAcuity();
    if (!v.levelRight) e.levelRight = "مطلوب";
    if (!v.levelLeft) e.levelLeft = "مطلوب";
    if (!v.correctedRight) e.correctedRight = "مطلوب";
    if (!v.correctedLeft) e.correctedLeft = "مطلوب";
    if (!report.applicant.bloodType) e.bloodType = "مطلوب";
    if (forSubmit) {
      if (!report.result) e.result = "مطلوب";
      if (report.result === "unfit" && !report.notFitJustification?.trim())
        e.notFitJustification = "مطلوب عند نتيجة غير لائق";
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
    if (status === "pending_audit") {
      next.submittedAt = now;
      // BR08: أي تقرير سابق "غير لائق" معتمد لنفس المراجع يُنقل إلى منتهٍ.
      expirePriorNotFit(report.applicant.nationalId, report.id);
    }
    next = appendTimeline(next, {
      at: now,
      actorId: user.id,
      actorName: user.name,
      action,
    });
    return saveReport(next);
  }

  // UC03 — حفظ كمسودة: تأكيد (MSG10) قبل الحفظ للإرسال لاحقًا.
  const tryDraft = () => {
    if (!report.applicant.bloodType) {
      toast.warn(brsMsg("MSG05"));
      return;
    }
    setConfirmDraft(true);
  };

  const doSaveDraft = () => {
    setConfirmDraft(false);
    persist("draft", mode === "create" ? "إنشاء مسودة" : "تحديث المسودة");
    toast.success(brsMsg("MSG00"));
    navigate({ to: "/hunting-medical/$id", params: { id: report.id } });
  };

  const doSubmit = () => {
    setConfirm(false);
    persist("pending_audit", "إرسال للتدقيق");
    toast.success(brsMsg("MSG00"));
    navigate({ to: "/hunting-medical/$id", params: { id: report.id } });
  };

  const trySubmit = () => {
    if (!validate(true)) {
      toast.error(brsMsg("MSG05"));
      return;
    }
    // BR-UNIQUE-REPORT: تحقّق من عدم وجود تقرير ساري/تحت الإجراء لنفس المراجع.
    const block = findUniquenessBlock(report.applicant.nationalId, report.id);
    if (block?.kind === "valid") {
      toast.error(brsMsg("MSG06"));
      return;
    }
    if (block?.kind === "in_progress") {
      toast.error(
        brsMsg("MSG07", { status: STATUSES[block.report.status].ar }),
      );
      return;
    }
    setConfirm(true);
  };

  const isFit = report.result === "fit";

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

          {/* بيانات المراجع — موثّقة من السجل الوطني */}
          <ReportSection
            title="بيانات المراجع"
            subtitle="بيانات موثّقة من السجل الوطني"
            icon={<UserRound className="size-4" />}
          >
            {lockApplicant && (
              <div className="mb-4 flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--ok-100)] bg-[var(--ok-50)] px-3 py-2 text-[12px] font-medium text-[var(--ok-700)]">
                <BadgeCheck className="size-4" />
                بيانات موثّقة من {VERIFICATION_SOURCE} — غير قابلة للتعديل
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نوع الهوية">
                <Select
                  value={report.applicant.idType ?? ""}
                  onChange={(e) =>
                    setApplicant(
                      "idType",
                      e.target.value as Report["applicant"]["idType"],
                    )
                  }
                  options={ID_TYPES}
                  placeholder="—"
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="رقم الهوية">
                <TextInput
                  ltr
                  value={report.applicant.nationalId}
                  onChange={(e) =>
                    setApplicant("nationalId", e.target.value.slice(0, 20))
                  }
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="الاسم الكامل (عربي)">
                <TextInput
                  value={report.applicant.name}
                  onChange={(e) => setApplicant("name", e.target.value)}
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="الاسم الكامل (إنجليزي)">
                <TextInput
                  ltr
                  value={report.applicant.fullNameEn ?? ""}
                  onChange={(e) => setApplicant("fullNameEn", e.target.value)}
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="تاريخ الميلاد">
                <TextInput
                  ltr
                  type="date"
                  value={report.applicant.dob}
                  onChange={(e) => setApplicant("dob", e.target.value)}
                  disabled={lockApplicant}
                />
              </Field>
              <Field label="الجنس">
                <Select
                  value={report.applicant.gender}
                  onChange={(e) =>
                    setApplicant(
                      "gender",
                      e.target.value as Report["applicant"]["gender"],
                    )
                  }
                  options={GENDERS}
                  placeholder="—"
                  disabled={lockApplicant}
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
            </div>
          </ReportSection>

          {/* فحص حدّة الإبصار — BRS §6 */}
          <ReportSection
            title="فحص حدّة الإبصار"
            subtitle="النظر لكل عين، مستوى الإبصار بدون/مع التصحيح، وعمى الألوان"
            icon={<Eye className="size-4" />}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="نظر العين اليمنى">
                <PassFailToggle
                  value={va.visionRight}
                  onChange={(v) => setVA("visionRight", v)}
                  passedLabel="سليم"
                  failedLabel="غير سليم"
                />
              </Field>
              <Field label="نظر العين اليسرى">
                <PassFailToggle
                  value={va.visionLeft}
                  onChange={(v) => setVA("visionLeft", v)}
                  passedLabel="سليم"
                  failedLabel="غير سليم"
                />
              </Field>
              <Field
                label="مستوى إبصار العين اليمنى"
                required
                error={errors.levelRight}
              >
                <Select
                  value={va.levelRight}
                  onChange={(e) => setVA("levelRight", e.target.value)}
                  options={VISION_LEVELS}
                  placeholder="اختر المستوى"
                  invalid={!!errors.levelRight}
                />
              </Field>
              <Field
                label="مستوى إبصار العين اليسرى"
                required
                error={errors.levelLeft}
              >
                <Select
                  value={va.levelLeft}
                  onChange={(e) => setVA("levelLeft", e.target.value)}
                  options={VISION_LEVELS}
                  placeholder="اختر المستوى"
                  invalid={!!errors.levelLeft}
                />
              </Field>
              <Field
                label="الإبصار مع التصحيح — يمين"
                required
                error={errors.correctedRight}
              >
                <Select
                  value={va.correctedRight}
                  onChange={(e) => setVA("correctedRight", e.target.value)}
                  options={VISION_LEVELS}
                  placeholder="اختر المستوى"
                  invalid={!!errors.correctedRight}
                />
              </Field>
              <Field
                label="الإبصار مع التصحيح — يسار"
                required
                error={errors.correctedLeft}
              >
                <Select
                  value={va.correctedLeft}
                  onChange={(e) => setVA("correctedLeft", e.target.value)}
                  options={VISION_LEVELS}
                  placeholder="اختر المستوى"
                  invalid={!!errors.correctedLeft}
                />
              </Field>
              <Field label="عمى الألوان">
                <PassFailToggle
                  value={va.colorVision}
                  onChange={(v) => setVA("colorVision", v)}
                  passedLabel="سليم"
                  failedLabel="مصاب"
                />
              </Field>
            </div>
          </ReportSection>

          {/* فحص الأهلية — BRS §6 */}
          <ReportSection
            title="فحص الأهلية"
            subtitle="الصحة النفسية وصحة الجسد"
            icon={<Stethoscope className="size-4" />}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="الصحة النفسية">
                <PassFailToggle
                  value={elig.mentalHealth}
                  onChange={(v) => setElig("mentalHealth", v)}
                  passedLabel="سليم"
                  failedLabel="غير سليم"
                />
              </Field>
              <Field label="صحة الجسد">
                <PassFailToggle
                  value={elig.bodyHealth}
                  onChange={(v) => setElig("bodyHealth", v)}
                  passedLabel="سليم"
                  failedLabel="غير سليم"
                />
              </Field>
            </div>
          </ReportSection>

          {/* فصيلة الدم — BRS §6 */}
          <ReportSection
            title="فصيلة الدم"
            icon={<Droplet className="size-4" />}
          >
            <div className="max-w-xs">
              <Field label="فصيلة الدم" required error={errors.bloodType}>
                <Select
                  value={report.applicant.bloodType}
                  onChange={(e) => setApplicant("bloodType", e.target.value)}
                  options={BLOOD_TYPE_OPTIONS}
                  placeholder="اختر الفصيلة"
                  invalid={!!errors.bloodType}
                />
              </Field>
            </div>
          </ReportSection>

          {/* النتيجة النهائية — BRS §6 */}
          <ReportSection
            title="النتيجة النهائية"
            subtitle="القرار الطبي النهائي"
            icon={<ClipboardCheck className="size-4" />}
          >
            <Field label="النتيجة" required error={errors.result}>
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
                      {res === "fit" ? "لائق" : "غير لائق"}
                    </button>
                  );
                })}
              </div>
            </Field>
            {report.result === "unfit" && (
              <div className="mt-4">
                <Field
                  label="مبرّر عدم اللياقة"
                  required
                  error={errors.notFitJustification}
                >
                  <TextArea
                    rows={4}
                    value={report.notFitJustification ?? ""}
                    onChange={(e) =>
                      setReport((r) => ({
                        ...r,
                        notFitJustification: e.target.value,
                      }))
                    }
                    placeholder="اكتب سبب عدم اللياقة الطبية…"
                    invalid={!!errors.notFitJustification}
                  />
                </Field>
              </div>
            )}
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
              onClick={() => setConfirmCancel(true)}
            >
              إلغاء
            </Button>
            <Button
              variant="secondary"
              icon={<Save className="size-4" />}
              onClick={tryDraft}
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
        description={isFit ? brsMsg("MSG15") : brsMsg("MSG16")}
        tone={isFit ? "warn" : "danger"}
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

      {/* UC03 — تأكيد حفظ المسودة (MSG10) */}
      <Modal
        open={confirmDraft}
        onClose={() => setConfirmDraft(false)}
        title="حفظ كمسودة"
        description={brsMsg("MSG10")}
        tone="default"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDraft(false)}>
              تراجع
            </Button>
            <Button icon={<Save className="size-4" />} onClick={doSaveDraft}>
              حفظ المسودة
            </Button>
          </>
        }
      />

      {/* UC06 — تأكيد الإلغاء دون حفظ (MSG03) */}
      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="إلغاء دون حفظ"
        description={brsMsg("MSG03")}
        tone="warn"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
              متابعة التعديل
            </Button>
            <Button
              variant="danger"
              onClick={() => navigate({ to: "/hunting-medical" })}
            >
              نعم، إلغاء
            </Button>
          </>
        }
      />
    </div>
  );
}

// يضمن وجود بنى BRS §6 عند تحميل تقرير قديم.
function normalize(r: Report): Report {
  return {
    ...r,
    visualAcuity: r.visualAcuity ?? emptyVisualAcuity(),
    eligibility: r.eligibility ?? emptyEligibility(),
    notFitJustification: r.notFitJustification ?? "",
  };
}

function computeSections(r: Report) {
  const v = r.visualAcuity ?? emptyVisualAcuity();
  return [
    {
      key: "applicant",
      label: "بيانات المراجع",
      done: !!r.applicant.name && !!r.applicant.nationalId,
    },
    {
      key: "vision",
      label: "حدّة الإبصار",
      done:
        !!v.levelRight &&
        !!v.levelLeft &&
        !!v.correctedRight &&
        !!v.correctedLeft,
    },
    {
      key: "blood",
      label: "فصيلة الدم",
      done: !!r.applicant.bloodType,
    },
    {
      key: "result",
      label: "النتيجة النهائية",
      done:
        !!r.result &&
        (r.result !== "unfit" || !!r.notFitJustification?.trim()),
    },
  ];
}
