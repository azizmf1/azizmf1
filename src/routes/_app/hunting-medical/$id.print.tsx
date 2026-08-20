import {
  createFileRoute,
  Link,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Printer } from "lucide-react";
import { Button } from "@/components/hms/Button";
import { NotFound } from "@/components/hms/States";
import {
  emptyEligibility,
  emptyVisualAcuity,
  getReport,
  isReportExpired,
  type Report,
} from "@/data/reports";
import {
  CITIES,
  GENDERS,
  ID_TYPES,
  NATIONALITIES,
  VISION_LEVELS,
  lookupLabel,
} from "@/data/lookups";
import { age, fmtDate, fmtDateTime } from "@/lib/format";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import sehaLogo from "@/assets/seha-logo.png";
import sehaMark from "@/assets/seha-mark.png";

export const Route = createFileRoute("/_app/hunting-medical/$id/print")({
  component: PrintPage,
});

function PrintPage() {
  const { id } = useParams({ from: "/_app/hunting-medical/$id/print" });
  const user = useCurrentUser();
  const [report, setReport] = useState<Report | null | undefined>(undefined);

  useEffect(() => {
    setReport(getReport(id) ?? null);
  }, [id]);

  if (!user || report === undefined) return null;
  if (report === null) return <NotFound />;

  // UC07/OQ-13: الطباعة متاحة فقط للتقارير المكتملة السارية.
  if (report.status !== "completed" || isReportExpired(report)) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-[14px] font-semibold text-[var(--ink-80)]">
          الطباعة متاحة فقط للتقارير المكتملة السارية الصلاحية.
        </p>
        <Link
          to="/hunting-medical/$id"
          params={{ id: report.id }}
          className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--brand-90)] hover:underline"
        >
          <ArrowRight className="size-4 rtl-flip" /> رجوع للتقرير
        </Link>
      </div>
    );
  }

  const fit = report.result === "fit";

  return (
    <div className="min-h-screen bg-[var(--ink-10)] py-8">
      {/* شريط أدوات — يختفي عند الطباعة */}
      <div className="no-print mx-auto mb-6 flex max-w-[820px] items-center justify-between px-4">
        <Link
          to="/hunting-medical/$id"
          params={{ id: report.id }}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--ink-70)] hover:text-[var(--brand-90)]"
        >
          <ArrowRight className="size-4 rtl-flip" /> رجوع للتقرير
        </Link>
        <Button icon={<Printer className="size-4" />} onClick={() => window.print()}>
          طباعة التقرير
        </Button>
      </div>

      {/* ورقة A4 */}
      <div className="print-area mx-auto max-w-[820px] bg-white px-12 py-10 shadow-[var(--shadow-md)]">
        {/* الترويسة */}
        <header className="print-block flex items-start justify-between border-b-2 border-[var(--brand-90)] pb-5">
          <div>
            <img src={sehaLogo} alt="منصة صحة" className="h-12 w-auto" />
            <h1 className="mt-3 text-[20px] font-extrabold text-[var(--brand-90)]">
              التقرير الطبي لرخصة الصيد
            </h1>
            <p className="text-[12px] text-[var(--ink-60)]">
              منصة صحة — وزارة الصحة
            </p>
          </div>
          <div className="text-end">
            <div className="num text-[13px] font-bold text-[var(--ink-90)]">
              {report.id}
            </div>
            <div className="num mt-1 text-[11px] text-[var(--ink-60)]">
              تاريخ الإصدار: {fmtDate(report.decidedAt ?? report.updatedAt)}
            </div>
            <div
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
                fit
                  ? "bg-[var(--ok-50)] text-[var(--ok-700)]"
                  : "bg-[var(--err-50)] text-[var(--err-700)]"
              }`}
            >
              {report.result
                ? fit
                  ? "لائق طبيًا"
                  : "غير لائق"
                : "غير محدد"}
            </div>
          </div>
        </header>

        {/* بيانات المراجع */}
        <PrintSection title="بيانات المراجع">
          <div className="grid grid-cols-3 gap-y-3">
            <PItem
              label="نوع الهوية"
              value={lookupLabel(ID_TYPES, report.applicant.idType ?? "")}
            />
            <PItem label="رقم الهوية" value={report.applicant.nationalId} ltr />
            <PItem label="العمر" value={age(report.applicant.dob)} />
            <PItem label="الاسم (عربي)" value={report.applicant.name} />
            <PItem
              label="الاسم (إنجليزي)"
              value={report.applicant.fullNameEn || "—"}
              ltr
            />
            <PItem
              label="الجنس"
              value={lookupLabel(GENDERS, report.applicant.gender)}
            />
            <PItem
              label="الجنسية"
              value={lookupLabel(NATIONALITIES, report.applicant.nationality)}
            />
            <PItem
              label="المدينة"
              value={lookupLabel(CITIES, report.applicant.city)}
            />
            <PItem
              label="فصيلة الدم"
              value={report.applicant.bloodType || "—"}
              ltr
            />
          </div>
        </PrintSection>

        {/* فحص حدّة الإبصار */}
        <PrintSection title="فحص حدّة الإبصار">
          {(() => {
            const v = report.visualAcuity ?? emptyVisualAcuity();
            const pf = (x: string) => (x === "passed" ? "سليم" : "غير سليم");
            return (
              <div className="grid grid-cols-3 gap-y-3">
                <PItem label="نظر العين اليمنى" value={pf(v.visionRight)} />
                <PItem label="نظر العين اليسرى" value={pf(v.visionLeft)} />
                <PItem
                  label="عمى الألوان"
                  value={v.colorVision === "passed" ? "سليم" : "مصاب"}
                />
                <PItem
                  label="مستوى الإبصار — يمين"
                  value={lookupLabel(VISION_LEVELS, v.levelRight)}
                />
                <PItem
                  label="مستوى الإبصار — يسار"
                  value={lookupLabel(VISION_LEVELS, v.levelLeft)}
                />
                <div />
                <PItem
                  label="مع التصحيح — يمين"
                  value={lookupLabel(VISION_LEVELS, v.correctedRight)}
                />
                <PItem
                  label="مع التصحيح — يسار"
                  value={lookupLabel(VISION_LEVELS, v.correctedLeft)}
                />
              </div>
            );
          })()}
        </PrintSection>

        {/* فحص الأهلية */}
        <PrintSection title="فحص الأهلية">
          {(() => {
            const el = report.eligibility ?? emptyEligibility();
            const pf = (x: string) => (x === "passed" ? "سليم" : "غير سليم");
            return (
              <div className="grid grid-cols-3 gap-y-3">
                <PItem label="الصحة النفسية" value={pf(el.mentalHealth)} />
                <PItem label="صحة الجسد" value={pf(el.bodyHealth)} />
              </div>
            );
          })()}
        </PrintSection>

        {/* القرار الطبي */}
        <PrintSection title="النتيجة النهائية">
          <div className="text-[13px] font-bold text-[var(--ink-90)]">
            {report.result
              ? report.result === "fit"
                ? "لائق طبيًا"
                : "غير لائق"
              : "غير محدد"}
          </div>
          {report.result === "unfit" && (
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-7 text-[var(--ink-80)]">
              مبرّر عدم اللياقة: {report.notFitJustification || "—"}
            </p>
          )}
        </PrintSection>

        {/* التوقيعات */}
        <div className="print-block mt-10 grid grid-cols-2 gap-8">
          <Sign label="الطبيب المعالج" name={report.doctor.name} org={report.doctor.org} />
          <Sign
            label="المدقّق الطبي"
            name={report.auditor?.name ?? "—"}
            org="الإدارة الطبية — صحة"
          />
        </div>

        {/* تذييل */}
        <footer className="print-block mt-10 flex items-center justify-between border-t border-[var(--ink-20)] pt-4 text-[10px] text-[var(--ink-50)]">
          <span className="num">
            تم الإصدار إلكترونيًا عبر منصة صحة · {fmtDateTime(report.updatedAt)}
          </span>
          <img src={sehaMark} alt="" className="h-6 w-auto opacity-70" />
        </footer>
      </div>
    </div>
  );
}

function PrintSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-block mt-6">
      <h2 className="mb-3 bg-[var(--ink-10)] px-3 py-1.5 text-[13px] font-bold text-[var(--brand-90)]">
        {title}
      </h2>
      <div className="px-1">{children}</div>
    </section>
  );
}

function PItem({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] text-[var(--ink-50)]">{label}</div>
      <div
        className={`text-[13px] font-semibold text-[var(--ink-90)] ${ltr ? "num" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function Sign({
  label,
  name,
  org,
}: {
  label: string;
  name: string;
  org: string;
}) {
  return (
    <div>
      <div className="text-[11px] text-[var(--ink-50)]">{label}</div>
      <div className="mt-8 border-t border-dashed border-[var(--ink-30)] pt-2">
        <div className="text-[13px] font-bold text-[var(--ink-90)]">{name}</div>
        <div className="text-[11px] text-[var(--ink-60)]">{org}</div>
      </div>
    </div>
  );
}
