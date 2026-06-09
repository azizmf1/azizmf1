namespace Seha.HuntingMedical.Api.Domain;

/// <summary>
/// نموذج الصلاحيات — يقابل دالة can() في الواجهة الأمامية.
/// يُستخدم في نقاط النهاية لحماية الإجراءات حسب الدور وحالة التقرير.
/// </summary>
public static class ReportPermissions
{
    private static readonly Dictionary<Role, HashSet<ReportAction>> Matrix = new()
    {
        [Role.Doctor] =
        [
            ReportAction.List,
            ReportAction.View,
            ReportAction.Create,
            ReportAction.Edit,
            ReportAction.Submit,
            ReportAction.Delete,
        ],
        [Role.Auditor] = [ReportAction.List, ReportAction.View, ReportAction.Audit],
        [Role.Admin] = [ReportAction.List, ReportAction.View],
    };

    public static bool Can(Role role, ReportAction action, Report? resource = null)
    {
        if (!Matrix.TryGetValue(role, out var allowed) || !allowed.Contains(action))
        {
            return false;
        }

        if (resource is null)
        {
            return true;
        }

        return action switch
        {
            ReportAction.Edit => role == Role.Doctor
                && resource.Status is ReportStatus.Draft or ReportStatus.Returned,
            ReportAction.Submit => role == Role.Doctor
                && resource.Status is ReportStatus.Draft or ReportStatus.Returned,
            ReportAction.Delete => role == Role.Doctor && resource.Status == ReportStatus.Draft,
            ReportAction.Audit => role == Role.Auditor
                && resource.Status is ReportStatus.Submitted or ReportStatus.UnderReview,
            _ => true,
        };
    }
}
