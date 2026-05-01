using NutriScan.Api.DTOs;
using NutriScan.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace NutriScan.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (req is null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new
            {
                message = "Email and password are required." });

        var result = await _auth.LoginAsync(req);
        return result is null
            ? Unauthorized(new
            {
                message = "Invalid credentials." })
            : Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (req is null || string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new
            {
                message = "Email and password are required." });

        var result = await _auth.RegisterAsync(req);
        return result is null
            ? Conflict(new
            {
                message = "Email already registered." })
            : Ok(result);
    }
}