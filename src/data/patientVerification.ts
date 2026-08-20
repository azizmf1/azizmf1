// خدمة التحقق من هوية المراجع عبر السجل الوطني (الأحوال المدنية / الهوية الوطنية).
// حاليًا mock خلف نقطة تكامل واحدة (IApplicantRegistry) تُستبدل لاحقًا بالـ API الحقيقي.
//
// BRS §6 — المدخلات: نوع الهوية + رقم الهوية + تاريخ الميلاد.
// المخرجات عند النجاح: الاسم بالعربية، الاسم بالإنجليزية، الجنسية، الجنس.
// عند الفشل/عدم العثور: رسالة MSG04.

import type { IdType } from "@/data/reports";

export interface VerifiedApplicant {
  idType: IdType;
  idNumber: string;
  dob: string; // YYYY-MM-DD
  fullNameAr: string;
  fullNameEn: string;
  nationality: string; // كود القائمة: sa | non_sa
  gender: "male" | "female";
}

export type VerifyResult =
  | { ok: true; applicant: VerifiedApplicant; source: string }
  | { ok: false; messageId: "MSG04" };

export const VERIFICATION_SOURCE = "الأحوال المدنية — الهوية الوطنية";

// دليل تجريبي حتمي (يطابق بيانات البذرة) — يُحذف عند ربط الـ API الحقيقي.
interface DirectoryEntry {
  dob: string;
  fullNameAr: string;
  fullNameEn: string;
  nationality: string;
  gender: "male" | "female";
}

const DIRECTORY: Record<string, DirectoryEntry> = {
  "1098234571": {
    dob: "1990-04-12",
    fullNameAr: "عبدالله محمد الشهري",
    fullNameEn: "Abdullah Mohammed Alshahri",
    nationality: "sa",
    gender: "male",
  },
  "1076551203": {
    dob: "1985-09-02",
    fullNameAr: "فهد سعد القحطاني",
    fullNameEn: "Fahad Saad Alqahtani",
    nationality: "sa",
    gender: "male",
  },
  "1099887766": {
    dob: "1996-01-20",
    fullNameAr: "ريم خالد الدوسري",
    fullNameEn: "Reem Khalid Aldosari",
    nationality: "sa",
    gender: "female",
  },
  "1055443322": {
    dob: "1979-11-30",
    fullNameAr: "سلطان ناصر العنزي",
    fullNameEn: "Sultan Nasser Alenazi",
    nationality: "sa",
    gender: "male",
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// بيانات تجريبية حتمية للأرقام غير الموجودة في الدليل.
function mockEntry(idNumber: string, dob: string): DirectoryEntry {
  const firstAr = ["محمد", "أحمد", "خالد", "سعود", "فيصل", "ناصر"];
  const firstEn = ["Mohammed", "Ahmed", "Khalid", "Saud", "Faisal", "Nasser"];
  const familyAr = ["الحربي", "العتيبي", "الشمري", "الدوسري", "المطيري", "الغامدي"];
  const familyEn = ["Alharbi", "Alotaibi", "Alshammari", "Aldosari", "Almutairi", "Alghamdi"];
  const n = idNumber.split("").reduce((a, c) => a + Number(c), 0);
  const i = n % firstAr.length;
  const j = n % familyAr.length;
  return {
    dob,
    fullNameAr: `${firstAr[i]} عبدالله ${familyAr[j]}`,
    fullNameEn: `${firstEn[i]} Abdullah ${familyEn[j]}`,
    nationality: "sa",
    gender: n % 2 === 0 ? "male" : "female",
  };
}

// التحقق من نمط رقم الهوية حسب النوع (PROVISIONAL RFI-001/OQ-04).
export function isValidIdNumber(idType: IdType, idNumber: string): boolean {
  switch (idType) {
    case "citizen":
      return /^1\d{9}$/.test(idNumber);
    case "resident":
      return /^2\d{9}$/.test(idNumber);
    case "gcc":
      return /^[A-Za-z0-9]{1,20}$/.test(idNumber);
    default:
      return false;
  }
}

/**
 * التحقق من المراجع عبر السجل الوطني (mock).
 * لاستبدالها بالـ API الحقيقي: استبدل جسم الدالة بنداء fetch/HTTP مع المصادقة.
 */
export async function verifyApplicant(
  idType: IdType,
  idNumber: string,
  dob: string,
): Promise<VerifyResult> {
  await delay(700); // محاكاة زمن نداء السجل الخارجي

  if (!idType || !isValidIdNumber(idType, idNumber) || !dob) {
    return { ok: false, messageId: "MSG04" };
  }

  const record = DIRECTORY[idNumber];
  if (record && record.dob !== dob) {
    // تاريخ الميلاد لا يطابق السجل → خطأ استعلام
    return { ok: false, messageId: "MSG04" };
  }

  const entry = record ?? mockEntry(idNumber, dob);
  return {
    ok: true,
    source: VERIFICATION_SOURCE,
    applicant: {
      idType,
      idNumber,
      dob: entry.dob,
      fullNameAr: entry.fullNameAr,
      fullNameEn: entry.fullNameEn,
      nationality: entry.nationality,
      gender: entry.gender,
    },
  };
}
