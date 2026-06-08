// المستخدمون التجريبيون والأدوار — mock، لا باكند.
// تسجيل الدخول: اسم المستخدم + كلمة المرور، ثم OTP = 1234.

export type Role = "doctor" | "auditor" | "admin";

export interface User {
  id: string; // الرقم الوظيفي
  username: string;
  password: string; // mock فقط
  name: string;
  role: Role;
  org: string; // الجهة/المنشأة
  email: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  doctor: "طبيب فحص",
  auditor: "مدقّق طبي",
  admin: "مدير النظام",
};

export const DEMO_USERS: User[] = [
  {
    id: "1024501",
    username: "doctor",
    password: "1234",
    name: "د. سارة العتيبي",
    role: "doctor",
    org: "مجمع صحة الطبي — الرياض",
    email: "s.alotaibi@seha.sa",
  },
  {
    id: "2038114",
    username: "auditor",
    password: "1234",
    name: "د. خالد القحطاني",
    role: "auditor",
    org: "الإدارة الطبية — صحة",
    email: "k.alqahtani@seha.sa",
  },
  {
    id: "3001902",
    username: "admin",
    password: "1234",
    name: "نورة الزهراني",
    role: "admin",
    org: "إدارة النظام — صحة",
    email: "n.alzahrani@seha.sa",
  },
];

export function findUserByCredentials(
  username: string,
  password: string,
): User | null {
  const u = DEMO_USERS.find(
    (x) => x.username === username.trim().toLowerCase(),
  );
  if (!u || u.password !== password) return null;
  return u;
}

// نسخة للتخزين في الجلسة مع إخفاء كلمة المرور (mock).
export function toSessionUser(u: User): User {
  return { ...u, password: "" };
}
