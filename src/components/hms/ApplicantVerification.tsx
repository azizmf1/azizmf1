import { useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/hms/Card";
import { Field, TextInput } from "@/components/hms/Field";
import { Button } from "@/components/hms/Button";
import { toast } from "@/components/hms/Toast";
import {
  verifyPatient,
  VERIFICATION_SOURCE,
  type VerifiedPatient,
} from "@/data/patientVerification";

/**
 * خطوة التحقق المستقلة: رقم الهوية + تاريخ الميلاد ← التحقق من النظام الخارجي.
 * عند النجاح تُمرَّر البيانات الموثّقة عبر onVerified للمتابعة.
 */
export function ApplicantVerification({
  onVerified,
}: {
  onVerified: (patient: VerifiedPatient) => void;
}) {
  const [nationalId, setNationalId] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(nationalId)) {
      setError("رقم الهوية يجب أن يتكوّن من 10 أرقام.");
      return;
    }
    if (!dob) {
      setError("تاريخ الميلاد مطلوب.");
      return;
    }
    setLoading(true);
    const res = await verifyPatient(nationalId, dob);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success("تم التحقق من هوية المتقدّم", VERIFICATION_SOURCE);
    onVerified(res.patient);
  };

  return (
    <div className="mx-auto max-w-2xl p-4 lg:p-10">
      <Card>
        <CardHeader
          title="التحقق من هوية المتقدّم"
          subtitle={`تحقق من البيانات عبر ${VERIFICATION_SOURCE} قبل بدء التقرير`}
          icon={<ShieldCheck className="size-5" />}
        />
        <CardBody>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="رقم الهوية" required error={error || undefined}>
                <TextInput
                  ltr
                  value={nationalId}
                  onChange={(e) =>
                    setNationalId(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="10 أرقام"
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
              سيتم جلب <span className="font-semibold text-[var(--ink-80)]">الاسم والجنسية وتاريخ الميلاد</span> من
              النظام الوطني، وتبقى بقية الحقول (الجنس، المدينة، الجوال، فصيلة الدم)
              للإدخال اليدوي.
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
