using NutriScan.Api.Models;

namespace NutriScan.Api.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        // Seed a demo user for quick first login. Idempotent.
        var demo = db.Users.FirstOrDefault(u => u.Email == "demo@nutriscan.ai");
        if (demo is null)
        {
            db.Users.Add(new User
            {
                Email = "demo@nutriscan.ai",
                FullName = "NutriScan Demo",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123")
            });
            db.SaveChanges();
        }
    }
}