using NutriScan.Api.Models;

namespace NutriScan.Api.Repositories;

public interface IFoodScanRepository
{
    Task<FoodScanHistory> AddAsync(FoodScanHistory item);
    Task<List<FoodScanHistory>> GetByUserAsync(int userId, int take = 100);
    Task<FoodScanHistory?> GetByIdAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}