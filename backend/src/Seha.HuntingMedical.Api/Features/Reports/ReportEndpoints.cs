using Microsoft.EntityFrameworkCore;
using Seha.HuntingMedical.Api.Domain;
using Seha.HuntingMedical.Api.Infrastructure;
using Seha.HuntingMedical.Api.Security;

namespace Seha.HuntingMedical.Api.Features.Reports;

public static class ReportEndpoints
{
    public static void MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports").WithTags("Reports").RequireAuthorization();

        group
            .MapGet("", async (string? status, string? q, ICurrentUser current, AppDbContext db) =>
            {
                if (!ReportPermissions.Can(current.Role, ReportAction.List))
                {
                    return Results.Forbid();
                }

                var list = await db.Reports.OrderByDescending(r => r.UpdatedAt).ToListAsync();

                if (!string.IsNullOrWhiteSpace(status))
                {
                    list = list.Where(r => Mapping.StatusApi(r.Status) == status).ToList();
                }

                if (!string.IsNullOrWhiteSpace(q))
                {
                    var term = q.Trim();
                    list = list
                        .Where(r =>
                            $"{r.Applicant.Name} {r.Applicant.NationalId} {r.ReferenceNo}".Contains(term))
                        .ToList();
                }

                return Results.Ok(list.Select(Mapping.ToSummary));
            })
            .WithName("ListReports")
            .WithSummary("قائمة التقارير مع تصفية بالحالة أو نص البحث.");

        group
            .MapGet("/{id:guid}", async (Guid id, ICurrentUser current, AppDbContext db) =>
            {
                var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
                if (report is null)
                {
                    return Results.NotFound();
                }

                return ReportPermissions.Can(current.Role, ReportAction.View, report)
                    ? Results.Ok(Mapping.ToDto(report))
                    : Results.Forbid();
            })
            .WithName("GetReport")
            .WithSummary("عرض تقرير واحد بالتفصيل.");

        group
            .MapPost("", async (SaveReportRequest req, ICurrentUser current, AppDbContext db) =>
            {
                if (!ReportPermissions.Can(current.Role, ReportAction.Create))
                {
                    return Results.Forbid();
                }

                var refs = await db.Reports.Select(r => r.ReferenceNo).ToListAsync();
                var last = refs.Select(ParseSequence).DefaultIfEmpty(1000).Max();

                var report = new Report
                {
                    ReferenceNo = ReportWorkflow.NextReferenceNo(last),
                    Status = ReportStatus.Draft,
                    DoctorId = current.Id,
                    DoctorName = current.Name,
                    DoctorOrg = current.Org,
                };
                Mapping.ApplyTo(report, req);
                ReportWorkflow.AddTimeline(report, current.Id, current.Name, "إنشاء مسودة");

                db.Reports.Add(report);
                await db.SaveChangesAsync();
                return Results.Created($"/api/reports/{report.Id}", Mapping.ToDto(report));
            })
            .WithName("CreateReport")
            .WithSummary("إنشاء تقرير جديد (مسودة) — للطبيب فقط.");

        group
            .MapPut("/{id:guid}", async (Guid id, SaveReportRequest req, ICurrentUser current, AppDbContext db) =>
            {
                var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
                if (report is null)
                {
                    return Results.NotFound();
                }

                if (!ReportPermissions.Can(current.Role, ReportAction.Edit, report))
                {
                    return Results.Forbid();
                }

                Mapping.ApplyTo(report, req);
                ReportWorkflow.AddTimeline(report, current.Id, current.Name, "تحديث التقرير");
                await db.SaveChangesAsync();
                return Results.Ok(Mapping.ToDto(report));
            })
            .WithName("UpdateReport")
            .WithSummary("تعديل تقرير (مسودة أو مُعاد) — للطبيب فقط.");

        group
            .MapPost("/{id:guid}/submit", async (Guid id, ICurrentUser current, AppDbContext db) =>
            {
                var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
                if (report is null)
                {
                    return Results.NotFound();
                }

                if (!ReportPermissions.Can(current.Role, ReportAction.Submit, report))
                {
                    return Results.Forbid();
                }

                try
                {
                    ReportWorkflow.Submit(report, current.ToUser());
                }
                catch (InvalidOperationException ex)
                {
                    return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
                }

                await db.SaveChangesAsync();
                return Results.Ok(Mapping.ToDto(report));
            })
            .WithName("SubmitReport")
            .WithSummary("إرسال التقرير للتدقيق — للطبيب فقط.");

        group
            .MapPost("/{id:guid}/audit", async (Guid id, AuditRequest req, ICurrentUser current, AppDbContext db) =>
            {
                var report = await db.Reports.FirstOrDefaultAsync(r => r.Id == id);
                if (report is null)
                {
                    return Results.NotFound();
                }

                if (!ReportPermissions.Can(current.Role, ReportAction.Audit, report))
                {
                    return Results.Forbid();
                }

                try
                {
                    var auditor = current.ToUser();
                    switch (req.Decision)
                    {
                        case "approve":
                            ReportWorkflow.Approve(report, auditor, req.Note);
                            break;
                        case "return":
                            ReportWorkflow.Return(report, auditor, req.Note ?? string.Empty);
                            break;
                        default:
                            return Results.Problem(
                                statusCode: StatusCodes.Status400BadRequest,
                                title: "قرار التدقيق غير صالح.");
                    }
                }
                catch (InvalidOperationException ex)
                {
                    return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
                }

                await db.SaveChangesAsync();
                return Results.Ok(Mapping.ToDto(report));
            })
            .WithName("AuditReport")
            .WithSummary("اعتماد أو إعادة التقرير — للمدقّق فقط.");
    }

    private static int ParseSequence(string referenceNo)
    {
        var parts = referenceNo.Split('-');
        return parts.Length == 3 && int.TryParse(parts[2], out var n) ? n : 0;
    }
}
