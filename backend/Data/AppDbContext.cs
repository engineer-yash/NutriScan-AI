using NutriScan.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace NutriScan.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<FoodScanHistory> FoodScanHistories => Set<FoodScanHistory>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();

        b.Entity<FoodScanHistory>().HasIndex(s => s.UserId);
        b.Entity<FoodScanHistory>().HasIndex(s => s.CreatedAt);

        base.OnModelCreating(b);
    }
}