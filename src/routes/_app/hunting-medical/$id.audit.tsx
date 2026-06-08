import {
  createFileRoute,
  Link,
  Navigate,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/hms/Shell";
import { Card, CardBody, CardHeader } from "@/components/hms/Card";
import { Button } from "@/components/hms/Button";
import { Field, TextArea } from "@/components/hms/Field";
import { ResultBadge, StatusBadge } from "@/components/hms/Badges";
import { Modal } from "@/components/hms/Modal";
import { NotFound } from "@/components/hms/States";
import { toast } from "@/components/hms/Toast";
import {
  appendTimeline,
  getReport,
  saveReport,
  type Report,
} from "@/data/reports";
import {
  EXAM_ITEMS,
  LICENSE_TYPES,
  lookupLabel,
} from "@/data/lookups";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { can } from "@/lib/permissions";
import { msg } from "@/data/messages";

export const Route = createFileRoute("/_app/hunting-medical/$id/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { id } = useParams({ from: "/_app/hunting-medical/$id/audit" });
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState("");
  const [dialog, setDialog] = useState<null | "approve" | "return">(null);

  useEffect(() => {
    setReport(getReport(id) ?? null);
  }, [id]);

  if (!user || report === undefined) return null;
  if (report === null) return <NotFound />;
  if (!can(user, "report:audit", report)) {
    return <Navigate to="/hunting-medical/$id" params={{ id }} />;
  }

  const decide = (decision: "approve" | "return") => {
    if (decision === "return" && !note.trim()) {
      setNoteErr("ملاحظة الإعادة إلزامية.");
      setDialog(null);
      return;
    }
    const now = new Date().toISOString();
    const base: Report = {
      ...report,
      auditor: { id: user.id, name: user.name },
      decidedAt: now,
      updatedAt: now,
    };
    const next =
      decision === "approve"
        ? appendTimeline(
            { ...base, status: "approved" },
            {
              at: now,
              actorId: user.id,
              actorName: user.name,
              action: "اعتماد التقرير",
              note: note.trim() || undefined,
            },
          )
        : appendTimeline(
            { ...base, status: "returned", auditNote: note.trim() },
            {
              at: now,
              actorId: user.id,
              actorName: user.name,
              action: "إعادة للتعديل",
              note: note.trim(),
            },
          );
    saveReport(next);
    setDialog(null);
    toast.success(decision === "approve" ? msg("MSG08") : msg("MSG09"));
    navigate({ to: "/hunting-medical/$id", params: { id } });
  };

  return (
    <div>
      <PageHeader
        title="تدقيق التقرير الطبي"
        subtitle={`${report.id} · ${report.applicant.name}`}
        breadcrumb={[
          { label: "الرئيسية", to: "/dashboard" },
          { label: "التقارير الطبية", to: "/hunting-medical" },
          { label: report.id, to: undefined },
          { label: "تدقيق" },
        ]}
      />

      <div className="grid gap-6 p-4 lg:grid-cols-[1fr_340px] lg:p-10">
        {/* ملخّص للمراجعة */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="ملخّص المتقدّم"
              icon={<UserRound className="size-5" />}
              action={<StatusBadge status={report.status} />}
            />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Item label="الاسم" value={report.applicant.name} />
                <Item label="رقم الهوية" value={report.applicant.nationalId} ltr />
                <Item
                  label="نوع الرخصة"
                  value={lookupLabel(LICENSE_TYPES, report.licenseType)}
                />
                <Item label="الجوال" value={report.applicant.phone} ltr />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="نتائج الفحص"
              icon={<Stethoscope className="size-5" />}
              action={<ResultBadge result={report.result} />}
            />
            <CardBody>
              <ul className="grid gap-2 sm:grid-cols-2">
                {report.exams.map((ex) => {
                  const def = EXAM_ITEMS.find((x) => x.key === ex.key);
                  const ok = ex.value === "passed";
                  return (
                    <li
                      key={ex.key}
                      className="flex items-center justify-between rounded-[var(--r-md)] border border-[var(--ink-20)] px-3 py-2"
                    >
                      <span className="text-[13px] text-[var(--ink-80)]">
                        {def?.label ?? ex.key}
                      </span>
                      <span
                        className={`text-[12px] font-semibold ${
                          ok ? "text-[var(--ok-700)]" : "text-[var(--err-700)]"
                        }`}
                      >
                        {ok ? "سليم" : "غير سليم"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 rounded-[var(--r-md)] bg-[var(--ink-10)] p-3">
                <div className="text-[12px] text-[var(--ink-50)]">التوصية</div>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-7 text-[var(--ink-80)]">
                  {report.recommendation || "—"}
                </p>
              </div>
              <Link
                to="/hunting-medical/$id"
                params={{ id: report.id }}
                className="mt-3 inline-block text-[13px] font-medium text-[var(--brand-90)] hover:underline"
              >
                عرض التقرير الكامل
              </Link>
            </CardBody>
          </Card>
        </div>

        {/* قرار التدقيق */}
        <aside>
          <div className="sticky top-24">
            <Card>
              <CardHeader title="قرار التدقيق" />
              <CardBody className="space-y-4">
                <Field
                  label="ملاحظات المدقّق"
                  hint="إلزامية عند الإعادة، اختيارية عند الاعتماد."
                  error={noteErr || undefined}
                >
                  <TextArea
                    rows={5}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      setNoteErr("");
                    }}
                    placeholder="اكتب ملاحظاتك هنا…"
                    invalid={!!noteErr}
                  />
                </Field>
                <Button
                  block
                  variant="success"
                  icon={<CheckCircle2 className="size-4" />}
                  onClick={() => setDialog("approve")}
                >
                  اعتماد التقرير
                </Button>
                <Button
                  block
                  variant="danger"
                  icon={<RotateCcw className="size-4" />}
                  onClick={() => {
                    if (!note.trim()) {
                      setNoteErr("ملاحظة الإعادة إلزامية.");
                      return;
                    }
                    setDialog("return");
                  }}
                >
                  إعادة للتعديل
                </Button>
              </CardBody>
            </Card>
          </div>
        </aside>
      </div>

      <Modal
        open={dialog === "approve"}
        onClose={() => setDialog(null)}
        title="اعتماد التقرير"
        description="سيتم اعتماد التقرير نهائيًا وإتاحته للطباعة. هل تريد المتابعة؟"
        tone="success"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              تراجع
            </Button>
            <Button variant="success" onClick={() => decide("approve")}>
              تأكيد الاعتماد
            </Button>
          </>
        }
      />
      <Modal
        open={dialog === "return"}
        onClose={() => setDialog(null)}
        title="إعادة التقرير للتعديل"
        description="ستُعاد التقرير للطبيب مع ملاحظاتك. هل تريد المتابعة؟"
        tone="danger"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              تراجع
            </Button>
            <Button variant="danger" onClick={() => decide("return")}>
              تأكيد الإعادة
            </Button>
          </>
        }
      />
    </div>
  );
}

function Item({
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
      <dt className="text-[12px] text-[var(--ink-50)]">{label}</dt>
      <dd
        className={`mt-0.5 text-[14px] font-semibold text-[var(--ink-90)] ${ltr ? "num" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
