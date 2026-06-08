# منصة صحة — نظام التقارير الطبية لرخص الصيد

نظام لإصدار وتدقيق وطباعة التقارير الطبية للراغبين في الحصول على رخص الصيد،
مبنيّ على **TanStack Start + React 19 + TypeScript + Tailwind v4**، بهوية بصرية
بنمط Carbon ودعم كامل لـ **RTL** والخط العربي (Cairo / IBM Plex Sans).

> النظام يعمل ببيانات تجريبية (mock) في `localStorage` — بدون باكند.

## التشغيل

```bash
bun install      # أو npm install
bun dev          # تشغيل بيئة التطوير على http://localhost:3000
bun run build    # بناء الإنتاج
bun run lint     # فحص ESLint
```

> ملاحظة: عند أول `dev`/`build` يقوم مكوّن TanStack Router بإعادة توليد
> `src/routeTree.gen.ts` تلقائيًا.

## الحسابات التجريبية

كلمة المرور ورمز التحقق (OTP) للجميع: **`1234`**

| المستخدم  | الدور        | الصلاحيات                                   |
| --------- | ------------ | ------------------------------------------- |
| `doctor`  | طبيب فحص      | إنشاء/تعديل/إرسال التقارير، حفظ المسودات     |
| `auditor` | مدقّق طبي     | تدقيق التقارير (اعتماد / إعادة بملاحظات)     |
| `admin`   | مدير النظام   | استعراض التقارير (قراءة فقط)                 |

## المسارات (Routes)

```
/login                            تسجيل الدخول
/otp                              رمز التحقق
/dashboard                        لوحة المعلومات
/services                         دليل الخدمات
/hunting-medical                  قائمة التقارير (فلاتر + ترقيم + أعمدة حسب الدور)
/hunting-medical/new              إنشاء تقرير
/hunting-medical/$id              عرض التقرير + سجل الإجراءات (Timeline)
/hunting-medical/$id/edit         تعديل التقرير
/hunting-medical/$id/audit        تدقيق التقرير (اعتماد / إعادة)
/hunting-medical/$id/print        نسخة الطباعة (A4)
```

## البنية

```
src/
  components/
    hms/        مكوّنات النظام (Shell, Button, Card, Field, ReportForm, …)
    ui/         مكوّنات shadcn/ui الأساسية
  data/         بيانات mock (users, lookups, reports, messages)
  lib/          أدوات مساعدة (session, permissions, format, utils)
  hooks/        useCurrentUser
  routes/       مسارات TanStack Start (file-based)
  styles.css    Design tokens (Carbon ramp + هوية صحة) + RTL + الطباعة
```

## الصلاحيات

تُدار عبر `can(user, action, resource?)` في `src/lib/permissions.ts`، وتُستخدم
لإخفاء/تعطيل الأزرار وحماية المسارات حسب الدور وحالة التقرير.

## دورة حياة التقرير

```
مسودة → بانتظار التدقيق → (قيد التدقيق) → معتمد
                                  └──────→ مُعاد للتعديل ──→ (إعادة الإرسال)
```
