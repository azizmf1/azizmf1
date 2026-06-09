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
  id: "HM-2026-9001",
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

  it("الطبيب: التعديل على المسودة والمُعاد فقط", () => {
    const d = mkUser("doctor");
    expect(can(d, "report:edit", mkReport("draft"))).toBe(true);
    expect(can(d, "report:edit", mkReport("returned"))).toBe(true);
    expect(can(d, "report:edit", mkReport("submitted"))).toBe(false);
    expect(can(d, "report:edit", mkReport("approved"))).toBe(false);
  });

  it("الطبيب: الحذف على المسودة فقط", () => {
    const d = mkUser("doctor");
    expect(can(d, "report:delete", mkReport("draft"))).toBe(true);
    expect(can(d, "report:delete", mkReport("submitted"))).toBe(false);
  });

  it("المدقّق: التدقيق على المُرسل وقيد التدقيق فقط", () => {
    const a = mkUser("auditor");
    expect(can(a, "report:audit", mkReport("submitted"))).toBe(true);
    expect(can(a, "report:audit", mkReport("under_review"))).toBe(true);
    expect(can(a, "report:audit", mkReport("draft"))).toBe(false);
    expect(can(a, "report:audit", mkReport("approved"))).toBe(false);
    expect(can(a, "report:create")).toBe(false);
    expect(can(a, "report:edit", mkReport("draft"))).toBe(false);
  });

  it("المدير: قراءة فقط", () => {
    const m = mkUser("admin");
    expect(can(m, "report:list")).toBe(true);
    expect(can(m, "report:view")).toBe(true);
    expect(can(m, "report:create")).toBe(false);
    expect(can(m, "report:edit", mkReport("draft"))).toBe(false);
    expect(can(m, "report:audit", mkReport("submitted"))).toBe(false);
  });
});
