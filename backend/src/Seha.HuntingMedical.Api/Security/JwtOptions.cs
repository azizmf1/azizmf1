namespace Seha.HuntingMedical.Api.Security;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "seha-hms";
    public string Audience { get; set; } = "seha-hms-clients";
    public string Key { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 120;
}
