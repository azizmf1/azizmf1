import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/hms/Button";
import { toast } from "@/components/hms/Toast";
import { setSession } from "@/lib/session";
import type { User } from "@/data/users";
import { msg } from "@/data/messages";
import sehaLogo from "@/assets/seha-logo.png";

const PENDING = "hms_pending";
const OTP = "1234";

export const Route = createFileRoute("/otp")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(PENDING)) {
      throw redirect({ to: "/login" });
    }
  },
  component: OtpPage,
});

function OtpPage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const [pending, setPending] = useState<User | null>(null);
  useEffect(() => {
    const raw = window.localStorage.getItem(PENDING);
    if (raw) setPending(JSON.parse(raw) as User);
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i: number, v: string) => {
    const c = v.replace(/\D/g, "").slice(-1);
    setError("");
    setDigits((d) => {
      const next = [...d];
      next[i] = c;
      return next;
    });
    if (c && i < 3) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = digits.join("");
    if (code.length < 4) {
      setError(msg("MSG06"));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (code !== OTP || !pending) {
        setLoading(false);
        setError(msg("MSG02"));
        toast.error(msg("MSG02"));
        setDigits(["", "", "", ""]);
        refs.current[0]?.focus();
        return;
      }
      setSession(pending);
      window.localStorage.removeItem(PENDING);
      toast.success(msg("MSG00"));
      navigate({ to: "/dashboard" });
    }, 500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ink-10)] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src={sehaLogo} alt="منصة صحة" className="mx-auto h-12 w-auto" />
        </div>
        <div className="rounded-[var(--r-2xl)] border border-[var(--ink-20)] bg-white p-8 shadow-[var(--shadow-md)]">
          <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-[var(--brand-10)] text-[var(--brand-90)]">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-[22px] font-bold text-[var(--brand-90)]">
            رمز التحقق
          </h1>
          <p className="mt-1 text-[14px] leading-6 text-[var(--ink-60)]">
            أدخلنا رمزًا مكوّنًا من 4 أرقام إلى جهازك المسجّل
            {pending ? <> الخاص بـ <span className="font-semibold text-[var(--ink-80)]">{pending.name}</span></> : null}.
          </p>

          <form onSubmit={submit} className="mt-6">
            <div className="flex justify-center gap-3" dir="ltr">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={i === 0}
                  className={`num size-14 rounded-[var(--r-md)] border bg-white text-center text-[24px] font-bold text-[var(--ink-90)] outline-none transition-colors focus:border-[var(--brand-60)] focus:ring-2 focus:ring-[var(--brand-60)]/20 ${
                    error ? "border-[var(--err-600)]" : "border-[var(--ink-20)]"
                  }`}
                />
              ))}
            </div>
            {error && (
              <p className="mt-3 text-center text-[12px] text-[var(--err-600)]">
                {error}
              </p>
            )}

            <div className="mt-6 space-y-3">
              <Button type="submit" block size="lg" loading={loading}>
                تأكيد
              </Button>
              <div className="text-center text-[13px] text-[var(--ink-60)]">
                {seconds > 0 ? (
                  <>
                    إعادة الإرسال خلال{" "}
                    <span className="num font-semibold text-[var(--ink-80)]">
                      {seconds}
                    </span>{" "}
                    ثانية
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSeconds(45);
                      toast.info(msg("MSG03"));
                    }}
                    className="font-semibold text-[var(--brand-90)] hover:underline"
                  >
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <button
          onClick={() => {
            window.localStorage.removeItem(PENDING);
            navigate({ to: "/login" });
          }}
          className="mx-auto mt-5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink-60)] hover:text-[var(--brand-90)]"
        >
          <ArrowRight className="size-4 rtl-flip" /> العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}
