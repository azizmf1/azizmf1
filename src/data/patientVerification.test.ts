import { describe, it, expect } from "vitest";
import { verifyApplicant, isValidIdNumber } from "@/data/patientVerification";

describe("isValidIdNumber", () => {
  it("يطبّق نمط كل نوع هوية", () => {
    expect(isValidIdNumber("citizen", "1098234571")).toBe(true);
    expect(isValidIdNumber("citizen", "2098234571")).toBe(false);
    expect(isValidIdNumber("resident", "2011223344")).toBe(true);
    expect(isValidIdNumber("gcc", "GCC12345")).toBe(true);
    expect(isValidIdNumber("", "1098234571")).toBe(false);
  });
});

describe("verifyApplicant", () => {
  it("يرفض نوع/رقم هوية غير صحيح أو تاريخ ميلاد ناقص", async () => {
    expect((await verifyApplicant("citizen", "123", "1990-01-01")).ok).toBe(false);
    expect((await verifyApplicant("citizen", "1098234571", "")).ok).toBe(false);
    expect((await verifyApplicant("", "1098234571", "1990-04-12")).ok).toBe(false);
  });

  it("يرفض تاريخ ميلاد لا يطابق السجل (MSG04)", async () => {
    const r = await verifyApplicant("citizen", "1098234571", "2000-01-01");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.messageId).toBe("MSG04");
  });

  it("يعيد بيانات موثّقة لرقم معروف", async () => {
    const r = await verifyApplicant("citizen", "1098234571", "1990-04-12");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.applicant.fullNameAr).toContain("عبدالله");
      expect(r.applicant.fullNameEn).toBeTruthy();
      expect(r.applicant.nationality).toBe("sa");
      expect(r.applicant.gender).toBe("male");
      expect(r.applicant.idNumber).toBe("1098234571");
    }
  });

  it("يعيد بيانات تجريبية لرقم غير معروف", async () => {
    const r = await verifyApplicant("citizen", "1234567890", "1995-05-05");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.applicant.fullNameAr).toBeTruthy();
      expect(r.applicant.dob).toBe("1995-05-05");
    }
  });
});
