using Seha.HuntingMedical.Api.Domain;
using Xunit;

namespace Seha.HuntingMedical.Tests.Unit;

public class ReportPermissionsTests
{
    private static Report Report(ReportStatus status) => new() { Status = status };

    [Theory]
    [InlineData(ReportAction.List)]
    [InlineData(ReportAction.View)]
    [InlineData(ReportAction.Create)]
    public void Doctor_can_list_view_create(ReportAction action)
    {
        Assert.True(ReportPermissions.Can(Role.Doctor, action));
    }

    [Theory]
    [InlineData(ReportStatus.Draft, true)]
    [InlineData(ReportStatus.Returned, true)]
    [InlineData(ReportStatus.Submitted, false)]
    [InlineData(ReportStatus.Approved, false)]
    public void Doctor_edits_only_draft_or_returned(ReportStatus status, bool expected)
    {
        Assert.Equal(expected, ReportPermissions.Can(Role.Doctor, ReportAction.Edit, Report(status)));
    }

    [Fact]
    public void Doctor_deletes_only_draft()
    {
        Assert.True(ReportPermissions.Can(Role.Doctor, ReportAction.Delete, Report(ReportStatus.Draft)));
        Assert.False(ReportPermissions.Can(Role.Doctor, ReportAction.Delete, Report(ReportStatus.Submitted)));
    }

    [Fact]
    public void Doctor_cannot_audit()
    {
        Assert.False(ReportPermissions.Can(Role.Doctor, ReportAction.Audit, Report(ReportStatus.Submitted)));
    }

    [Theory]
    [InlineData(ReportStatus.Submitted, true)]
    [InlineData(ReportStatus.UnderReview, true)]
    [InlineData(ReportStatus.Draft, false)]
    [InlineData(ReportStatus.Approved, false)]
    public void Auditor_audits_only_submitted_or_under_review(ReportStatus status, bool expected)
    {
        Assert.Equal(expected, ReportPermissions.Can(Role.Auditor, ReportAction.Audit, Report(status)));
    }

    [Fact]
    public void Auditor_cannot_create_or_edit()
    {
        Assert.False(ReportPermissions.Can(Role.Auditor, ReportAction.Create));
        Assert.False(ReportPermissions.Can(Role.Auditor, ReportAction.Edit, Report(ReportStatus.Draft)));
    }

    [Fact]
    public void Admin_is_read_only()
    {
        Assert.True(ReportPermissions.Can(Role.Admin, ReportAction.List));
        Assert.True(ReportPermissions.Can(Role.Admin, ReportAction.View));
        Assert.False(ReportPermissions.Can(Role.Admin, ReportAction.Create));
        Assert.False(ReportPermissions.Can(Role.Admin, ReportAction.Audit, Report(ReportStatus.Submitted)));
    }
}
