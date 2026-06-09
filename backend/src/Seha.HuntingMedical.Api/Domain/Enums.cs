namespace Seha.HuntingMedical.Api.Domain;

public enum Role
{
    Doctor,
    Auditor,
    Admin,
}

public enum ReportStatus
{
    Draft,
    Submitted,
    UnderReview,
    Approved,
    Returned,
}

public enum ExamResultValue
{
    Passed,
    Failed,
}

public enum FitnessResult
{
    Fit,
    Unfit,
}

public enum ReportAction
{
    List,
    View,
    Create,
    Edit,
    Submit,
    Delete,
    Audit,
}

public enum AuditDecision
{
    Approve,
    Return,
}
