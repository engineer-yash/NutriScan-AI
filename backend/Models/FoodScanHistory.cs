using System.ComponentModel.DataAnnotations;

namespace NutriScan.Api.Models;

public class FoodScanHistory
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [MaxLength(200)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    public string ImageUrl { get; set; } = string.Empty;

    public string ExtractedText { get; set; } = string.Empty;

    public int HealthScore { get; set; }

    [MaxLength(20)]
    public string HealthCategory { get; set; } = "Moderate"; // Healthy | Moderate | Unhealthy

    [MaxLength(20)]
    public string RiskLevel { get; set; } = "Low"; // Low | Medium | High

    /// <summary>JSON array of allergen strings</summary>
    public string AllergensJson { get; set; } = "[]";

    /// <summary>JSON array of warning strings</summary>
    public string WarningsJson { get; set; } = "[]";

    /// <summary>JSON array of flagged ingredient strings</summary>
    public string FlaggedIngredientsJson { get; set; } = "[]";

    /// <summary>JSON array of healthier alternative strings</summary>
    public string AlternativesJson { get; set; } = "[]";

    public string RiskExplanation { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public DateTime? ExpiryDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}