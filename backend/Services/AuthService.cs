using NutriScan.Api.DTOs;
using NutriScan.Api.Helpers;
using NutriScan.Api.Models;
using NutriScan.Api.Repositories;

namespace NutriScan.Api.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly JwtHelper _jwt;

    public AuthService(IUserRepository users, JwtHelper jwt)
    {
        _users = users;
        _jwt = jwt;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest req)
    {
        var user = await _users.GetByEmailAsync(req.Email);
        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash)) return null;

        var (token, exp) = _jwt.GenerateToken(user);
        return new AuthResponse(token, user.Email, user.FullName, exp);
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest req)
    {
        var existing = await _users.GetByEmailAsync(req.Email);
        if (existing is not null) return null;

        var user = new User
        {
            Email = req.Email,
            FullName = req.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };
        await _users.AddAsync(user);

        var (token, exp) = _jwt.GenerateToken(user);
        return new AuthResponse(token, user.Email, user.FullName, exp);
    }
}