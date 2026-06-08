import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Fingerprint, Lock, ShieldCheck, User2 } from "lucide-react";
import { Button } from "@/components/hms/Button";
import { Field, TextInput } from "@/components/hms/Field";
import { toast } from "@/components/hms/Toast";
import { findUserByCredentials, toSessionUser, DEMO_USERS } from "@/data/users";
import { isAuthed } from "@/lib/session";
import { msg } from "@/data/messages";
import sehaLogo from "@/assets/seha-logo.png";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && isAuthed()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

const PENDING = "hms_pending";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError(msg("MSG06"));
      return;
    }
    setLoading(true);
    // محاكاة تأخير شبكة بسيط
    setTimeout(() => {
      const user = findUserByCredentials(username, password);
      if (!user) {
        setLoading(false);
        setError(msg("MSG01"));
        toast.error(msg("MSG01"));
        return;
      }
      window.localStorage.setItem(
        PENDING,
        JSON.stringify(toSessionUser(user)),
      );
      toast.info(msg("MSG03"));
      navigate({ to: "/otp" });
    }, 500);
  };

  const quick = (u: string) => {
    setUsername(u);
    setPassword("1234");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* اللوحة التعريفية (الجانب الافتتاحي) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--brand-90)] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--brand-50) 0, transparent 40%), radial-gradient(circle at 80% 80%, var(--brand-70) 0, transparent 45%)",
          }}
        />
        <div className="relative">
          <img
            src={sehaLogo}
            alt="منصة صحة"
            className="h-14 w-auto rounded-lg bg-white/95 p-2"
          />
        </div>
        <div className="relative space-y-4">
          <h2 className="text-[28px] font-extrabold leading-tight">
            التقارير الطبية لرخص الصيد
          </h2>
          <p className="max-w-md text-[15px] leading-7 text-white/85">
            منصة موحّدة لإصدار وتدقيق التقارير الطبية للراغبين في الحصول على رخص
            الصيد، بما يضمن سلامة المتقدّم والالتزام بالمعايير المعتمدة.
          </p>
          <ul className="space-y-2 pt-2 text-[14px] text-white/85">
            {[
              "فحوصات طبية موحّدة ومعتمدة",
              "مسار تدقيق إلكتروني شفّاف",
              "إصدار التقرير وطباعته فورًا",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[var(--brand-20)]" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-[12px] text-white/60">
          منصة صحة معتمدة من قبل وزارة الصحة @ 2026
        </div>
      </div>

      {/* نموذج الدخول */}
      <div className="flex items-center justify-center bg-[var(--ink-10)] px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <img src={sehaLogo} alt="منصة صحة" className="mx-auto h-12 w-auto" />
          </div>
          <div className="rounded-[var(--r-2xl)] border border-[var(--ink-20)] bg-white p-8 shadow-[var(--shadow-md)]">
            <h1 className="text-[22px] font-bold text-[var(--brand-90)]">
              تسجيل الدخول
            </h1>
            <p className="mt-1 text-[14px] text-[var(--ink-60)]">
              أدخل بيانات حسابك للوصول إلى المنصة.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="اسم المستخدم" required>
                <TextInput
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: doctor"
                  autoFocus
                  addonStart={<User2 className="size-4" />}
                  invalid={!!error}
                />
              </Field>
              <Field label="كلمة المرور" required error={error || undefined}>
                <TextInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  addonStart={<Lock className="size-4" />}
                  invalid={!!error}
                />
              </Field>

              <Button type="submit" block size="lg" loading={loading}>
                دخول
              </Button>

              <button
                type="button"
                onClick={() => toast.info(msg("MSG14"))}
                className="flex w-full items-center justify-center gap-2 rounded-[var(--r-md)] border border-[var(--ink-20)] bg-white py-2.5 text-[14px] font-medium text-[var(--ink-70)] transition-colors hover:bg-[var(--ink-10)]"
              >
                <Fingerprint className="size-4" /> الدخول عبر النفاذ الوطني الموحّد
              </button>
            </form>
          </div>

          {/* حسابات تجريبية */}
          <div className="mt-5 rounded-[var(--r-lg)] border border-dashed border-[var(--ink-30)] bg-white/60 p-4">
            <div className="mb-2 text-[12px] font-semibold text-[var(--ink-70)]">
              حسابات تجريبية (كلمة المرور والرمز: <span className="num">1234</span>)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => quick(u.username)}
                  className="rounded-[var(--r-md)] border border-[var(--ink-20)] bg-white px-2 py-2 text-center transition-colors hover:border-[var(--brand-60)] hover:bg-[var(--brand-10)]"
                >
                  <div className="num text-[12px] font-bold text-[var(--brand-90)]">
                    {u.username}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--ink-60)]">
                    {u.role === "doctor"
                      ? "طبيب"
                      : u.role === "auditor"
                        ? "مدقّق"
                        : "مدير"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
