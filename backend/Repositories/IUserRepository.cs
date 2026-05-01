using NutriScan.Api.Models;

namespace NutriScan.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<User> AddAsync(User user);
}