using System.Text.Json;
using NutriScan.Api.DTOs;
using NutriScan.Api.Helpers;
using NutriScan.Api.Models;
using NutriScan.Api.Repositories;
using NutriScan.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace NutriScan.Api.Controllers;

[ApiController]
[Route("api/food")]
[Authorize]
public class FoodController : ControllerBase
{
    private readonly IBlobStorageService _blob;
    private readonly IComputerVisionService _vision;
    private readonly IFoodAnalysisService _analyzer;
    private readonly IFoodScanRepository _scans;
    private readonly ILogger<FoodController> _logger;

    private static readonly JsonSerializerOptions _json = new() { PropertyNameCaseInsensitive = true };

    public FoodController(
        IBlobStorageService blob,
        IComputerVisionService vision,
        IFoodAnalysisService analyzer,
        IFoodScanRepository scans,
        ILogger<FoodController> logger)
    {
        _blob = blob;
        _vision = vision;
        _analyzer = analyzer;
        _scans = scans;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/food/analyze
    /// Multipart upload → Blob → OCR → Expiry detection → OpenAI → DB → structured response.
    /// </summary>
    [HttpPost("analyze")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Analyze([FromForm] IFormFile file)
    {
        var userId = UserContext.GetUserId(User);
        if (userId is null) return Unauthorized(new { message = "Authentication required." });

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Image file is required." });

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only image uploads are allowed." });

        // 1. Upload to Azure Blob
        string imageUrl;
        string extractedText;
        try
        {
            await using var uploadStream = file.OpenReadStream();
            imageUrl = await _blob.UploadAsync(uploadStream, file.FileName, file.ContentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Blob upload failed");
            return StatusCode(500, new { message = "Failed to store image. Check Azure Blob configuration." });
        }

        // 2. OCR
        try
        {
            using var ocrStream = file.OpenReadStream();
            extractedText = await _vision.ExtractTextAsync(ocrStream);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OCR failed");
            extractedText = string.Empty;
        }

        // 3. Expiry detection (regex over OCR text)
        var expiry = ExpiryDetector.Detect(extractedText);

        // 4. OpenAI analysis
        var analysis = await _analyzer.AnalyzeAsync(extractedText);

        // Attach expiry to the analysis contract returned to the UI
        analysis.ExpiryDetected = expiry.Detected;
        analysis.ExpiryDate = expiry.ExpiryDate;
        analysis.DaysRemaining = expiry.DaysRemaining;

        // 5. Persist
        var record = new FoodScanHistory
        {
            UserId = userId.Value,
            ProductName = analysis.ProductName,
            Category = analysis.Category,
            ImageUrl = imageUrl,
            ExtractedText = extractedText,
            HealthScore = analysis.HealthScore,
            HealthCategory = analysis.HealthCategory,
            RiskLevel = analysis.RiskLevel,
            AllergensJson = JsonSerializer.Serialize(analysis.Allergens),
            WarningsJson = JsonSerializer.Serialize(analysis.Warnings),
            FlaggedIngredientsJson = JsonSerializer.Serialize(analysis.FlaggedIngredients),
            AlternativesJson = JsonSerializer.Serialize(analysis.Alternatives),
            RiskExplanation = analysis.RiskExplanation ?? string.Empty,
            Summary = analysis.Summary ?? string.Empty,
            ExpiryDate = analysis.ExpiryDate
        };
        var saved = await _scans.AddAsync(record);

        return Ok(new FoodScanResponse
        {
            Id = saved.Id,
            ImageUrl = saved.ImageUrl,
            ExtractedText = saved.ExtractedText,
            CreatedAt = saved.CreatedAt,
            Analysis = analysis
        });
    }

    /// <summary>GET /api/food/history — scan history for current user (newest first).</summary>
    [HttpGet("history")]
    public async Task<IActionResult> History()
    {
        var userId = UserContext.GetUserId(User);
        if (userId is null) return Unauthorized();

        var rows = await _scans.GetByUserAsync(userId.Value, 200);
        var items = rows.Select(MapToItem).ToList();
        return Ok(items);
    }

    /// <summary>GET /api/food/history/{id} — full record for a single scan (must belong to user).</summary>
    [HttpGet("history/{id:int}")]
    public async Task<IActionResult> HistoryDetail(int id)
    {
        var userId = UserContext.GetUserId(User);
        if (userId is null) return Unauthorized();

        var row = await _scans.GetByIdAsync(id, userId.Value);
        if (row is null) return NotFound();

        var today = DateTime.UtcNow.Date;
        int? daysRemaining = row.ExpiryDate.HasValue
            ? (int)(row.ExpiryDate.Value.Date - today).TotalDays
            : null;

        var analysis = new FoodAnalysisResult
        {
            ProductName = row.ProductName,
            Category = row.Category,
            HealthScore = row.HealthScore,
            HealthCategory = row.HealthCategory,
            RiskLevel = row.RiskLevel,
            FlaggedIngredients = Deserialize(row.FlaggedIngredientsJson),
            RiskExplanation = row.RiskExplanation,
            Allergens = Deserialize(row.AllergensJson),
            Warnings = Deserialize(row.WarningsJson),
            Alternatives = Deserialize(row.AlternativesJson),
            Summary = row.Summary,
            ExpiryDetected = row.ExpiryDate.HasValue,
            ExpiryDate = row.ExpiryDate,
            DaysRemaining = daysRemaining
        };

        return Ok(new FoodScanResponse
        {
            Id = row.Id,
            ImageUrl = row.ImageUrl,
            ExtractedText = row.ExtractedText,
            CreatedAt = row.CreatedAt,
            Analysis = analysis
        });
    }

    /// <summary>
    /// DELETE /api/food/history/{id} — delete a scan. Only removes the row if it
    /// belongs to the caller (UserId comes from JWT, never the route/body).
    /// </summary>
    [HttpDelete("history/{id:int}")]
    public async Task<IActionResult> DeleteHistory(int id)
    {
        var userId = UserContext.GetUserId(User);
        if (userId is null) return Unauthorized(new { message = "Authentication required." });

        var removed = await _scans.DeleteAsync(id, userId.Value);
        if (!removed)
        {
            // 404 whether the row never existed OR belongs to someone else –
            // don't leak existence of other users' data.
            return NotFound(new { message = "Scan not found." });
        }

        _logger.LogInformation("User {UserId} deleted scan {ScanId}", userId, id);
        return Ok(new { success = true, id, message = "Scan deleted." });
    }

    /// <summary>GET /api/food/dashboard — aggregated metrics for the current user.</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var userId = UserContext.GetUserId(User);
        if (userId is null) return Unauthorized();

        var rows = await _scans.GetByUserAsync(userId.Value, 500);

        var total = rows.Count;
        var avg = total == 0 ? 0 : Math.Round(rows.Average(r => (double)r.HealthScore), 1);

        var healthy = rows.Count(r => r.HealthCategory.Equals("Healthy", StringComparison.OrdinalIgnoreCase));
        var moderate = rows.Count(r => r.HealthCategory.Equals("Moderate", StringComparison.OrdinalIgnoreCase));
        var unhealthy = rows.Count(r => r.HealthCategory.Equals("Unhealthy", StringComparison.OrdinalIgnoreCase));

        var topCategories = rows
            .Where(r => !string.IsNullOrWhiteSpace(r.Category))
            .GroupBy(r => r.Category)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => new CategoryCount(g.Key, g.Count()))
            .ToList();

        var allergenCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in rows)
        {
            foreach (var a in Deserialize(row.AllergensJson))
            {
                if (string.IsNullOrWhiteSpace(a)) continue;
                allergenCounts[a] = allergenCounts.GetValueOrDefault(a) + 1;
            }
        }
        var topAllergens = allergenCounts
            .OrderByDescending(kv => kv.Value)
            .Take(5)
            .Select(kv => new AllergenCount(kv.Key, kv.Value))
            .ToList();

        var recent = rows.Take(5).Select(MapToItem).ToList();

        return Ok(new FoodDashboardResponse
        {
            TotalScans = total,
            AverageHealthScore = avg,
            HealthyCount = healthy,
            ModerateCount = moderate,
            UnhealthyCount = unhealthy,
            TopCategories = topCategories,
            TopAllergens = topAllergens,
            RecentScans = recent
        });
    }

    // ---------- helpers ----------
    private static FoodHistoryItem MapToItem(FoodScanHistory r)
    {
        var today = DateTime.UtcNow.Date;
        int? daysRemaining = r.ExpiryDate.HasValue
            ? (int)(r.ExpiryDate.Value.Date - today).TotalDays
            : null;

        return new FoodHistoryItem
        {
            Id = r.Id,
            ProductName = r.ProductName,
            Category = r.Category,
            ImageUrl = r.ImageUrl,
            HealthScore = r.HealthScore,
            HealthCategory = r.HealthCategory,
            RiskLevel = r.RiskLevel,
            Allergens = Deserialize(r.AllergensJson),
            CreatedAt = r.CreatedAt,
            ExpiryDetected = r.ExpiryDate.HasValue,
            ExpiryDate = r.ExpiryDate,
            DaysRemaining = daysRemaining
        };
    }

    private static List<string> Deserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try { return JsonSerializer.Deserialize<List<string>>(json, _json) ?? new(); }
        catch { return new(); }
    }
}