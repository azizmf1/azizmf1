import { describe, it, expect, beforeEach } from "vitest";
import { getSession, setSession, clearSession, isAuthed } from "@/lib/session";
import type { User } from "@/data/users";

const user: User = {
  id: "1024501",
  username: "doctor",
  password: "",
  name: "د. سارة",
  role: "doctor",
  org: "مجمع صحة",
  email: "s@seha.sa",
};

beforeEach(() => localStorage.clear());

describe("session", () => {
  it("لا توجد جلسة في البداية", () => {
    expect(getSession()).toBeNull();
    expect(isAuthed()).toBe(false);
  });

  it("setSession يخزّن المستخدم ووقت الدخول", () => {
    const s = setSession(user);
    expect(s.user.id).toBe(user.id);
    expect(s.loginAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(getSession()?.user.username).toBe("doctor");
    expect(isAuthed()).toBe(true);
  });

  it("clearSession يحذف الجلسة", () => {
    setSession(user);
    clearSession();
    expect(getSession()).toBeNull();
    expect(isAuthed()).toBe(false);
  });

  it("يتعامل بأمان مع بيانات تالفة", () => {
    localStorage.setItem("hms_session", "{not valid json");
    expect(getSession()).toBeNull();
  });
});
