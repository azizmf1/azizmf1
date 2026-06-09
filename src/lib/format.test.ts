import { describe, it, expect } from "vitest";
import { fmtDate, fmtDateTime, age } from "@/lib/format";

describe("fmtDate", () => {
  it("يعيد شرطة للقيمة الفارغة أو غير الصالحة", () => {
    expect(fmtDate(undefined)).toBe("—");
    expect(fmtDate("ليس تاريخًا")).toBe("—");
  });

  it("يصيغ تاريخًا صالحًا ويحتوي السنة", () => {
    expect(fmtDate("2026-01-15")).toContain("2026");
    expect(fmtDate("2026-01-15")).toMatch(/\d{4}/);
  });
});

describe("fmtDateTime", () => {
  it("يعيد شرطة للقيمة الفارغة", () => {
    expect(fmtDateTime(undefined)).toBe("—");
  });

  it("يصيغ التاريخ والوقت", () => {
    const out = fmtDateTime("2026-01-15T09:30:00.000Z");
    expect(out).toContain("2026");
    expect(out).toMatch(/\d{2}:\d{2}/);
  });
});

describe("age", () => {
  it("يعيد شرطة لتاريخ ميلاد فارغ أو غير صالح", () => {
    expect(age(undefined)).toBe("—");
    expect(age("xx")).toBe("—");
  });

  it("يحسب العمر بالسنوات", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    const out = age(d.toISOString().slice(0, 10));
    expect(out).toMatch(/سنة/);
    expect(out).toMatch(/29|30|31/);
  });
});
