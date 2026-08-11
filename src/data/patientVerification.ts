// خدمة التحقق من هوية المتقدّم عبر نظام خارجي (الأحوال المدنية / الهوية الوطنية).
// حاليًا mock — نقطة تكامل واحدة تُستبدل لاحقًا بنداء الـ API الحقيقي.
//
// المدخلات: رقم الهوية (10 أرقام) + تاريخ الميلاد.
// المخرجات عند النجاح: الاسم، الجنسية، تاريخ الميلاد (بيانات موثّقة).

export interface VerifiedPatient {
  nationalId: string;
  name: string;
  nationality: string; // كود القائمة: sa | non_sa
  dob: string; // YYYY-MM-DD
}

export type VerifyResult =
  | { ok: true; patient: VerifiedPatient; source: string }
  | { ok: false; error: string };

export const VERIFICATION_SOURCE = "الأحوال المدنية — الهوية الوطنية";

// دليل تجريبي (يطابق بيانات البذرة) — يُحذف عند ربط الـ API الحقيقي.
const DIRECTORY: Record<string, Omit<VerifiedPatient, "nationalId">> = {
  "1098234571": { name: "عبدالله محمد الشهري", nationality: "sa", dob: "1990-04-12" },
  "1076551203": { name: "فهد سعد القحطاني", nationality: "sa", dob: "1985-09-02" },
  "1099887766": { name: "ريم خالد الدوسري", nationality: "sa", dob: "1996-01-20" },
  "1055443322": { name: "سلطان ناصر العنزي", nationality: "sa", dob: "1979-11-30" },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// اسم تجريبي حتمي للأرقام غير الموجودة في الدليل.
function mockName(nationalId: string): string {
  const first = ["محمد", "أحمد", "خالد", "سعود", "فيصل", "ناصر"];
  const family = ["الحربي", "العتيبي", "الشمري", "الدوسري", "المطيري", "الغامدي"];
  const n = nationalId.split("").reduce((a, c) => a + Number(c), 0);
  return `${first[n % first.length]} عبدالله ${family[n % family.length]}`;
}

/**
 * التحقق من المتقدّم عبر النظام الخارجي (mock).
 * لاستبدالها بالـ API الحقيقي: استبدل جسم الدالة بنداء fetch/HTTP مع المصادقة.
 */
export async function verifyPatient(
  nationalId: string,
  dob: string,
): Promise<VerifyResult> {
  await delay(700); // محاكاة زمن النداء الخارجي

  if (!/^\d{10}$/.test(nationalId)) {
    return { ok: false, error: "رقم الهوية يجب أن يتكوّن من 10 أرقام." };
  }
  if (!dob) {
    return { ok: false, error: "تاريخ الميلاد مطلوب للتحقق." };
  }

  const record = DIRECTORY[nationalId];
  if (record && record.dob !== dob) {
    return { ok: false, error: "تاريخ الميلاد لا يطابق سجلات النظام الوطني." };
  }

  const patient: VerifiedPatient = record
    ? { nationalId, ...record }
    : { nationalId, name: mockName(nationalId), nationality: "sa", dob };

  return { ok: true, patient, source: VERIFICATION_SOURCE };
}
