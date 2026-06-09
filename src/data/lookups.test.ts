import { describe, it, expect } from "vitest";
import {
  lookupLabel,
  STATUSES,
  STATUS_ORDER,
  BLOOD_TYPES,
  LICENSE_TYPES,
  EXAM_ITEMS,
  CITIES,
} from "@/data/lookups";

describe("lookupLabel", () => {
  it("يعيد التسمية لقيمة معروفة", () => {
    expect(lookupLabel(CITIES, "riyadh")).toBe("الرياض");
    expect(lookupLabel(LICENSE_TYPES, "land")).toBe("صيد بري");
  });

  it("يعيد القيمة نفسها لقيمة غير معروفة", () => {
    expect(lookupLabel(CITIES, "atlantis")).toBe("atlantis");
  });
});

describe("ثوابت القوائم", () => {
  it("ثماني فصائل دم", () => {
    expect(BLOOD_TYPES).toHaveLength(8);
    expect(BLOOD_TYPES).toContain("O+");
  });

  it("كل الحالات معرّفة وضمن الترتيب", () => {
    for (const s of STATUS_ORDER) {
      expect(STATUSES[s]).toBeDefined();
      expect(STATUSES[s].ar).toBeTruthy();
    }
  });

  it("بنود الفحص لها مفتاح وتسمية", () => {
    expect(EXAM_ITEMS.length).toBeGreaterThan(0);
    for (const item of EXAM_ITEMS) {
      expect(item.key).toBeTruthy();
      expect(item.label).toBeTruthy();
    }
  });
});
