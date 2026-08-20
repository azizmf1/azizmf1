// نموذج الصلاحيات — can(user, action, resource?)
// يُستخدم في الـ loaders + داخل JSX لإخفاء/تعطيل الأزرار.

import type { Role, User } from "@/data/users";
import type { Report } from "@/data/reports";

export type Action =
  | "report:list"
  | "report:view"
  | "report:create"
  | "report:edit"
  | "report:submit"
  | "report:delete"
  | "report:audit"; // اعتماد/إعادة

const MATRIX: Record<Role, Action[]> = {
  doctor: [
    "report:list",
    "report:view",
    "report:create",
    "report:edit",
    "report:submit",
    "report:delete",
  ],
  auditor: ["report:list", "report:view", "report:audit"],
  admin: ["report:list", "report:view"],
};

export function can(
  user: User | null | undefined,
  action: Action,
  resource?: Report,
): boolean {
  if (!user) return false;
  const allowed = MATRIX[user.role]?.includes(action) ?? false;
  if (!allowed) return false;

  // قواعد على مستوى المورد
  if (resource) {
    switch (action) {
      case "report:edit":
        // UC06: التعديل على المسودة أو المُعاد إلى المدخل فقط، من الطبيب
        return (
          user.role === "doctor" &&
          (resource.status === "draft" ||
            resource.status === "requires_modification")
        );
      case "report:submit":
        return (
          user.role === "doctor" &&
          (resource.status === "draft" ||
            resource.status === "requires_modification")
        );
      case "report:delete":
        return user.role === "doctor" && resource.status === "draft";
      case "report:audit":
        // UC04: التدقيق على "بانتظار التدقيق" فقط
        return user.role === "auditor" && resource.status === "pending_audit";
      default:
        return true;
    }
  }
  return true;
}
