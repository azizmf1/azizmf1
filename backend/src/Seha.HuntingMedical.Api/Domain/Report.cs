namespace Seha.HuntingMedical.Api.Domain;

/// <summary>التقرير الطبي لرخصة الصيد.</summary>
public class Report
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>المعرّف المقروء بصيغة HM-2026-XXXX.</summary>
    public string ReferenceNo { get; set; } = string.Empty;

    public ReportStatus Status { get; set; } = ReportStatus.Draft;

    public Applicant Applicant { get; set; } = new();
    public string LicenseType { get; set; } = "land";
    public Vitals Vitals { get; set; } = new();
    public List<ExamItem> Exams { get; set; } = [];

    public FitnessResult? Result { get; set; }
    public string Recommendation { get; set; } = string.Empty;
    public string? AuditNote { get; set; }

    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorOrg { get; set; } = string.Empty;

    public Guid? AuditorId { get; set; }
    public string? AuditorName { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? DecidedAt { get; set; }

    public List<TimelineEntry> Timeline { get; set; } = [];
}

public class Applicant
{
    public string Name { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string Dob { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Nationality { get; set; } = "sa";
    public string Phone { get; set; } = string.Empty;
    public string City { get; set; } = "riyadh";
    public string BloodType { get; set; } = string.Empty;
}

public class Vitals
{
    public string Height { get; set; } = string.Empty;
    public string Weight { get; set; } = string.Empty;
    public string BloodPressure { get; set; } = string.Empty;
    public string Pulse { get; set; } = string.Empty;
}

public class ExamItem
{
    public string Key { get; set; } = string.Empty;
    public ExamResultValue Value { get; set; } = ExamResultValue.Passed;
    public string? Note { get; set; }
}

public class TimelineEntry
{
    public DateTimeOffset At { get; set; } = DateTimeOffset.UtcNow;
    public Guid ActorId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Note { get; set; }
}
