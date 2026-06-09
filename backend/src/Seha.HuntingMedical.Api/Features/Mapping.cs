using Seha.HuntingMedical.Api.Domain;

namespace Seha.HuntingMedical.Api.Features;

/// <summary>تحويل بين كيانات النطاق وعقود الـ API (بصيغ الواجهة الأمامية).</summary>
public static class Mapping
{
    public static UserDto ToDto(User u) =>
        new(u.Id, u.Username, u.Name, u.Role.ToString().ToLowerInvariant(), u.Org, u.Email);

    public static string StatusApi(ReportStatus s) => s switch
    {
        ReportStatus.Draft => "draft",
        ReportStatus.Submitted => "submitted",
        ReportStatus.UnderReview => "under_review",
        ReportStatus.Approved => "approved",
        ReportStatus.Returned => "returned",
        _ => "draft",
    };

    public static string? ResultApi(FitnessResult? r) => r switch
    {
        FitnessResult.Fit => "fit",
        FitnessResult.Unfit => "unfit",
        _ => null,
    };

    public static FitnessResult? ResultFromApi(string? s) => s switch
    {
        "fit" => FitnessResult.Fit,
        "unfit" => FitnessResult.Unfit,
        _ => null,
    };

    public static string ExamApi(ExamResultValue v) =>
        v == ExamResultValue.Failed ? "failed" : "passed";

    public static ExamResultValue ExamFromApi(string v) =>
        v == "failed" ? ExamResultValue.Failed : ExamResultValue.Passed;

    public static ReportSummaryDto ToSummary(Report r) =>
        new(
            r.Id,
            r.ReferenceNo,
            StatusApi(r.Status),
            r.Applicant.Name,
            r.Applicant.NationalId,
            r.LicenseType,
            ResultApi(r.Result),
            r.UpdatedAt);

    public static ReportDto ToDto(Report r) =>
        new(
            r.Id,
            r.ReferenceNo,
            StatusApi(r.Status),
            new ApplicantDto(
                r.Applicant.Name,
                r.Applicant.NationalId,
                r.Applicant.Dob,
                r.Applicant.Gender,
                r.Applicant.Nationality,
                r.Applicant.Phone,
                r.Applicant.City,
                r.Applicant.BloodType),
            r.LicenseType,
            new VitalsDto(r.Vitals.Height, r.Vitals.Weight, r.Vitals.BloodPressure, r.Vitals.Pulse),
            r.Exams.Select(e => new ExamItemDto(e.Key, ExamApi(e.Value), e.Note)).ToList(),
            ResultApi(r.Result),
            r.Recommendation,
            r.AuditNote,
            r.DoctorName,
            r.DoctorOrg,
            r.AuditorName,
            r.CreatedAt,
            r.UpdatedAt,
            r.SubmittedAt,
            r.DecidedAt,
            r.Timeline
                .Select(t => new TimelineDto(t.At, t.ActorId, t.ActorName, t.Action, t.Note))
                .ToList());

    public static void ApplyTo(Report r, SaveReportRequest req)
    {
        r.Applicant = new Applicant
        {
            Name = req.Applicant.Name,
            NationalId = req.Applicant.NationalId,
            Dob = req.Applicant.Dob,
            Gender = req.Applicant.Gender,
            Nationality = req.Applicant.Nationality,
            Phone = req.Applicant.Phone,
            City = req.Applicant.City,
            BloodType = req.Applicant.BloodType,
        };
        r.LicenseType = req.LicenseType;
        r.Vitals = new Vitals
        {
            Height = req.Vitals.Height,
            Weight = req.Vitals.Weight,
            BloodPressure = req.Vitals.BloodPressure,
            Pulse = req.Vitals.Pulse,
        };
        r.Exams = req.Exams
            .Select(e => new ExamItem { Key = e.Key, Value = ExamFromApi(e.Value), Note = e.Note })
            .ToList();
        r.Result = ResultFromApi(req.Result);
        r.Recommendation = req.Recommendation;
        r.UpdatedAt = DateTimeOffset.UtcNow;
    }
}
