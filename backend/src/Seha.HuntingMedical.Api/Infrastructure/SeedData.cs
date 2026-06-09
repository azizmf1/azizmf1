using Microsoft.EntityFrameworkCore;
using Seha.HuntingMedical.Api.Domain;
using Seha.HuntingMedical.Api.Security;

namespace Seha.HuntingMedical.Api.Infrastructure;

/// <summary>بذرة المستخدمين والتقارير التجريبية (تُحقن عند أول تشغيل).</summary>
public static class SeedData
{
    public static readonly Guid DoctorId = Guid.Parse("11111111-0000-0000-0000-000000000001");
    public static readonly Guid AuditorId = Guid.Parse("11111111-0000-0000-0000-000000000002");
    public static readonly Guid AdminId = Guid.Parse("11111111-0000-0000-0000-000000000003");

    public static async Task EnsureSeededAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (!await db.Users.AnyAsync(ct))
        {
            db.Users.AddRange(Users());
            await db.SaveChangesAsync(ct);
        }

        if (!await db.Reports.AnyAsync(ct))
        {
            db.Reports.AddRange(Reports());
            await db.SaveChangesAsync(ct);
        }
    }

    public static List<User> Users() =>
    [
        new()
        {
            Id = DoctorId,
            Username = "doctor",
            PasswordHash = PasswordHasher.Hash("1234"),
            Name = "د. سارة العتيبي",
            Role = Role.Doctor,
            Org = "مجمع صحة الطبي — الرياض",
            Email = "s.alotaibi@seha.sa",
        },
        new()
        {
            Id = AuditorId,
            Username = "auditor",
            PasswordHash = PasswordHasher.Hash("1234"),
            Name = "د. خالد القحطاني",
            Role = Role.Auditor,
            Org = "الإدارة الطبية — صحة",
            Email = "k.alqahtani@seha.sa",
        },
        new()
        {
            Id = AdminId,
            Username = "admin",
            PasswordHash = PasswordHasher.Hash("1234"),
            Name = "نورة الزهراني",
            Role = Role.Admin,
            Org = "إدارة النظام — صحة",
            Email = "n.alzahrani@seha.sa",
        },
    ];

    private static List<ExamItem> Exams(params string[] failed) =>
        new[] { "vision", "hearing", "motor", "cardio", "respiratory", "neuro", "psych", "substance" }
            .Select(k => new ExamItem
            {
                Key = k,
                Value = failed.Contains(k) ? ExamResultValue.Failed : ExamResultValue.Passed,
            })
            .ToList();

    public static List<Report> Reports()
    {
        var doctor = new User { Id = DoctorId, Name = "د. سارة العتيبي", Org = "مجمع صحة الطبي — الرياض" };
        var now = DateTimeOffset.UtcNow;

        Report Build(
            int seq,
            ReportStatus status,
            string name,
            string nid,
            string license,
            FitnessResult? result,
            params string[] failed)
        {
            var r = new Report
            {
                ReferenceNo = $"HM-2026-{1000 + seq:D4}",
                Status = status,
                Applicant = new Applicant
                {
                    Name = name,
                    NationalId = nid,
                    Dob = "1990-01-01",
                    Gender = "male",
                    Nationality = "sa",
                    Phone = "0550000000",
                    City = "riyadh",
                    BloodType = "O+",
                },
                LicenseType = license,
                Vitals = new Vitals { Height = "176", Weight = "78", BloodPressure = "120/80", Pulse = "72" },
                Exams = Exams(failed),
                Result = result,
                Recommendation = result == FitnessResult.Fit ? "لائق طبيًا." : "يلزم تقييم تخصصي.",
                DoctorId = doctor.Id,
                DoctorName = doctor.Name,
                DoctorOrg = doctor.Org,
                CreatedAt = now.AddDays(-seq),
                UpdatedAt = now.AddDays(-seq + 1),
            };
            ReportWorkflow.AddTimeline(r, doctor.Id, doctor.Name, "إنشاء التقرير");
            if (status is ReportStatus.Approved)
            {
                r.AuditorId = AuditorId;
                r.AuditorName = "د. خالد القحطاني";
                r.SubmittedAt = now.AddDays(-seq + 1);
                r.DecidedAt = now.AddDays(-seq + 2);
            }
            return r;
        }

        return
        [
            Build(1, ReportStatus.Approved, "عبدالله محمد الشهري", "1098234571", "land", FitnessResult.Fit),
            Build(2, ReportStatus.Submitted, "فهد سعد القحطاني", "1076551203", "falconry", FitnessResult.Fit),
            Build(3, ReportStatus.Returned, "ريم خالد الدوسري", "1099887766", "marine", FitnessResult.Unfit, "vision"),
            Build(4, ReportStatus.Draft, "سلطان ناصر العنزي", "1055443322", "hunting_rifle", null),
            Build(5, ReportStatus.Approved, "ماجد علي الغامدي", "1011223344", "land", FitnessResult.Fit),
            Build(6, ReportStatus.UnderReview, "تركي بندر الحربي", "1033445566", "falconry", FitnessResult.Unfit, "cardio"),
        ];
    }
}
