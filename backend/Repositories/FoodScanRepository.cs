using NutriScan.Api.Data;
using NutriScan.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace NutriScan.Api.Repositories;

public class FoodScanRepository : IFoodScanRepository
{
    private readonly AppDbContext _db;
    public FoodScanRepository(AppDbContext db) => _db = db;

    public async Task<FoodScanHistory> AddAsync(FoodScanHistory item)
    {
        _db.FoodScanHistories.Add(item);
        await _db.SaveChangesAsync();
        return item;
    }

    public async Task<List<FoodScanHistory>> GetByUserAsync(int userId, int take = 100) =>
        await _db.FoodScanHistories
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(take)
            .ToListAsync();

    public async Task<FoodScanHistory?> GetByIdAsync(int id, int userId) =>
        await _db.FoodScanHistories
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var row = await _db.FoodScanHistories
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (row is null) return false;

        _db.FoodScanHistories.Remove(row);
        await _db.SaveChangesAsync();
        return true;
    }
}