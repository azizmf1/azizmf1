# واجهة التقارير الطبية لرخص الصيد — Backend (.NET 10)

خادم API لمشروع منصة صحة، مبني بـ **ASP.NET Core (.NET 10) + EF Core + PostgreSQL**،
مع مصادقة JWT، توليد OpenAPI، واختبارات وحدة وتكامل عبر **Testcontainers**.

## المتطلبات

- .NET 10 SDK
- Docker (لقاعدة بيانات التطوير ولاختبارات التكامل عبر Testcontainers)

## التشغيل

```bash
cd backend
docker compose up -d                       # تشغيل PostgreSQL محليًا
dotnet run --project src/Seha.HuntingMedical.Api
```

- الـ API: `http://localhost:5000` (أو حسب `launchSettings`)
- توثيق OpenAPI التفاعلي (Scalar) في بيئة التطوير: `/scalar/v1`
- وثيقة OpenAPI: `/openapi/v1.json` — ونسخة ثابتة محرّرة في [`openapi.yaml`](./openapi.yaml)
- فحص الصحة: `/health`

## الاختبارات والتغطية

```bash
cd backend
dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings
```

- **الوحدة:** صلاحيات `ReportPermissions` وسير العمل `ReportWorkflow`.
- **التكامل:** يشغّل حاوية PostgreSQL مؤقتة (Testcontainers) ويختبر تدفّق
  الدخول والتقارير عبر `WebApplicationFactory` — **بدون mocks للبنية التحتية**.
- **بوابة التغطية:** 20% (line/total) عبر Coverlet — انظر `coverlet.runsettings`.

## الحسابات التجريبية

كلمة المرور ورمز التحقق للجميع: **`1234`** — المستخدمون: `doctor` / `auditor` / `admin`.

## نقاط النهاية

| الطريقة | المسار | الوصف |
| --- | --- | --- |
| POST | `/api/auth/login` | تسجيل الدخول (يطلب رمز تحقق) |
| POST | `/api/auth/verify` | التحقق من OTP وإصدار JWT |
| GET | `/api/auth/me` | المستخدم الحالي |
| GET | `/api/reports` | قائمة التقارير (فلاتر `status`, `q`) |
| GET | `/api/reports/{id}` | عرض تقرير |
| POST | `/api/reports` | إنشاء (طبيب) |
| PUT | `/api/reports/{id}` | تعديل (طبيب) |
| POST | `/api/reports/{id}/submit` | إرسال للتدقيق (طبيب) |
| POST | `/api/reports/{id}/audit` | اعتماد/إعادة (مدقّق) |

## Elastic APM

حسب التعميم، يتم **حقن Elastic APM تلقائيًا** على مستوى الصورة (image). لذلك:
- **لم تُضف** أي حزمة `Elastic.Apm.*` ولا أي إعداد APM في الكود.
- لا حاجة لأي تهيئة يدوية — المراقبة تأتي من البنية التحتية.

## ملاحظات معمارية

- القيم المركّبة (المتقدّم/العلامات الحيوية/الفحوص/سجل الإجراءات) مخزّنة كأعمدة
  JSON (`jsonb`) عبر `OwnsOne/OwnsMany().ToJson()`.
- التهيئة الحالية تستخدم `EnsureCreated` للتطوير والاختبار. للإنتاج يُنصح بتوليد
  هجرات EF: `dotnet ef migrations add Initial` ثم `Database.Migrate()`.
- إصدارات الحزم (`10.0.0` …) قابلة للضبط حسب أحدث إصدارات متاحة في مغذّي الحزم
  لديك.
