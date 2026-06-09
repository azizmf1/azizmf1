import { describe, it, expect } from "vitest";
import {
  findUserByCredentials,
  toSessionUser,
  DEMO_USERS,
  ROLE_LABEL,
} from "@/data/users";

describe("findUserByCredentials", () => {
  it("ينجح ببيانات صحيحة", () => {
    const u = findUserByCredentials("doctor", "1234");
    expect(u?.role).toBe("doctor");
  });

  it("غير حسّاس لحالة الأحرف في اسم المستخدم", () => {
    expect(findUserByCredentials("DOCTOR", "1234")?.role).toBe("doctor");
    expect(findUserByCredentials("  Auditor  ", "1234")?.role).toBe("auditor");
  });

  it("يفشل بكلمة مرور خاطئة أو مستخدم غير موجود", () => {
    expect(findUserByCredentials("doctor", "0000")).toBeNull();
    expect(findUserByCredentials("ghost", "1234")).toBeNull();
  });
});

describe("toSessionUser", () => {
  it("يخفي كلمة المرور", () => {
    const s = toSessionUser(DEMO_USERS[0]);
    expect(s.password).toBe("");
    expect(s.id).toBe(DEMO_USERS[0].id);
  });
});

describe("الأدوار", () => {
  it("ثلاثة حسابات تجريبية ولكل دور تسمية", () => {
    expect(DEMO_USERS).toHaveLength(3);
    expect(ROLE_LABEL.doctor).toBeTruthy();
    expect(ROLE_LABEL.auditor).toBeTruthy();
    expect(ROLE_LABEL.admin).toBeTruthy();
  });
});
