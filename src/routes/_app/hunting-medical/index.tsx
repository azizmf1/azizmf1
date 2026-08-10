import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus2,
  Filter,
  Pencil,
  Search,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/hms/Shell";
import { Card } from "@/components/hms/Card";
import { Button } from "@/components/hms/Button";
import { Select, TextInput } from "@/components/hms/Field";
import { StatusBadge, ResultBadge } from "@/components/hms/Badges";
import { listReports, type Report } from "@/data/reports";
import {
  LICENSE_TYPES,
  STATUSES,
  STATUS_ORDER,
  lookupLabel,
  type ReportStatus,
} from "@/data/lookups";
import { fmtDate } from "@/lib/format";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { can } from "@/lib/permissions";

export const Route = createFileRoute("/_app/hunting-medical/")({
  component: ReportsListPage,
});

const PAGE_SIZE = 8;

function ReportsListPage() {
  const user = useCurrentUser();
  const [all, setAll] = useState<Report[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [license, setLicense] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => setAll(listReports()), []);

  const filtered = useMemo(() => {
    return all.filter((r) => {
      const text = `${r.applicant.name} ${r.applicant.nationalId} ${r.id}`;
      const okQ = q.trim() === "" || text.includes(q.trim());
      const okS = status === "" || r.status === status;
      const okL = license === "" || r.licenseType === license;
      return okQ && okS && okL;
    });
  }, [all, q, status, license]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const isAuditor = user?.role === "auditor";

  const statusOptions = [
    { value: "", label: "كل الحالات" },
    ...STATUS_ORDER.map((s) => ({ value: s, label: STATUSES[s].ar })),
  ];
  const licenseOptions = [
    { value: "", label: "كل أنواع الرخص" },
    ...LICENSE_TYPES,
  ];

  return (
    <div>
      <PageHeader
        title="التقارير الطبية لرخص الصيد"
        subtitle="استعراض وإدارة التقارير الطبية"
        breadcrumb={[
          { label: "التقارير الطبية" },
        ]}
        action={
          user && can(user, "report:create") ? (
            <Link to="/hunting-medical/new">
              <Button icon={<FilePlus2 className="size-4" />}>تقرير جديد</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="space-y-4 p-4 lg:p-10">
        {/* الفلاتر */}
        <Card>
          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-2">
              <Filter className="size-4 shrink-0 text-[var(--ink-50)]" />
              <span className="hidden text-[13px] font-medium text-[var(--ink-70)] sm:inline">
                تصفية:
              </span>
            </div>
            <div className="grid flex-[3] grid-cols-1 gap-3 sm:grid-cols-3">
              <TextInput
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="بحث بالاسم أو الهوية أو المعرّف"
                addonStart={<Search className="size-4" />}
              />
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                options={statusOptions}
              />
              <Select
                value={license}
                onChange={(e) => {
                  setLicense(e.target.value);
                  setPage(1);
                }}
                options={licenseOptions}
              />
            </div>
          </div>
        </Card>

        {/* الجدول */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-[13px]">
              <thead>
                <tr className="border-b border-[var(--ink-20)] bg-[var(--ink-10)] text-[12px] text-[var(--ink-60)]">
                  <th className="px-4 py-3 text-start font-semibold">المعرّف</th>
                  <th className="px-4 py-3 text-start font-semibold">المتقدّم</th>
                  <th className="hidden px-4 py-3 text-start font-semibold md:table-cell">
                    رقم الهوية
                  </th>
                  <th className="hidden px-4 py-3 text-start font-semibold lg:table-cell">
                    نوع الرخصة
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                  <th className="hidden px-4 py-3 text-start font-semibold sm:table-cell">
                    النتيجة
                  </th>
                  <th className="hidden px-4 py-3 text-start font-semibold lg:table-cell">
                    آخر تحديث
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
                    <td className="px-4 py-3 font-medium text-[var(--ink-90)]">
                      {r.applicant.name}
                    </td>
                    <td className="num hidden px-4 py-3 text-[var(--ink-70)] md:table-cell">
                      {r.applicant.nationalId}
                    </td>
                    <td className="hidden px-4 py-3 text-[var(--ink-70)] lg:table-cell">
                      {lookupLabel(LICENSE_TYPES, r.licenseType)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <ResultBadge result={r.result} size="sm" />
                    </td>
                    <td className="num hidden whitespace-nowrap px-4 py-3 text-[var(--ink-60)] lg:table-cell">
                      {fmtDate(r.updatedAt)}
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
                        {user && can(user, "report:edit", r) && (
                          <Link
                            to="/hunting-medical/$id/edit"
                            params={{ id: r.id }}
                            className="rounded-[var(--r-md)] p-2 text-[var(--ink-60)] hover:bg-[var(--brand-10)] hover:text-[var(--brand-90)]"
                            title="تعديل"
                          >
                            <Pencil className="size-4" />
                          </Link>
                        )}
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
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-16 text-center text-[14px] text-[var(--ink-60)]"
                    >
                      لا توجد تقارير مطابقة لمعايير البحث.
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
                {Math.min(current * PAGE_SIZE, filtered.length)} من{" "}
                {filtered.length}
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
