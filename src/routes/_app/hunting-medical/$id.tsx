import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  Check,
  Clock,
  Droplet,
  Eye,
  Pencil,
  Printer,
  Send,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/hms/Shell";
import { Card, CardBody, CardHeader } from "@/components/hms/Card";
import { Button } from "@/components/hms/Button";
import { ReportSection } from "@/components/hms/ReportSection";
import { StatusBadge, ResultBadge } from "@/components/hms/Badges";
import { Modal } from "@/components/hms/Modal";
import { NotFound } from "@/components/hms/States";
import { toast } from "@/components/hms/Toast";
import {
  appendTimeline,
  emptyEligibility,
  emptyVisualAcuity,
  getReport,
  isReportExpired,
  saveReport,
  validUntil,
  type PassFail,
  type Report,
} from "@/data/reports";
import {
  CITIES,
  EXAM_ITEMS,
  GENDERS,
  ID_TYPES,
  NATIONALITIES,
  VISION_LEVELS,
  lookupLabel,
} from "@/data/lookups";
import { age, fmtDate, fmtDateTime } from "@/lib/format";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { can } from "@/lib/permissions";
import { msg } from "@/data/messages";

const SHARING_LABEL: Record<string, string> = {
  not_shared: "غير مُشاركة",
  pending: "قيد الإرسال",
  shared: "تمت المشاركة",
  failed: "تعذّرت المشاركة",
};

export const Route = createFileRoute("/_app/hunting-medical/$id")({
  component: ReportViewPage,
});

function ReportViewPage() {
  const { id } = useParams({ from: "/_app/hunting-medical/$id" });
  const user = useCurrentUser();
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    setReport(getReport(id) ?? null);
  }, [id]);

  if (report === undefined || !user) return null;
  if (report === null) return <NotFound />;

  const submit = () => {
    const now = new Date().toISOString();
    const next = appendTimeline(
      { ...report, status: "pending_audit", submittedAt: now, updatedAt: now },
      {
        at: now,
        actorId: user.id,
        actorName: user.name,
        action: "إرسال للتدقيق",
      },
    );
    saveReport(next);
    setReport(next);
    setConfirmSubmit(false);
    toast.success(msg("MSG05"));
  };

  const copyId = () => {
    navigator.clipboard?.writeText(report.id);
    toast.success(msg("MSG13"));
  };

  return (
    <div>
      <PageHeader
        title={report.applicant.name}
        subtitle={report.id}
        breadcrumb={[
          { label: "التقارير الطبية", to: "/hunting-medical" },
          { label: report.id },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {report.status === "completed" && !isReportExpired(report) && (
              <Link
                to="/hunting-medical/$id/print"
                params={{ id: report.id }}
              >
                <Button
                  variant="secondary"
                  icon={<Printer className="size-4" />}
                >
                  طباعة
                </Button>
              </Link>
            )}
            {can(user, "report:edit", report) && (
              <Link to="/hunting-medical/$id/edit" params={{ id: report.id }}>
                <Button variant="secondary" icon={<Pencil className="size-4" />}>
                  تعديل
                </Button>
              </Link>
            )}
            {can(user, "report:submit", report) && (
              <Button
                icon={<Send className="size-4" />}
                onClick={() => setConfirmSubmit(true)}
              >
                إرسال للتدقيق
              </Button>
            )}
            {can(user, "report:audit", report) && (
              <Link to="/hunting-medical/$id/audit" params={{ id: report.id }}>
                <Button icon={<ShieldCheck className="size-4" />}>تدقيق</Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-6 p-4 lg:grid-cols-[1fr_320px] lg:p-10">
        {/* المحتوى */}
        <div className="space-y-6">
          {/* UC05 — بانر الصلاحية (§4) */}
          {isReportExpired(report) ? (
            <div className="rounded-[var(--r-lg)] border border-[var(--err-100)] bg-[var(--err-50)] p-4 text-[13px] font-semibold text-[var(--err-700)]">
              انتهت صلاحية هذا التقرير — غير قابل للطباعة أو التعديل أو التدقيق.
            </div>
          ) : (
            report.status === "completed" &&
            validUntil(report) && (
              <div className="rounded-[var(--r-lg)] border border-[var(--ok-100)] bg-[var(--ok-50)] p-4 text-[13px] font-semibold text-[var(--ok-700)]">
                تقرير ساري الصلاحية حتى{" "}
                <span className="num">{fmtDate(validUntil(report)!)}</span> (360
                يومًا من الاعتماد).
              </div>
            )
          )}

          {report.status === "requires_modification" && report.auditNote && (
            <div className="rounded-[var(--r-lg)] border border-[var(--err-100)] bg-[var(--err-50)] p-4">
              <div className="text-[13px] font-bold text-[var(--err-700)]">
                مُعاد للتعديل — ملاحظة المدقّق
              </div>
              <p className="mt-1 text-[13px] leading-6 text-[var(--err-700)]/90">
                {report.auditNote}
              </p>
            </div>
          )}

          <ReportSection
            title="بيانات المتقدّم"
            icon={<UserRound className="size-4" />}
          >
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info
                label="نوع الهوية"
                value={lookupLabel(ID_TYPES, report.applicant.idType ?? "")}
              />
              <Info label="رقم الهوية" value={report.applicant.nationalId} ltr />
              <Info label="الاسم (عربي)" value={report.applicant.name} />
              <Info
                label="الاسم (إنجليزي)"
                value={report.applicant.fullNameEn || "—"}
                ltr
              />
              <Info label="العمر" value={age(report.applicant.dob)} />
              <Info
                label="الجنس"
                value={lookupLabel(GENDERS, report.applicant.gender)}
              />
              <Info
                label="الجنسية"
                value={lookupLabel(NATIONALITIES, report.applicant.nationality)}
              />
              <Info
                label="المدينة"
                value={lookupLabel(CITIES, report.applicant.city)}
              />
              <Info
                label="فصيلة الدم"
                value={report.applicant.bloodType || "—"}
                ltr
                icon={<Droplet className="size-4 text-[var(--err-600)]" />}
              />
            </dl>
          </ReportSection>

          <ReportSection
            title="فحص حدّة الإبصار"
            icon={<Eye className="size-4" />}
          >
            {(() => {
              const v = report.visualAcuity ?? emptyVisualAcuity();
              return (
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <PfInfo label="نظر العين اليمنى" value={v.visionRight} />
                  <PfInfo label="نظر العين اليسرى" value={v.visionLeft} />
                  <PfInfo label="عمى الألوان" value={v.colorVision} okAr="سليم" noAr="مصاب" />
                  <Info
                    label="مستوى الإبصار — يمين"
                    value={lookupLabel(VISION_LEVELS, v.levelRight)}
                  />
                  <Info
                    label="مستوى الإبصار — يسار"
                    value={lookupLabel(VISION_LEVELS, v.levelLeft)}
                  />
                  <span className="hidden lg:block" />
                  <Info
                    label="مع التصحيح — يمين"
                    value={lookupLabel(VISION_LEVELS, v.correctedRight)}
                  />
                  <Info
                    label="مع التصحيح — يسار"
                    value={lookupLabel(VISION_LEVELS, v.correctedLeft)}
                  />
                </dl>
              );
            })()}
          </ReportSection>

          <ReportSection
            title="فحص الأهلية"
            icon={<Stethoscope className="size-4" />}
          >
            {(() => {
              const el = report.eligibility ?? emptyEligibility();
              return (
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <PfInfo label="الصحة النفسية" value={el.mentalHealth} />
                  <PfInfo label="صحة الجسد" value={el.bodyHealth} />
                </dl>
              );
            })()}
          </ReportSection>

          <ReportSection
            title="النتيجة النهائية"
            icon={<Activity className="size-4" />}
          >
            <div className="flex flex-wrap items-center gap-3">
              <ResultBadge result={report.result} size="lg" />
            </div>
            {report.result === "unfit" && (
              <div className="mt-4">
                <div className="text-[12px] text-[var(--ink-50)]">
                  مبرّر عدم اللياقة
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-7 text-[var(--ink-80)]">
                  {report.notFitJustification || "—"}
                </p>
              </div>
            )}
          </ReportSection>

          {/* OQ-19 — بيانات قديمة (خارج BRS)، للقراءة فقط، على شاشة العرض فقط */}
          {(report.exams.length > 0 ||
            report.vitals.height ||
            report.vitals.weight ||
            report.vitals.bloodPressure ||
            report.vitals.pulse) && (
            <details className="rounded-[var(--r-lg)] border border-[var(--ink-20)] bg-[var(--ink-10)]/40 p-4">
              <summary className="cursor-pointer text-[13px] font-semibold text-[var(--ink-70)]">
                بيانات قديمة (خارج المتطلبات — للاطلاع فقط)
              </summary>
              <div className="mt-3 space-y-3">
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="الطول" value={report.vitals.height ? `${report.vitals.height} سم` : "—"} ltr />
                  <Info label="الوزن" value={report.vitals.weight ? `${report.vitals.weight} كجم` : "—"} ltr />
                  <Info label="ضغط الدم" value={report.vitals.bloodPressure || "—"} ltr />
                  <Info label="النبض" value={report.vitals.pulse || "—"} ltr />
                </dl>
                {report.exams.length > 0 && (
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {report.exams.map((ex) => (
                      <li
                        key={ex.key}
                        className="flex items-center justify-between text-[12px] text-[var(--ink-70)]"
                      >
                        <span>
                          {EXAM_ITEMS.find((x) => x.key === ex.key)?.label ??
                            ex.key}
                        </span>
                        <span
                          className={
                            ex.value === "passed"
                              ? "text-[var(--ok-700)]"
                              : "text-[var(--err-700)]"
                          }
                        >
                          {ex.value === "passed" ? "سليم" : "غير سليم"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          )}
        </div>

        {/* الجانب: الحالة + Timeline */}
        <aside className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--ink-60)]">الحالة</span>
                <StatusBadge status={report.status} />
              </div>
              <button
                onClick={copyId}
                className="num flex w-full items-center justify-between rounded-[var(--r-md)] bg-[var(--ink-10)] px-3 py-2 text-[13px] font-semibold text-[var(--brand-90)] hover:bg-[var(--brand-10)]"
              >
                {report.id}
              </button>
              <div className="space-y-2 border-t border-[var(--ink-10)] pt-3 text-[13px]">
                <Row label="الطبيب" value={report.doctor.name} />
                <Row label="المنشأة" value={report.doctor.org} />
                {report.auditor && (
                  <Row label="المدقّق" value={report.auditor.name} />
                )}
                {report.status === "completed" && report.sharingStatus && (
                  <Row
                    label="مشاركة الجهات المختصة"
                    value={SHARING_LABEL[report.sharingStatus]}
                  />
                )}
                <Row label="آخر تحديث" value={fmtDateTime(report.updatedAt)} ltr />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="سجل الإجراءات"
              icon={<Clock className="size-5" />}
            />
            <CardBody>
              <ol className="relative space-y-5 ps-5">
                <span className="absolute inset-y-1 start-[6px] w-px bg-[var(--ink-20)]" />
                {[...report.timeline]
                  .slice()
                  .reverse()
                  .map((t, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -start-[14px] top-1 size-3 rounded-full border-2 border-white bg-[var(--brand-60)] shadow" />
                      <div className="text-[13px] font-semibold text-[var(--ink-90)]">
                        {t.action}
                      </div>
                      <div className="num text-[11px] text-[var(--ink-50)]">
                        {fmtDateTime(t.at)} · {t.actorName}
                      </div>
                      {t.note && (
                        <div className="mt-1 rounded-[var(--r-md)] bg-[var(--ink-10)] px-2.5 py-1.5 text-[12px] text-[var(--ink-70)]">
                          {t.note}
                        </div>
                      )}
                    </li>
                  ))}
                {report.timeline.length === 0 && (
                  <li className="text-[13px] text-[var(--ink-60)]">
                    لا توجد إجراءات مسجّلة.
                  </li>
                )}
              </ol>
            </CardBody>
          </Card>
        </aside>
      </div>

      <Modal
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        title="تأكيد الإرسال للتدقيق"
        description="سيُحال التقرير للمدقّق الطبي. هل تريد المتابعة؟"
        tone="warn"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmSubmit(false)}>
              تراجع
            </Button>
            <Button icon={<Send className="size-4" />} onClick={submit}>
              تأكيد الإرسال
            </Button>
          </>
        }
      />
    </div>
  );
}

function PfInfo({
  label,
  value,
  okAr = "سليم",
  noAr = "غير سليم",
}: {
  label: string;
  value: PassFail;
  okAr?: string;
  noAr?: string;
}) {
  const ok = value === "passed";
  return (
    <div>
      <dt className="text-[12px] text-[var(--ink-50)]">{label}</dt>
      <dd
        className={`mt-0.5 inline-flex items-center gap-1 text-[14px] font-semibold ${
          ok ? "text-[var(--ok-700)]" : "text-[var(--err-700)]"
        }`}
      >
        {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        {ok ? okAr : noAr}
      </dd>
    </div>
  );
}

function Info({
  label,
  value,
  ltr,
  icon,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[12px] text-[var(--ink-50)]">{label}</dt>
      <dd
        className={`mt-0.5 flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ink-90)] ${
          ltr ? "num" : ""
        }`}
      >
        {icon}
        {value}
      </dd>
    </div>
  );
}

function Row({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--ink-50)]">{label}</span>
      <span
        className={`text-end font-medium text-[var(--ink-80)] ${ltr ? "num" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
