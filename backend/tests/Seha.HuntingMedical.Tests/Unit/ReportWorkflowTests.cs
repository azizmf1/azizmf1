using Seha.HuntingMedical.Api.Domain;
using Xunit;

namespace Seha.HuntingMedical.Tests.Unit;

public class ReportWorkflowTests
{
    private static readonly User Doctor = new() { Id = Guid.NewGuid(), Name = "د. سارة", Role = Role.Doctor };
    private static readonly User Auditor = new() { Id = Guid.NewGuid(), Name = "د. خالد", Role = Role.Auditor };

    [Fact]
    public void NextReferenceNo_formats_with_padding()
    {
        Assert.Equal("HM-2026-1013", ReportWorkflow.NextReferenceNo(1012));
        Assert.Equal("HM-2026-1001", ReportWorkflow.NextReferenceNo(0));
    }

    [Fact]
    public void Submit_moves_draft_to_submitted_and_logs()
    {
        var report = new Report { Status = ReportStatus.Draft };

        ReportWorkflow.Submit(report, Doctor);

        Assert.Equal(ReportStatus.Submitted, report.Status);
        Assert.NotNull(report.SubmittedAt);
        Assert.Single(report.Timeline);
        Assert.Equal("إرسال للتدقيق", report.Timeline[0].Action);
    }

    [Fact]
    public void Submit_throws_when_not_draft_or_returned()
    {
        var report = new Report { Status = ReportStatus.Approved };
        Assert.Throws<InvalidOperationException>(() => ReportWorkflow.Submit(report, Doctor));
    }

    [Fact]
    public void Approve_sets_approved_with_auditor()
    {
        var report = new Report { Status = ReportStatus.Submitted };

        ReportWorkflow.Approve(report, Auditor, note: null);

        Assert.Equal(ReportStatus.Approved, report.Status);
        Assert.Equal(Auditor.Id, report.AuditorId);
        Assert.NotNull(report.DecidedAt);
    }

    [Fact]
    public void Return_requires_note()
    {
        var report = new Report { Status = ReportStatus.Submitted };
        Assert.Throws<InvalidOperationException>(() => ReportWorkflow.Return(report, Auditor, "  "));
    }

    [Fact]
    public void Return_sets_returned_with_audit_note()
    {
        var report = new Report { Status = ReportStatus.UnderReview };

        ReportWorkflow.Return(report, Auditor, "بيانات ناقصة");

        Assert.Equal(ReportStatus.Returned, report.Status);
        Assert.Equal("بيانات ناقصة", report.AuditNote);
        Assert.Equal("إعادة للتعديل", report.Timeline[^1].Action);
    }

    [Fact]
    public void Approve_throws_when_not_auditable()
    {
        var report = new Report { Status = ReportStatus.Draft };
        Assert.Throws<InvalidOperationException>(() => ReportWorkflow.Approve(report, Auditor, null));
    }
}
