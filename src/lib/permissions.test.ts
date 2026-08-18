import { describe, it, expect } from "vitest";
import { can } from "@/lib/permissions";
import type { User } from "@/data/users";
import type { Report } from "@/data/reports";
import type { ReportStatus } from "@/data/lookups";

const mkUser = (role: User["role"]): User => ({
  id: "1",
  username: role,
  password: "",
  name: "مستخدم",
  role,
  org: "جهة",
  email: "u@seha.sa",
});

const mkReport = (status: ReportStatus): Report => ({
  id: "HLR26000009001",
  status,
  applicant: {
    name: "",
    nationalId: "",
    dob: "",
    gender: "",
    nationality: "sa",
    phone: "",
    city: "riyadh",
    bloodType: "",
  },
  licenseType: "land",
  vitals: { height: "", weight: "", bloodPressure: "", pulse: "" },
  exams: [],
  result: null,
  recommendation: "",
  doctor: { id: "1", name: "د. س", org: "جهة" },
  createdAt: "",
  updatedAt: "",
  timeline: [],
});

describe("can()", () => {
  it("يرفض كل شيء للمستخدم غير المسجّل", () => {
    expect(can(null, "report:list")).toBe(false);
    expect(can(undefined, "report:view")).toBe(false);
    expect(can(null, "report:create")).toBe(false);
  });

  it("الطبيب: استعراض وإنشاء", () => {
    const d = mkUser("doctor");
    expect(can(d, "report:list")).toBe(true);
    expect(can(d, "report:view")).toBe(true);
    expect(can(d, "report:create")).toBe(true);
    expect(can(d, "report:audit")).toBe(false);
  });

  it("الطبيب: التعديل على المسودة والمُعاد إلى المدخل فقط", () => {
    const d = mkUser("doctor");
    expect(can(d, "report:edit", mkReport("draft"))).toBe(true);
    expect(can(d, "report:edit", mkReport("requires_modification"))).toBe(true);
    expect(can(d, "report:edit", mkReport("pending_audit"))).toBe(false);
    expect(can(d, "report:edit", mkReport("completed"))).toBe(false);
    expect(can(d, "report:edit", mkReport("expired"))).toBe(false);
  });

  it("الطبيب: الحذف على المسودة فقط", () => {
    const d = mkUser("doctor");
    expect(can(d, "report:delete", mkReport("draft"))).toBe(true);
    expect(can(d, "report:delete", mkReport("pending_audit"))).toBe(false);
  });

  it("المدقّق: التدقيق على بانتظار التدقيق فقط", () => {
    const a = mkUser("auditor");
    expect(can(a, "report:audit", mkReport("pending_audit"))).toBe(true);
    expect(can(a, "report:audit", mkReport("draft"))).toBe(false);
    expect(can(a, "report:audit", mkReport("completed"))).toBe(false);
    expect(can(a, "report:audit", mkReport("requires_modification"))).toBe(false);
    expect(can(a, "report:create")).toBe(false);
    expect(can(a, "report:edit", mkReport("draft"))).toBe(false);
  });

  it("المدير: قراءة فقط", () => {
    const m = mkUser("admin");
    expect(can(m, "report:list")).toBe(true);
    expect(can(m, "report:view")).toBe(true);
    expect(can(m, "report:create")).toBe(false);
    expect(can(m, "report:edit", mkReport("draft"))).toBe(false);
    expect(can(m, "report:audit", mkReport("pending_audit"))).toBe(false);
  });
});
