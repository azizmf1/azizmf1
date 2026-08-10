import { Link } from "@tanstack/react-router";
import { FileSearch, ShieldAlert } from "lucide-react";
import { Button } from "@/components/hms/Button";
import { msg } from "@/data/messages";

export function NotFound({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[var(--ink-10)] text-[var(--ink-50)]">
        <FileSearch className="size-8" />
      </div>
      <h2 className="mt-4 text-[18px] font-bold text-[var(--ink-90)]">
        غير موجود
      </h2>
      <p className="mt-1 text-[14px] text-[var(--ink-60)]">
        {message ?? msg("MSG12")}
      </p>
      <Link to="/hunting-medical" className="mt-6">
        <Button variant="secondary">العودة لقائمة التقارير</Button>
      </Link>
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[var(--err-50)] text-[var(--err-600)]">
        <ShieldAlert className="size-8" />
      </div>
      <h2 className="mt-4 text-[18px] font-bold text-[var(--ink-90)]">
        صلاحية غير كافية
      </h2>
      <p className="mt-1 text-[14px] text-[var(--ink-60)]">{msg("MSG11")}</p>
      <Link to="/hunting-medical" className="mt-6">
        <Button variant="secondary">العودة للرئيسية</Button>
      </Link>
    </div>
  );
}
