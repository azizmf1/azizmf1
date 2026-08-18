import { describe, it, expect, beforeEach } from "vitest";
import {
  SEED,
  emptyReport,
  listReports,
  getReport,
  saveReport,
  deleteReport,
  appendTimeline,
  resetSeed,
  nextId,
} from "@/data/reports";

const doctor = { id: "1024501", name: "د. سارة", org: "مجمع صحة" };

beforeEach(() => localStorage.clear());

describe("بذرة البيانات", () => {
  it("تحتوي على 12 تقريرًا", () => {
    expect(SEED).toHaveLength(12);
  });

  it("listReports يحقن البذرة عند أول قراءة ويرتّب تنازليًا", () => {
    const all = listReports();
    expect(all).toHaveLength(12);
    for (let i = 1; i < all.length; i++) {
      expect(all[i - 1].updatedAt >= all[i].updatedAt).toBe(true);
    }
  });

  it("getReport يجد تقريرًا موجودًا في البذرة", () => {
    expect(getReport("HLR26000000001")?.applicant.name).toBeTruthy();
    expect(getReport("لا-يوجد")).toBeUndefined();
  });

  it("resetSeed يعيد البذرة الكاملة", () => {
    deleteReport("HLR26000000001");
    expect(listReports()).toHaveLength(11);
    resetSeed();
    expect(listReports()).toHaveLength(12);
  });
});

describe("emptyReport / nextId", () => {
  it("emptyReport ينشئ مسودة بحالة draft", () => {
    const r = emptyReport(doctor);
    expect(r.status).toBe("draft");
    expect(r.result).toBeNull();
    expect(r.exams).toHaveLength(0);
    expect(r.doctor.id).toBe(doctor.id);
  });

  it("nextId يولّد معرّفًا بالصيغة HLR[YY][9]", () => {
    expect(nextId()).toMatch(/^HLR\d{2}\d{9}$/);
  });
});

describe("CRUD", () => {
  it("saveReport يضيف ثم getReport يجده", () => {
    const r = emptyReport(doctor);
    saveReport(r);
    expect(getReport(r.id)?.id).toBe(r.id);
  });

  it("saveReport يحدّث تقريرًا موجودًا دون تكرار", () => {
    const before = listReports().length;
    const updated = { ...getReport("HLR26000000004")!, status: "pending_audit" as const };
    saveReport(updated);
    expect(listReports()).toHaveLength(before);
    expect(getReport("HLR26000000004")?.status).toBe("pending_audit");
  });

  it("deleteReport يحذف التقرير", () => {
    const r = emptyReport(doctor);
    saveReport(r);
    deleteReport(r.id);
    expect(getReport(r.id)).toBeUndefined();
  });
});

describe("appendTimeline", () => {
  it("يضيف مدخلًا دون تعديل الأصل", () => {
    const r = emptyReport(doctor);
    const next = appendTimeline(r, {
      at: new Date().toISOString(),
      actorId: doctor.id,
      actorName: doctor.name,
      action: "إرسال للتدقيق",
    });
    expect(next.timeline).toHaveLength(r.timeline.length + 1);
    expect(r.timeline).toHaveLength(0);
    expect(next.timeline.at(-1)?.action).toBe("إرسال للتدقيق");
  });
});
