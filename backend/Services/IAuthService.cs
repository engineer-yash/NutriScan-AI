using NutriScan.Api.DTOs;

namespace NutriScan.Api.Services;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
}