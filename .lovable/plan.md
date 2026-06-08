
# نظام التقارير الطبية لرخص الصيد — خطة البناء

سأبني النظام كاملًا حسب وثيقة `HANDOFF.md` بدون باكند (بيانات mock في `localStorage` + ملفات TS)، مع التزام كامل بـ RTL والهوية البصرية (Carbon-style + Cairo + IBM Plex Sans).

## النطاق

كل ما هو في checklist الوثيقة:
- Design tokens + خطوط (Cairo / IBM Plex Sans عبر Google Fonts)
- UI primitives مخصصة (Button, Input, Select, Modal, Card, Badge…)
- Shell (TopBar + Sidebar كحلي قابل للفصل)
- Login + OTP (مع حسابات تجريبية و OTP=1234)
- Dashboard + Services Catalog
- UC01 قائمة التقارير (فلاتر + pagination + أعمدة حسب الدور)
- UC02/UC07 إنشاء/تعديل تقرير (sticky actions + progress sidebar)
- UC04 حفظ مسودة
- UC05 تدقيق (اعتماد / إعادة بملاحظات)
- UC06 عرض التقرير + Timeline + Action Log
- UC09 صفحة طباعة A4 عبر `window.print()`
- Permissions في كل زر/شاشة عبر `can(user, action, resource)`
- رسائل النظام (MSG00..MSG18) في ملف موحّد + Toasts
- ~12 تقرير mock بحالات متنوعة لتجربة كل التدفقات

## التقنيات

- TanStack Start (موجود) + TypeScript
- Tailwind v4 — سأضيف tokens الـ Carbon في `src/styles.css` (oklch + متغيرات مباشرة) وأضبط `dir="rtl"` و `lang="ar"` على `<html>` في `__root.tsx`
- React Hook Form + Zod للنموذج
- date-fns + locale عربي
- بدون باكند — كل شيء mock في `src/data/*` + `localStorage` (`hms_session`, `hms_drafts`, `hms_reports`)

## بنية الراوتر (TanStack file-based)

```text
src/routes/
  index.tsx                    → redirect إلى /login أو /dashboard
  login.tsx                    → UC: Login
  otp.tsx                      → UC: OTP
  _app.tsx                     → Layout (TopBar + Sidebar) — pathless
  _app/dashboard.tsx
  _app/services.tsx
  _app/hunting-medical/index.tsx        → UC01 List
  _app/hunting-medical/new.tsx          → UC02 Form
  _app/hunting-medical/$id.tsx          → UC06 View
  _app/hunting-medical/$id.edit.tsx     → UC07 Edit
  _app/hunting-medical/$id.audit.tsx    → UC05 Audit
  _app/hunting-medical/$id.print.tsx    → UC09 Print (A4)
```

## ملاحظات تقنية

- **RTL:** `dir="rtl"` على `<html>`، استخدام `inset-inline-*` و `margin-inline-*`، و `<bdi dir="ltr">` لكل الأرقام/الأكواد/التواريخ.
- **الخطوط:** تحميل Cairo و IBM Plex Sans عبر `<link>` في `head()` بدون أي اعتماد على CDN خاص بـ Lovable.
- **Tokens:** سأضع متغيرات الـ Carbon (`--brand-*`, `--ink-*`, `--ok-*`…) مباشرة في `:root` وأربطها بـ shadcn tokens (`--primary`, `--background`…) لإعادة استخدام مكونات shadcn الموجودة عند الحاجة، مع تفضيل مكوناتي الخاصة المطابقة لـ Carbon.
- **Mock data:** بذرة ابتدائية في `src/data/reports.ts` تُحقن في `localStorage` عند أول تشغيل، ثم كل عمليات CRUD تذهب إلى `localStorage` لتبقى التغييرات بين الجلسات.
- **Permissions:** دالة `can(user, action, resource?)` تُستخدم في الراوت loaders + داخل JSX لإخفاء/تعطيل الأزرار، وصفحة `AccessDenied` لإعادة التوجيه.
- **الطباعة:** صفحة `$id.print.tsx` مستقلة بـ CSS `@media print` يخفي كل شيء عداها، و `window.print()` يُستدعى بزر.
- **حذف الـ placeholder:** سيُستبدل `src/routes/index.tsx` الحالي (`PlaceholderIndex`) بمنطق إعادة التوجيه.

## ما هو خارج النطاق

- لا backend / لا Lovable Cloud (الوثيقة تطلب mock data صراحة)
- لا إرسال حقيقي إلى وزارة البيئة
- لا تكامل مع تطبيق الهوية الرقمية (الزر موجود ديكور فقط مع toast "غير متاح في الديمو")
- اختبارات آلية

هل أبدأ التنفيذ؟
