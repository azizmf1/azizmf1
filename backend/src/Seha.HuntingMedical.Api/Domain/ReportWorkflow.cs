namespace Seha.HuntingMedical.Api.Domain;

/// <summary>انتقالات حالة التقرير وتسجيل سجل الإجراءات (Timeline).</summary>
public static class ReportWorkflow
{
    public static string NextReferenceNo(int lastSequence)
    {
        var next = Math.Max(lastSequence + 1, 1001);
        return $"HM-2026-{next:D4}";
    }

    public static void Submit(Report report, User doctor)
    {
        if (report.Status is not (ReportStatus.Draft or ReportStatus.Returned))
        {
            throw new InvalidOperationException("لا يمكن إرسال التقرير في حالته الحالية.");
        }

        var now = DateTimeOffset.UtcNow;
        report.Status = ReportStatus.Submitted;
        report.SubmittedAt = now;
        report.UpdatedAt = now;
        AddTimeline(report, doctor.Id, doctor.Name, "إرسال للتدقيق");
    }

    public static void Approve(Report report, User auditor, string? note)
    {
        EnsureAuditable(report);
        var now = DateTimeOffset.UtcNow;
        report.Status = ReportStatus.Approved;
        report.AuditorId = auditor.Id;
        report.AuditorName = auditor.Name;
        report.DecidedAt = now;
        report.UpdatedAt = now;
        AddTimeline(report, auditor.Id, auditor.Name, "اعتماد التقرير", note);
    }

    public static void Return(Report report, User auditor, string note)
    {
        EnsureAuditable(report);
        if (string.IsNullOrWhiteSpace(note))
        {
            throw new InvalidOperationException("ملاحظة الإعادة إلزامية.");
        }

        var now = DateTimeOffset.UtcNow;
        report.Status = ReportStatus.Returned;
        report.AuditorId = auditor.Id;
        report.AuditorName = auditor.Name;
        report.AuditNote = note;
        report.DecidedAt = now;
        report.UpdatedAt = now;
        AddTimeline(report, auditor.Id, auditor.Name, "إعادة للتعديل", note);
    }

    private static void EnsureAuditable(Report report)
    {
        if (report.Status is not (ReportStatus.Submitted or ReportStatus.UnderReview))
        {
            throw new InvalidOperationException("التقرير غير متاح للتدقيق في حالته الحالية.");
        }
    }

    public static void AddTimeline(
        Report report,
        Guid actorId,
        string actorName,
        string action,
        string? note = null)
    {
        report.Timeline.Add(new TimelineEntry
        {
            At = DateTimeOffset.UtcNow,
            ActorId = actorId,
            ActorName = actorName,
            Action = action,
            Note = string.IsNullOrWhiteSpace(note) ? null : note,
        });
    }
}
