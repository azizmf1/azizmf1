import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus2,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/hms/Shell";
import { Card } from "@/components/hms/Card";
import { Button } from "@/components/hms/Button";
import { Field, Select, TextInput } from "@/components/hms/Field";
import { StatusBadge, ResultBadge } from "@/components/hms/Badges";
import { listReports, type Report } from "@/data/reports";
import {
  CITIES,
  NATIONALITIES,
  STATUSES,
  STATUS_ORDER,
  lookupLabel,
} from "@/data/lookups";
import { fmtDate } from "@/lib/format";
import { brsMsg } from "@/data/brsMessages";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { can } from "@/lib/permissions";

export const Route = createFileRoute("/_app/hunting-medical/")({
  component: ReportsListPage,
});

const PAGE_SIZE = 8;

const EMPTY = {
  code: "",
  idn: "",
  name: "",
  nationality: "",
  result: "",
  status: "",
  from: "",
  to: "",
  city: "",
  mc: "",
};
type Filters = typeof EMPTY;

function ReportsListPage() {
  const user = useCurrentUser();
  const [all, setAll] = useState<Report[]>([]);
  const [form, setForm] = useState<Filters>(EMPTY); // مدخلات لوحة البحث
  const [applied, setApplied] = useState<Filters>(EMPTY); // ما يُطبَّق عند الضغط
  const [page, setPage] = useState(1);

  useEffect(() => setAll(listReports()), []);

  const isAdmin = user?.role === "admin";
  const isAuditor = user?.role === "auditor";
  const today = new Date().toISOString().slice(0, 10);

  // BR-SCOPE-DRAFT: المسودات تظهر لمدخل البيانات فقط (المدقّق لا يراها).
  const scoped = useMemo(
    () => (isAuditor ? all.filter((r) => r.status !== "draft") : all),
    [all, isAuditor],
  );

  const filtered = useMemo(() => {
    const f = applied;
    return scoped.filter((r) => {
      const dateApproved = (r.decidedAt ?? "").slice(0, 10);
      return (
        (f.code === "" || r.id.includes(f.code.trim())) &&
        (f.idn === "" || r.applicant.nationalId.includes(f.idn.trim())) &&
        (f.name === "" || r.applicant.name.includes(f.name.trim())) &&
        (f.nationality === "" || r.applicant.nationality === f.nationality) &&
        (f.result === "" || r.result === f.result) &&
        (f.status === "" || r.status === f.status) &&
        (f.city === "" || r.applicant.city === f.city) &&
        (f.mc === "" || r.doctor.org === f.mc) &&
        (f.from === "" || (dateApproved !== "" && dateApproved >= f.from)) &&
        (f.to === "" || (dateApproved !== "" && dateApproved <= f.to))
      );
    });
  }, [scoped, applied]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const set = <K extends keyof Filters>(k: K, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const statusOptions = [
    { value: "", label: "كل الحالات" },
    ...STATUS_ORDER.map((s) => ({ value: s, label: STATUSES[s].ar })),
  ];
  const resultOptions = [
    { value: "", label: "كل النتائج" },
    { value: "fit", label: "لائق" },
    { value: "unfit", label: "غير لائق" },
  ];
  const nationalityOptions = [{ value: "", label: "الكل" }, ...NATIONALITIES];
  const cityOptions = [{ value: "", label: "الكل" }, ...CITIES];
  const mcOptions = [
    { value: "", label: "الكل" },
    ...Array.from(new Set(all.map((r) => r.doctor.org))).map((o) => ({
      value: o,
      label: o,
    })),
  ];

  const colCount = isAdmin ? 9 : 7;
  const emptyMsg =
    scoped.length === 0 ? brsMsg("MSG01") : brsMsg("MSG02");

  return (
    <div>
      <PageHeader
        title="التقارير الطبية لرخص الصيد"
        subtitle="استعراض وإدارة التقارير الطبية"
        breadcrumb={[{ label: "التقارير الطبية" }]}
        action={
          user && can(user, "report:create") ? (
            <Link to="/hunting-medical/new">
              <Button icon={<FilePlus2 className="size-4" />}>
                إنشاء تقرير جديد
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="space-y-4 p-4 lg:p-10">
        {/* لوحة البحث — UC01 §5 */}
        <Card>
          <form
            className="p-4"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(form);
              setPage(1);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="رمز التقرير الطبي">
                <TextInput
                  ltr
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="HLR…"
                  addonStart={<Search className="size-4" />}
                />
              </Field>
              <Field label="رقم المعرف الشخصي">
                <TextInput
                  ltr
                  value={form.idn}
                  onChange={(e) => set("idn", e.target.value)}
                />
              </Field>
              <Field label="اسم صاحب الفحص">
                <TextInput
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="الجنسية">
                <Select
                  value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)}
                  options={nationalityOptions}
                />
              </Field>
              <Field label="نتيجة الفحص النهائية">
                <Select
                  value={form.result}
                  onChange={(e) => set("result", e.target.value)}
                  options={resultOptions}
                />
              </Field>
              <Field label="حالة التقرير الطبي">
                <Select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  options={statusOptions}
                />
              </Field>
              {isAdmin && (
                <>
                  <Field label="المدينة">
                    <Select
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      options={cityOptions}
                    />
                  </Field>
                  <Field label="اسم المنشأة الطبية">
                    <Select
                      value={form.mc}
                      onChange={(e) => set("mc", e.target.value)}
                      options={mcOptions}
                    />
                  </Field>
                </>
              )}
              <Field label="من تاريخ اعتماد التقرير">
                <TextInput
                  ltr
                  type="date"
                  max={today}
                  value={form.from}
                  onChange={(e) => set("from", e.target.value)}
                />
              </Field>
              <Field label="إلى تاريخ اعتماد التقرير">
                <TextInput
                  ltr
                  type="date"
                  max={today}
                  value={form.to}
                  onChange={(e) => set("to", e.target.value)}
                />
              </Field>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button type="submit" icon={<Search className="size-4" />}>
                بحث
              </Button>
              <Button
                type="button"
                variant="secondary"
                icon={<RotateCcw className="size-4" />}
                onClick={() => {
                  setForm(EMPTY);
                  setApplied(EMPTY);
                  setPage(1);
                }}
              >
                تفريغ حقول البحث
              </Button>
            </div>
          </form>
        </Card>

        {/* الجدول */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-[13px]">
              <thead>
                <tr className="border-b border-[var(--ink-20)] bg-[var(--ink-10)] text-[12px] text-[var(--ink-60)]">
                  <th className="px-4 py-3 text-start font-semibold">رمز التقرير الطبي</th>
                  <th className="hidden px-4 py-3 text-start font-semibold md:table-cell">
                    رقم الهوية / الإقامة
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">اسم صاحب الفحص</th>
                  {isAdmin && (
                    <>
                      <th className="hidden px-4 py-3 text-start font-semibold lg:table-cell">
                        المدينة
                      </th>
                      <th className="hidden px-4 py-3 text-start font-semibold lg:table-cell">
                        اسم المنشأة الطبية
                      </th>
                    </>
                  )}
                  <th className="hidden px-4 py-3 text-start font-semibold sm:table-cell">
                    النتيجة النهائية
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="hidden px-4 py-3 text-start font-semibold lg:table-cell">
                    تاريخ اعتماد التقرير
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink-10)]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--ink-10)]/60">
                    <td className="num whitespace-nowrap px-4 py-3 font-semibold text-[var(--brand-90)]">
                      {r.id}
                    </td>
                    <td className="num hidden px-4 py-3 text-[var(--ink-70)] md:table-cell">
                      {r.applicant.nationalId}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--ink-90)]">
                      {r.applicant.name}
                    </td>
                    {isAdmin && (
                      <>
                        <td className="hidden px-4 py-3 text-[var(--ink-70)] lg:table-cell">
                          {lookupLabel(CITIES, r.applicant.city)}
                        </td>
                        <td className="hidden px-4 py-3 text-[var(--ink-70)] lg:table-cell">
                          {r.doctor.org}
                        </td>
                      </>
                    )}
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <ResultBadge result={r.result} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="num hidden whitespace-nowrap px-4 py-3 text-[var(--ink-60)] lg:table-cell">
                      {r.decidedAt ? fmtDate(r.decidedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to="/hunting-medical/$id"
                          params={{ id: r.id }}
                          className="rounded-[var(--r-md)] p-2 text-[var(--ink-60)] hover:bg-[var(--brand-10)] hover:text-[var(--brand-90)]"
                          title="عرض"
                        >
                          <Eye className="size-4" />
                        </Link>
                        {isAuditor && can(user, "report:audit", r) && (
                          <Link
                            to="/hunting-medical/$id/audit"
                            params={{ id: r.id }}
                            className="rounded-[var(--r-md)] p-2 text-[var(--brand-90)] hover:bg-[var(--brand-10)]"
                            title="تدقيق"
                          >
                            <ShieldCheck className="size-4" />
                          </Link>
                        )}
                        {r.status === "completed" && (
                          <Link
                            to="/hunting-medical/$id/print"
                            params={{ id: r.id }}
                            className="rounded-[var(--r-md)] p-2 text-[var(--ink-60)] hover:bg-[var(--brand-10)] hover:text-[var(--brand-90)]"
                            title="طباعة"
                          >
                            <Printer className="size-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={colCount}
                      className="px-4 py-16 text-center text-[14px] text-[var(--ink-60)]"
                    >
                      {emptyMsg}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* الترقيم */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-[var(--ink-20)] px-4 py-3">
              <div className="num text-[12px] text-[var(--ink-60)]">
                عرض {(current - 1) * PAGE_SIZE + 1}–
                {Math.min(current * PAGE_SIZE, filtered.length)} من {filtered.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={current <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-[var(--r-md)] border border-[var(--ink-20)] p-1.5 text-[var(--ink-60)] disabled:opacity-40 enabled:hover:bg-[var(--ink-10)]"
                >
                  <ChevronRight className="size-4" />
                </button>
                <span className="num px-2 text-[13px] font-medium text-[var(--ink-80)]">
                  {current} / {pages}
                </span>
                <button
                  disabled={current >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-[var(--r-md)] border border-[var(--ink-20)] p-1.5 text-[var(--ink-60)] disabled:opacity-40 enabled:hover:bg-[var(--ink-10)]"
                >
                  <ChevronLeft className="size-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
