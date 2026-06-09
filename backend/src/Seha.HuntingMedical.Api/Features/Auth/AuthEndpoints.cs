using Microsoft.EntityFrameworkCore;
using Seha.HuntingMedical.Api.Infrastructure;
using Seha.HuntingMedical.Api.Security;

namespace Seha.HuntingMedical.Api.Features.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group
            .MapPost("/login", async (LoginRequest req, AppDbContext db) =>
            {
                var username = req.Username.Trim().ToLowerInvariant();
                var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status401Unauthorized,
                        title: "بيانات الدخول غير صحيحة.");
                }

                return Results.Ok(new LoginResponse(true, "تم إرسال رمز التحقق (تجريبي: 1234)."));
            })
            .AllowAnonymous()
            .WithName("Login")
            .WithSummary("تسجيل الدخول بالاسم وكلمة المرور، ويعيد طلب رمز التحقق.");

        group
            .MapPost("/verify", async (VerifyOtpRequest req, AppDbContext db, JwtTokenService jwt) =>
            {
                var username = req.Username.Trim().ToLowerInvariant();
                var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (user is null || req.Otp != "1234")
                {
                    return Results.Problem(
                        statusCode: StatusCodes.Status401Unauthorized,
                        title: "رمز التحقق غير صحيح.");
                }

                return Results.Ok(new TokenResponse(jwt.Create(user), Mapping.ToDto(user)));
            })
            .AllowAnonymous()
            .WithName("VerifyOtp")
            .WithSummary("التحقق من رمز OTP وإصدار رمز الوصول (JWT).");

        group
            .MapGet("/me", async (ICurrentUser current, AppDbContext db) =>
            {
                var user = await db.Users.FindAsync(current.Id);
                return user is null ? Results.Unauthorized() : Results.Ok(Mapping.ToDto(user));
            })
            .RequireAuthorization()
            .WithName("Me")
            .WithSummary("بيانات المستخدم الحالي.");
    }
}
