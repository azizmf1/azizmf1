import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/hms/Shell";
import { ReportForm } from "@/components/hms/ReportForm";
import { emptyReport } from "@/data/reports";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { can } from "@/lib/permissions";

export const Route = createFileRoute("/_app/hunting-medical/new")({
  component: NewReportPage,
});

function NewReportPage() {
  const user = useCurrentUser();
  const initial = useMemo(
    () =>
      user
        ? emptyReport({ id: user.id, name: user.name, org: user.org })
        : null,
    [user],
  );

  if (!user) return null;
  if (!can(user, "report:create")) {
    return <Navigate to="/hunting-medical" />;
  }
  if (!initial) return null;

  return (
    <div>
      <PageHeader
        title="إصدار تقرير طبي جديد"
        subtitle="تعبئة بيانات الفحص الطبي لرخصة الصيد"
        breadcrumb={[
          { label: "التقارير الطبية", to: "/hunting-medical" },
          { label: "تقرير جديد" },
        ]}
      />
      <ReportForm initial={initial} mode="create" user={user} />
    </div>
  );
}
