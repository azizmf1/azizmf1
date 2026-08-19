import { useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/hms/Card";
import { Field, Select, TextInput } from "@/components/hms/Field";
import { Button } from "@/components/hms/Button";
import { toast } from "@/components/hms/Toast";
import { ID_TYPES } from "@/data/lookups";
import type { IdType } from "@/data/reports";
import { brsMsg } from "@/data/brsMessages";
import {
  verifyApplicant,
  isValidIdNumber,
  VERIFICATION_SOURCE,
  type VerifiedApplicant,
} from "@/data/patientVerification";

/**
 * خطوة التحقق (BRS §6): نوع الهوية + رقم الهوية + تاريخ الميلاد ← استعلام السجل الوطني.
 * عند النجاح تُمرَّر البيانات الموثّقة (الاسم عربي/إنجليزي، الجنسية، الجنس) عبر onVerified.
 */
export function ApplicantVerification({
  onVerified,
}: {
  onVerified: (applicant: VerifiedApplicant) => void;
}) {
  const [idType, setIdType] = useState<IdType>("citizen");
  const [idNumber, setIdNumber] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const gcc = idType === "gcc";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidIdNumber(idType, idNumber)) {
      setError(brsMsg("MSG04"));
      return;
    }
    if (!dob) {
      setError(brsMsg("MSG04"));
      return;
    }
    setLoading(true);
    const res = await verifyApplicant(idType, idNumber, dob);
    setLoading(false);
    if (!res.ok) {
      setError(brsMsg(res.messageId));
      toast.error(brsMsg(res.messageId));
      return;
    }
    toast.success(brsMsg("MSG00"), VERIFICATION_SOURCE);
    onVerified(res.applicant);
  };

  return (
    <div className="mx-auto max-w-2xl p-4 lg:p-10">
      <Card>
        <CardHeader
          title="التحقق من هوية المراجع"
          subtitle={`استعلام البيانات من ${VERIFICATION_SOURCE} قبل بدء التقرير`}
          icon={<ShieldCheck className="size-5" />}
        />
        <CardBody>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="نوع الهوية" required>
                <Select
                  value={idType}
                  onChange={(e) => {
                    setIdType(e.target.value as IdType);
                    setIdNumber("");
                    setError("");
                  }}
                  options={ID_TYPES}
                />
              </Field>
              <Field label="رقم الهوية" required error={error || undefined}>
                <TextInput
                  ltr
                  value={idNumber}
                  onChange={(e) =>
                    setIdNumber(
                      gcc
                        ? e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 20)
                        : e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder={gcc ? "حتى 20 خانة" : "10 أرقام"}
                  invalid={!!error}
                  autoFocus
                />
              </Field>
              <Field label="تاريخ الميلاد" required>
                <TextInput
                  ltr
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  invalid={!!error}
                />
              </Field>
            </div>

            <div className="rounded-[var(--r-md)] bg-[var(--ink-10)] px-3 py-2.5 text-[12px] leading-6 text-[var(--ink-60)]">
              سيتم جلب{" "}
              <span className="font-semibold text-[var(--ink-80)]">
                الاسم (عربي/إنجليزي) والجنسية والجنس
              </span>{" "}
              من السجل الوطني، وتبقى بقية الحقول للإدخال اليدوي.
            </div>

            <Button
              type="submit"
              size="lg"
              block
              loading={loading}
              icon={<BadgeCheck className="size-4" />}
            >
              تحقّق ومتابعة
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
