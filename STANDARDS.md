# الالتزام بمعايير خط البناء (Build Pipeline)

توثيق كيفية تطبيق هذا المشروع لتحسينات خط البناء المُعلنة، وما الذي ينطبق وما
لا ينطبق ولماذا. المشروع **تطبيق واجهة أمامية (Frontend SPA)** بلا باكند —
كل البيانات mock في `localStorage`.

## ملخّص الالتزام

| البند | الحالة | التفاصيل |
| --- | --- | --- |
| اختبارات الوحدة بتغطية ≥ 20% (واجهة) | ✅ مُطبّق | Vitest عبر `npm test` مع مزوّد تغطية v8 |
| اختبارات الوحدة والتكامل ≥ 20% (خادم) | ✅ مُطبّق | xUnit + Coverlet + Testcontainers عبر `dotnet test` |
| Node 22 (نهاية Node 20) | ✅ مُطبّق | `engines.node >= 22` + `.nvmrc` |
| .NET 10 (`net10.yaml`) | ✅ مُطبّق | الخادم على `net10.0` + `backend/pipeline/net10.yaml` |
| تحديث قواعد OpenAPI | ✅ مُطبّق | توليد مدمج + `backend/openapi.yaml` (OpenAPI 3.1) |
| Test Containers | ✅ مُطبّق | اختبارات تكامل على PostgreSQL مؤقتة (لا mocks للبنية) |
| معايير قواعد البيانات | ✅ مُطبّق | PostgreSQL + EF Core (وثيقة المعايير مشفّرة — افتراض موثّق) |
| إزالة Elastic APM | ✅ مُطبّق | لم تُضف أي حزمة/إعداد APM (حقن تلقائي على مستوى الصورة) |
| TDD / كود قابل للاختبار | ✅ مُطبّق | منطق نقي مفصول (`src/lib`, `Domain/*`) |

## الاختبارات والتغطية

- **الأمر:** `npm test` → `vitest run --coverage` (نفس أمر اللغة الافتراضي في
  التعميم لـ Node).
- **المزوّد:** `@vitest/coverage-v8`.
- **النطاق المقاس:** منطق التطبيق في `src/lib/**` و `src/data/**`
  (انظر `vitest.config.ts`).
- **البوابة الدنيا:** 20% (تبدأ 8 فبراير 2026) — مضبوطة في `thresholds`.
- **جدول الرفع:** 40% (8 مارس) ثم 60% (11 أبريل) — تُزاد التغطية تدريجيًا
  بإضافة اختبارات لطبقات إضافية ومكوّنات العرض.

### ملفات الاختبار الحالية

```
src/lib/permissions.test.ts   صلاحيات can() لكل الأدوار وحالات التقرير
src/lib/format.test.ts        تنسيق التواريخ وحساب العمر
src/lib/session.test.ts       جلسة localStorage (دخول/خروج/تالف)
src/data/reports.test.ts      البذرة + CRUD + nextId + appendTimeline
src/data/lookups.test.ts      القوائم المرجعية و lookupLabel
src/data/messages.test.ts     رسائل النظام MSG
src/data/users.test.ts        المصادقة والأدوار
```

## كيفية التشغيل

```bash
npm install
npm test           # تشغيل الاختبارات مع تقرير التغطية
npm run test:watch # وضع المراقبة أثناء التطوير
```

## خطوات رفع التغطية لاحقًا (نحو 40% ثم 60%)

1. اختبارات تكامل بسيطة للمكوّنات النقية (`Button`, `Badges`, `Field`) عبر
   `@testing-library/react`.
2. اختبارات سلوك النماذج (التحقق، حفظ المسودة، الإرسال) في `ReportForm`.
3. توسيع `coverage.include` تدريجيًا ليشمل `src/components/hms/**`.
