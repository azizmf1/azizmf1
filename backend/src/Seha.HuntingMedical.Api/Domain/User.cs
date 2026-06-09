namespace Seha.HuntingMedical.Api.Domain;

/// <summary>مستخدم النظام (طبيب / مدقّق / مدير).</summary>
public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;

    /// <summary>تجزئة كلمة المرور (لا تُخزَّن كلمة المرور كنص صريح).</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public Role Role { get; set; }
    public string Org { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
