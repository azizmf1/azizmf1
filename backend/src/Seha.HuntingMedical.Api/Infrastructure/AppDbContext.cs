using Microsoft.EntityFrameworkCore;
using Seha.HuntingMedical.Api.Domain;

namespace Seha.HuntingMedical.Api.Infrastructure;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.Username).HasMaxLength(64).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Name).HasMaxLength(128).IsRequired();
            e.Property(x => x.Email).HasMaxLength(256);
            e.Property(x => x.Org).HasMaxLength(256);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<Report>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ReferenceNo).IsUnique();
            e.Property(x => x.ReferenceNo).HasMaxLength(32).IsRequired();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Result).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.LicenseType).HasMaxLength(32);
            e.Property(x => x.Recommendation).HasMaxLength(2000);
            e.Property(x => x.AuditNote).HasMaxLength(2000);
            e.Property(x => x.DoctorName).HasMaxLength(128);
            e.Property(x => x.DoctorOrg).HasMaxLength(256);
            e.Property(x => x.AuditorName).HasMaxLength(128);

            e.OwnsOne(x => x.Applicant, o => o.ToJson());
            e.OwnsOne(x => x.Vitals, o => o.ToJson());
            e.OwnsMany(x => x.Exams, o => o.ToJson());
            e.OwnsMany(x => x.Timeline, o => o.ToJson());
        });
    }
}
