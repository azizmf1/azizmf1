import { describe, it, expect } from "vitest";
import { verifyPatient } from "@/data/patientVerification";

describe("verifyPatient", () => {
  it("rejects an invalid national id or missing dob", async () => {
    expect((await verifyPatient("123", "1990-01-01")).ok).toBe(false);
    expect((await verifyPatient("1098234571", "")).ok).toBe(false);
  });

  it("rejects a dob that does not match the directory", async () => {
    const r = await verifyPatient("1098234571", "2000-01-01");
    expect(r.ok).toBe(false);
  });

  it("returns verified data for a known id", async () => {
    const r = await verifyPatient("1098234571", "1990-04-12");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patient.name).toContain("عبدالله");
      expect(r.patient.nationality).toBe("sa");
      expect(r.patient.nationalId).toBe("1098234571");
    }
  });

  it("returns generic verified data for an unknown id", async () => {
    const r = await verifyPatient("1234567890", "1995-05-05");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patient.name).toBeTruthy();
      expect(r.patient.dob).toBe("1995-05-05");
    }
  });
});
