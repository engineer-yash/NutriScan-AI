using NutriScan.Api.Data;
using NutriScan.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace NutriScan.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;
    public UserRepository(AppDbContext db) => _db = db;

    public async Task<User?> GetByEmailAsync(string email) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

    public async Task<User?> GetByIdAsync(int id) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User> AddAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }
}