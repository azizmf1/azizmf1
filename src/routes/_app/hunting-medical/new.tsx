import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/hms/Shell";
import { ReportForm } from "@/components/hms/ReportForm";
import { ApplicantVerification } from "@/components/hms/ApplicantVerification";
import { emptyReport } from "@/data/reports";
import type { VerifiedApplicant } from "@/data/patientVerification";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { can } from "@/lib/permissions";

export const Route = createFileRoute("/_app/hunting-medical/new")({
  component: NewReportPage,
});

function NewReportPage() {
  const user = useCurrentUser();
  const [verified, setVerified] = useState<VerifiedApplicant | null>(null);

  // يُبنى التقرير فقط بعد التحقق، مع حقن البيانات الموثّقة (BRS §6).
  const initial = useMemo(() => {
    if (!user || !verified) return null;
    const report = emptyReport({ id: user.id, name: user.name, org: user.org });
    report.applicant = {
      ...report.applicant,
      idType: verified.idType,
      nationalId: verified.idNumber,
      name: verified.fullNameAr,
      fullNameEn: verified.fullNameEn,
      nationality: verified.nationality,
      gender: verified.gender,
      dob: verified.dob,
    };
    return report;
  }, [user, verified]);

  if (!user) return null;
  if (!can(user, "report:create")) {
    return <Navigate to="/hunting-medical" />;
  }

  return (
    <div>
      <PageHeader
        title="إصدار تقرير طبي جديد"
        subtitle={
          verified
            ? "استكمال بيانات الفحص الطبي"
            : "الخطوة 1 من 2 — التحقق من هوية المتقدّم"
        }
        breadcrumb={[
          { label: "التقارير الطبية", to: "/hunting-medical" },
          { label: "تقرير جديد" },
        ]}
      />
      {initial ? (
        <ReportForm initial={initial} mode="create" user={user} lockApplicant />
      ) : (
        <ApplicantVerification onVerified={setVerified} />
      )}
    </div>
  );
}
