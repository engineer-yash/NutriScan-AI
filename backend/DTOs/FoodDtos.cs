namespace NutriScan.Api.DTOs;

/// <summary>
/// Full AI-generated analysis returned by the food analyzer.
/// Shape intentionally mirrors the structured JSON contract used in the frontend UI.
/// </summary>
public class FoodAnalysisResult
{
    public string ProductName { get; set; } = string.Empty;
    public string Category { get; set; } = "Packaged Food";

    public int HealthScore { get; set; } // 0-100
    public string HealthCategory { get; set; } = "Moderate"; // Healthy | Moderate | Unhealthy

    public string RiskLevel { get; set; } = "Low"; // Low | Medium | High
    public List<string> FlaggedIngredients { get; set; } = new();
    public string RiskExplanation { get; set; } = string.Empty;

    public List<string> Allergens { get; set; } = new();
    public List<string> Warnings { get; set; } = new();

    public List<string> Alternatives { get; set; } = new();

    public string Summary { get; set; } = string.Empty;

    // ---- Expiry detection (OCR upgrade) ----
    /// <summary>True if a best-before / expiry date was detected in the OCR text.</summary>
    public bool ExpiryDetected { get; set; }

    /// <summary>Detected expiry date (UTC). Null when none found.</summary>
    public DateTime? ExpiryDate { get; set; }

    /// <summary>Days remaining until <see cref=\"ExpiryDate\"/>. Negative => already expired.</summary>
    public int? DaysRemaining { get; set; }
}

/// <summary>
/// Final response sent to the UI after a scan: the analysis + persisted metadata.
/// </summary>
public class FoodScanResponse
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ExtractedText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public FoodAnalysisResult Analysis { get; set; } = new();
}

/// <summary>History row, flattened for list display.</summary>
public class FoodHistoryItem
{
    public int Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int HealthScore { get; set; }
    public string HealthCategory { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public List<string> Allergens { get; set; } = new();
    public DateTime CreatedAt { get; set; }

    // Expiry metadata surfaced in list view (used by the History page badge).
    public bool ExpiryDetected { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int? DaysRemaining { get; set; }
}

/// <summary>Aggregated metrics for the dashboard view.</summary>
public class FoodDashboardResponse
{
    public int TotalScans { get; set; }
    public double AverageHealthScore { get; set; }
    public int HealthyCount { get; set; }
    public int ModerateCount { get; set; }
    public int UnhealthyCount { get; set; }
    public List<CategoryCount> TopCategories { get; set; } = new();
    public List<AllergenCount> TopAllergens { get; set; } = new();
    public List<FoodHistoryItem> RecentScans { get; set; } = new();
}

public record CategoryCount(string Category, int Count);
public record AllergenCount(string Allergen, int Count);