import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  FilePlus2,
  FileText,
  RotateCcw,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/hms/Shell";
import { Card, CardBody, CardHeader } from "@/components/hms/Card";
import { Button } from "@/components/hms/Button";
import { StatusBadge } from "@/components/hms/Badges";
import { listReports, type Report } from "@/data/reports";
import { lookupLabel, LICENSE_TYPES } from "@/data/lookups";
import { fmtDate } from "@/lib/format";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ROLE_LABEL } from "@/data/users";
import { can } from "@/lib/permissions";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useCurrentUser();
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => setReports(listReports()), []);

  const stats = useMemo(() => {
    const by = (s: Report["status"]) =>
      reports.filter((r) => r.status === s).length;
    return {
      total: reports.length,
      pending: by("submitted") + by("under_review"),
      approved: by("approved"),
      returned: by("returned"),
      draft: by("draft"),
    };
  }, [reports]);

  const recent = reports.slice(0, 6);

  const CARDS = [
    {
      label: "إجمالي التقارير",
      value: stats.total,
      icon: ClipboardList,
      tone: "brand",
    },
    {
      label: "بانتظار التدقيق",
      value: stats.pending,
      icon: Clock,
      tone: "warn",
    },
    {
      label: "معتمدة",
      value: stats.approved,
      icon: CheckCircle2,
      tone: "ok",
    },
    {
      label: "مُعادة للتعديل",
      value: stats.returned,
      icon: RotateCcw,
      tone: "err",
    },
  ] as const;

  const TONE: Record<string, string> = {
    brand: "bg-[var(--brand-10)] text-[var(--brand-90)]",
    warn: "bg-[var(--warn-50)] text-[var(--warn-700)]",
    ok: "bg-[var(--ok-50)] text-[var(--ok-700)]",
    err: "bg-[var(--err-50)] text-[var(--err-700)]",
  };

  return (
    <div>
      <PageHeader
        title={`مرحبًا، ${user?.name ?? ""}`}
        subtitle={
          user ? `${ROLE_LABEL[user.role]} · ${user.org}` : "لوحة المعلومات"
        }
        action={
          user && can(user, "report:create") ? (
            <Link to="/hunting-medical/new">
              <Button icon={<FilePlus2 className="size-4" />}>تقرير جديد</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="space-y-6 p-4 lg:p-10">
        {/* الإحصائيات */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label}>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <div className="num text-[28px] font-extrabold text-[var(--ink-90)]">
                      {c.value}
                    </div>
                    <div className="mt-1 text-[13px] text-[var(--ink-60)]">
                      {c.label}
                    </div>
                  </div>
                  <div
                    className={`flex size-12 items-center justify-center rounded-[var(--r-lg)] ${TONE[c.tone]}`}
                  >
                    <Icon className="size-6" strokeWidth={1.8} />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* أحدث التقارير */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title="أحدث التقارير"
                subtitle="آخر التقارير الطبية المسجّلة في النظام"
                icon={<FileText className="size-5" />}
                action={
                  <Link
                    to="/hunting-medical"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--brand-90)] hover:underline"
                  >
                    عرض الكل <ArrowLeft className="size-4 rtl-flip" />
                  </Link>
                }
              />
              <div className="divide-y divide-[var(--ink-10)]">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    to="/hunting-medical/$id"
                    params={{ id: r.id }}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--ink-10)]"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-10)] text-[var(--brand-90)]">
                      <Stethoscope className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-[var(--ink-90)]">
                        {r.applicant.name}
                      </div>
                      <div className="num mt-0.5 text-[12px] text-[var(--ink-60)]">
                        {r.id} · {lookupLabel(LICENSE_TYPES, r.licenseType)}
                      </div>
                    </div>
                    <div className="hidden text-[12px] text-[var(--ink-60)] num sm:block">
                      {fmtDate(r.updatedAt)}
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
                {recent.length === 0 && (
                  <div className="px-5 py-10 text-center text-[14px] text-[var(--ink-60)]">
                    لا توجد تقارير بعد.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* روابط سريعة */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="إجراءات سريعة" />
              <CardBody className="space-y-2.5">
                {user && can(user, "report:create") && (
                  <Link to="/hunting-medical/new" className="block">
                    <Button block variant="secondary" icon={<FilePlus2 className="size-4" />}>
                      إصدار تقرير طبي جديد
                    </Button>
                  </Link>
                )}
                <Link to="/hunting-medical" className="block">
                  <Button block variant="ghost" icon={<ClipboardList className="size-4" />}>
                    قائمة التقارير
                  </Button>
                </Link>
                <Link to="/services" className="block">
                  <Button block variant="ghost" icon={<FileText className="size-4" />}>
                    دليل الخدمات
                  </Button>
                </Link>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="مسوّداتي" />
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="num text-[32px] font-extrabold text-[var(--brand-90)]">
                    {stats.draft}
                  </div>
                  <p className="text-[13px] text-[var(--ink-60)]">
                    مسودة بانتظار الاستكمال والإرسال للتدقيق.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
