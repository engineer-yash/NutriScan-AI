using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace NutriScan.Api.Helpers;

/// <summary>
/// Pulls the authenticated user's id out of JWT claims.
/// Returns null for anonymous requests.
/// </summary>
public static class UserContext
{
    public static int? GetUserId(ClaimsPrincipal? principal)
    {
        if (principal?.Identity?.IsAuthenticated != true) return null;

        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(sub, out var id) ? id : null;
    }
}