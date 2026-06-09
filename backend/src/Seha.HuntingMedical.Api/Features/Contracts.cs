namespace Seha.HuntingMedical.Api.Features;

// ----- المصادقة -----
public record LoginRequest(string Username, string Password);

public record LoginResponse(bool RequiresOtp, string Message);

public record VerifyOtpRequest(string Username, string Otp);

public record UserDto(Guid Id, string Username, string Name, string Role, string Org, string Email);

public record TokenResponse(string Token, UserDto User);

// ----- التقارير -----
public record ApplicantDto(
    string Name,
    string NationalId,
    string Dob,
    string Gender,
    string Nationality,
    string Phone,
    string City,
    string BloodType);

public record VitalsDto(string Height, string Weight, string BloodPressure, string Pulse);

public record ExamItemDto(string Key, string Value, string? Note);

public record TimelineDto(
    DateTimeOffset At,
    Guid ActorId,
    string ActorName,
    string Action,
    string? Note);

public record ReportSummaryDto(
    Guid Id,
    string ReferenceNo,
    string Status,
    string ApplicantName,
    string NationalId,
    string LicenseType,
    string? Result,
    DateTimeOffset UpdatedAt);

public record ReportDto(
    Guid Id,
    string ReferenceNo,
    string Status,
    ApplicantDto Applicant,
    string LicenseType,
    VitalsDto Vitals,
    List<ExamItemDto> Exams,
    string? Result,
    string Recommendation,
    string? AuditNote,
    string DoctorName,
    string DoctorOrg,
    string? AuditorName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset? DecidedAt,
    List<TimelineDto> Timeline);

public record SaveReportRequest(
    ApplicantDto Applicant,
    string LicenseType,
    VitalsDto Vitals,
    List<ExamItemDto> Exams,
    string? Result,
    string Recommendation);

public record AuditRequest(string Decision, string? Note);
