import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/hms/Shell";
import { ReportForm } from "@/components/hms/ReportForm";
import { NotFound } from "@/components/hms/States";
import { getReport, type Report } from "@/data/reports";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { can } from "@/lib/permissions";

export const Route = createFileRoute("/_app/hunting-medical/$id/edit")({
  component: EditReportPage,
});

function EditReportPage() {
  const { id } = useParams({ from: "/_app/hunting-medical/$id/edit" });
  const user = useCurrentUser();
  const [report, setReport] = useState<Report | null | undefined>(undefined);

  useEffect(() => {
    setReport(getReport(id) ?? null);
  }, [id]);

  if (!user || report === undefined) return null;
  if (report === null) return <NotFound />;
  if (!can(user, "report:edit", report)) {
    return <Navigate to="/hunting-medical/$id" params={{ id }} />;
  }

  return (
    <div>
      <PageHeader
        title="تعديل التقرير الطبي"
        subtitle={report.applicant.name}
        breadcrumb={[
          { label: "الرئيسية", to: "/dashboard" },
          { label: "التقارير الطبية", to: "/hunting-medical" },
          { label: report.id },
          { label: "تعديل" },
        ]}
      />
      <ReportForm initial={report} mode="edit" user={user} />
    </div>
  );
}
