import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Crosshair,
  FileText,
  HeartPulse,
  Lock,
  Syringe,
  Stethoscope,
} from "lucide-react";
import { PageHeader } from "@/components/hms/Shell";
import { Card } from "@/components/hms/Card";
import { toast } from "@/components/hms/Toast";
import { msg } from "@/data/messages";

export const Route = createFileRoute("/_app/services")({
  component: ServicesPage,
});

interface Service {
  key: string;
  title: string;
  desc: string;
  icon: typeof FileText;
  to?: "/hunting-medical";
  available: boolean;
}

const SERVICES: Service[] = [
  {
    key: "hunting",
    title: "التقرير الطبي لرخصة الصيد",
    desc: "إصدار وتدقيق التقارير الطبية للراغبين في الحصول على رخص الصيد.",
    icon: Crosshair,
    to: "/hunting-medical",
    available: true,
  },
  {
    key: "fitness",
    title: "شهادة اللياقة الصحية",
    desc: "إصدار شهادات اللياقة الصحية للأغراض الوظيفية والتعليمية.",
    icon: HeartPulse,
    available: false,
  },
  {
    key: "vaccine",
    title: "سجل التطعيمات",
    desc: "الاطلاع على سجل التطعيمات وإصدار الشهادات المرتبطة به.",
    icon: Syringe,
    available: false,
  },
  {
    key: "reports",
    title: "التقارير الطبية العامة",
    desc: "طلب وإصدار التقارير الطبية العامة المعتمدة.",
    icon: Stethoscope,
    available: false,
  },
];

function ServicesPage() {
  return (
    <div>
      <PageHeader
        title="دليل الخدمات"
        subtitle="الخدمات الطبية المتاحة عبر منصة صحة"
        breadcrumb={[{ label: "الرئيسية", to: "/dashboard" }, { label: "الخدمات" }]}
      />
      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-10">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          const body = (
            <Card className="group h-full cursor-pointer transition-shadow hover:shadow-[var(--shadow-md)]">
              <div className="flex h-full flex-col p-5">
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-[var(--r-lg)] bg-[var(--brand-10)] text-[var(--brand-90)]">
                    <Icon className="size-6" strokeWidth={1.8} />
                  </div>
                  {!s.available && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ink-10)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-60)]">
                      <Lock className="size-3" /> قريبًا
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-[16px] font-bold text-[var(--ink-90)]">
                  {s.title}
                </h3>
                <p className="mt-1 flex-1 text-[13px] leading-6 text-[var(--ink-60)]">
                  {s.desc}
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand-90)]">
                  {s.available ? "الدخول للخدمة" : "غير متاح حاليًا"}
                  <ArrowLeft className="size-4 rtl-flip transition-transform group-hover:-translate-x-1" />
                </div>
              </div>
            </Card>
          );
          return s.available && s.to ? (
            <Link key={s.key} to={s.to}>
              {body}
            </Link>
          ) : (
            <button
              key={s.key}
              type="button"
              className="text-start"
              onClick={() => toast.info(msg("MSG14"))}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}
