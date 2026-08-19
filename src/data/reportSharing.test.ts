import { describe, it, expect, beforeEach } from "vitest";
import { emptyReport } from "@/data/reports";
import { enqueueApprovedReport, listOutbox } from "@/data/reportSharing";

const doctor = { id: "1", name: "د. س", org: "جهة" };

beforeEach(() => localStorage.clear());

describe("MEWA sharing outbox (OQ-01)", () => {
  it("يضيف التقرير المعتمد إلى الصادر ويعيد حالة قيد الإرسال", () => {
    const r = { ...emptyReport(doctor), status: "completed" as const };
    const status = enqueueApprovedReport(r);
    expect(status).toBe("pending");
    const box = listOutbox();
    expect(box).toHaveLength(1);
    expect(box[0].reportId).toBe(r.id);
    expect(box[0].status).toBe("pending");
  });

  it("لا يكرّر نفس التقرير في الصادر", () => {
    const r = { ...emptyReport(doctor), status: "completed" as const };
    enqueueApprovedReport(r);
    enqueueApprovedReport(r);
    expect(listOutbox()).toHaveLength(1);
  });
});
