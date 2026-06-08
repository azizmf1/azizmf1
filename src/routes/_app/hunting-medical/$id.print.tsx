import {
  createFileRoute,
  Link,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Printer } from "lucide-react";
import { Button } from "@/components/hms/Button";
import { NotFound } from "@/components/hms/States";
import { getReport, type Report } from "@/data/reports";
import {
  CITIES,
  EXAM_ITEMS,
  GENDERS,
  LICENSE_TYPES,
  NATIONALITIES,
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

        {/* بيانات المتقدّم */}
        <PrintSection title="بيانات المتقدّم">
          <div className="grid grid-cols-3 gap-y-3">
            <PItem label="الاسم" value={report.applicant.name} />
            <PItem label="رقم الهوية" value={report.applicant.nationalId} ltr />
            <PItem label="العمر" value={age(report.applicant.dob)} />
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
            <PItem label="الجوال" value={report.applicant.phone} ltr />
            <PItem
              label="فصيلة الدم"
              value={report.applicant.bloodType || "—"}
              ltr
            />
            <PItem
              label="نوع الرخصة"
              value={lookupLabel(LICENSE_TYPES, report.licenseType)}
            />
          </div>
        </PrintSection>

        {/* العلامات الحيوية */}
        <PrintSection title="العلامات الحيوية">
          <div className="grid grid-cols-4 gap-y-3">
            <PItem
              label="الطول"
              value={report.vitals.height ? `${report.vitals.height} سم` : "—"}
              ltr
            />
            <PItem
              label="الوزن"
              value={report.vitals.weight ? `${report.vitals.weight} كجم` : "—"}
              ltr
            />
            <PItem
              label="ضغط الدم"
              value={report.vitals.bloodPressure || "—"}
              ltr
            />
            <PItem
              label="النبض"
              value={report.vitals.pulse || "—"}
              ltr
            />
          </div>
        </PrintSection>

        {/* بنود الفحص */}
        <PrintSection title="نتائج الفحص الطبي">
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              {chunk(report.exams, 2).map((pair, i) => (
                <tr key={i}>
                  {pair.map((ex) => {
                    const def = EXAM_ITEMS.find((x) => x.key === ex.key);
                    const ok = ex.value === "passed";
                    return (
                      <td
                        key={ex.key}
                        className="border border-[var(--ink-20)] px-3 py-2"
                      >
                        <span className="text-[var(--ink-80)]">
                          {def?.label ?? ex.key}
                        </span>
                        <span
                          className={`float-left font-bold ${
                            ok ? "text-[var(--ok-700)]" : "text-[var(--err-700)]"
                          }`}
                        >
                          {ok ? "سليم" : "غير سليم"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </PrintSection>

        {/* النتيجة والتوصية */}
        <PrintSection title="القرار والتوصية الطبية">
          <p className="whitespace-pre-wrap text-[13px] leading-7 text-[var(--ink-80)]">
            {report.recommendation || "—"}
          </p>
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

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
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
