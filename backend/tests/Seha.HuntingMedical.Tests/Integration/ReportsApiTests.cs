using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Seha.HuntingMedical.Api.Features;
using Xunit;

namespace Seha.HuntingMedical.Tests.Integration;

public class ReportsApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpClient> AuthedClientAsync(string username)
    {
        var client = factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(username, "1234"));
        var verify = await client.PostAsJsonAsync("/api/auth/verify", new VerifyOtpRequest(username, "1234"));
        verify.EnsureSuccessStatusCode();
        var token = await verify.Content.ReadFromJsonAsync<TokenResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token!.Token);
        return client;
    }

    private static SaveReportRequest SampleRequest() =>
        new(
            new ApplicantDto("متقدّم اختبار", "1234567890", "1990-01-01", "male", "sa", "0550000000", "riyadh", "O+"),
            "land",
            new VitalsDto("175", "75", "120/80", "70"),
            [new ExamItemDto("vision", "passed", null)],
            "fit",
            "لائق طبيًا.");

    [Fact]
    public async Task Login_then_verify_returns_token()
    {
        var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("doctor", "1234"));
        login.EnsureSuccessStatusCode();

        var verify = await client.PostAsJsonAsync("/api/auth/verify", new VerifyOtpRequest("doctor", "1234"));
        verify.EnsureSuccessStatusCode();
        var token = await verify.Content.ReadFromJsonAsync<TokenResponse>();

        Assert.False(string.IsNullOrWhiteSpace(token!.Token));
        Assert.Equal("doctor", token.User.Role);
    }

    [Fact]
    public async Task Wrong_password_is_unauthorized()
    {
        var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("doctor", "wrong"));
        Assert.Equal(HttpStatusCode.Unauthorized, login.StatusCode);
    }

    [Fact]
    public async Task Anonymous_cannot_list_reports()
    {
        var client = factory.CreateClient();
        var res = await client.GetAsync("/api/reports");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Doctor_lists_seeded_reports()
    {
        var client = await AuthedClientAsync("doctor");
        var reports = await client.GetFromJsonAsync<List<ReportSummaryDto>>("/api/reports");
        Assert.NotNull(reports);
        Assert.True(reports!.Count >= 6);
    }

    [Fact]
    public async Task Doctor_creates_draft_report()
    {
        var client = await AuthedClientAsync("doctor");
        var res = await client.PostAsJsonAsync("/api/reports", SampleRequest());

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var dto = await res.Content.ReadFromJsonAsync<ReportDto>();
        Assert.Equal("draft", dto!.Status);
        Assert.StartsWith("HM-2026-", dto.ReferenceNo);
    }

    [Fact]
    public async Task Auditor_cannot_create_report()
    {
        var client = await AuthedClientAsync("auditor");
        var res = await client.PostAsJsonAsync("/api/reports", SampleRequest());
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Create_then_submit_changes_status_to_submitted()
    {
        var client = await AuthedClientAsync("doctor");
        var created = await (await client.PostAsJsonAsync("/api/reports", SampleRequest()))
            .Content.ReadFromJsonAsync<ReportDto>();

        var res = await client.PostAsync($"/api/reports/{created!.Id}/submit", null);
        res.EnsureSuccessStatusCode();
        var dto = await res.Content.ReadFromJsonAsync<ReportDto>();

        Assert.Equal("submitted", dto!.Status);
    }
}
