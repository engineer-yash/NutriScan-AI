using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using NutriScan.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace NutriScan.Api.Helpers;

public class JwtHelper
{
    private readonly IConfiguration _config;

    public JwtHelper(IConfiguration config)
    {
        _config = config;
    }

    public (string Token, DateTime ExpiresAt) GenerateToken(User user)
    {
        var jwt = _config.GetSection("Jwt");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(int.Parse(jwt["ExpiryMinutes"] ?? "240"));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("fullName", user.FullName),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}