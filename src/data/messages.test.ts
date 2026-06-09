import { describe, it, expect } from "vitest";
import { msg, MSG } from "@/data/messages";

describe("msg", () => {
  it("يعيد نص رسالة معروفة", () => {
    expect(msg("MSG00")).toBe(MSG.MSG00);
    expect(typeof msg("MSG05")).toBe("string");
    expect(msg("MSG05").length).toBeGreaterThan(0);
  });

  it("يعيد الرمز نفسه لرمز غير معروف", () => {
    expect(msg("MSG_UNKNOWN" as keyof typeof MSG)).toBe("MSG_UNKNOWN");
  });
});
