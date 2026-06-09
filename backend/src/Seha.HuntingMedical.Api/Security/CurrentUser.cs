using System.Security.Claims;
using Seha.HuntingMedical.Api.Domain;

namespace Seha.HuntingMedical.Api.Security;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid Id { get; }
    string Name { get; }
    string Org { get; }
    Role Role { get; }

    /// <summary>يبني كائن مستخدم خفيف من المطالبات (Claims) للاستخدام في سير العمل.</summary>
    User ToUser();
}

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public Guid Id =>
        Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : Guid.Empty;

    public string Name => Principal?.FindFirstValue("name") ?? string.Empty;

    public string Org => Principal?.FindFirstValue("org") ?? string.Empty;

    public Role Role =>
        Enum.TryParse<Role>(Principal?.FindFirstValue(ClaimTypes.Role), out var role)
            ? role
            : Role.Doctor;

    public User ToUser() => new()
    {
        Id = Id,
        Name = Name,
        Org = Org,
        Role = Role,
    };
}
