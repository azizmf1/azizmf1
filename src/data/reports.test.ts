import { describe, it, expect, beforeEach } from "vitest";
import {
  SEED,
  emptyReport,
  emptyVisualAcuity,
  emptyEligibility,
  findUniquenessBlock,
  expirePriorNotFit,
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

describe("emptyReport يحتوي بنى BRS §6", () => {
  it("ينشئ حدّة إبصار وأهلية افتراضية", () => {
    const r = emptyReport(doctor);
    expect(r.visualAcuity).toEqual(emptyVisualAcuity());
    expect(r.eligibility).toEqual(emptyEligibility());
    expect(r.notFitJustification).toBe("");
  });
});

describe("BR-UNIQUE-REPORT — findUniquenessBlock", () => {
  it("يمنع عند وجود تقرير ساري (مكتمل حديثًا) → valid", () => {
    const block = findUniquenessBlock("1098234571");
    expect(block?.kind).toBe("valid");
  });

  it("يمنع عند وجود تقرير تحت الإجراء → in_progress", () => {
    const block = findUniquenessBlock("1076551203");
    expect(block?.kind).toBe("in_progress");
  });

  it("يُعفي التقرير المنتهي", () => {
    // HLR26000000008 منتهٍ لرقم 1088990011
    expect(findUniquenessBlock("1088990011")).toBeNull();
  });

  it("لا يمنع رقمًا جديدًا", () => {
    expect(findUniquenessBlock("1500000009")).toBeNull();
  });

  it("يتجاهل التقرير الحالي عبر excludeId", () => {
    const self = getReport("HLR26000000002")!; // pending لنفس الرقم
    expect(
      findUniquenessBlock(self.applicant.nationalId, self.id),
    ).toBeNull();
  });
});

describe("expirePriorNotFit (BR08)", () => {
  it("ينقل تقريرًا سابقًا غير لائق معتمد إلى منتهٍ", () => {
    const r = {
      ...emptyReport(doctor),
      status: "completed" as const,
      result: "unfit" as const,
      applicant: { ...emptyReport(doctor).applicant, nationalId: "1234509876" },
      decidedAt: new Date().toISOString(),
    };
    saveReport(r);
    expirePriorNotFit("1234509876");
    expect(getReport(r.id)?.status).toBe("expired");
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
