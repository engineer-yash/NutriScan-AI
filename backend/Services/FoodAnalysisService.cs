using System.Net.Http;
using System.Text;
using System.Text.Json;
using NutriScan.Api.DTOs;

namespace NutriScan.Api.Services;

public class FoodAnalysisService : IFoodAnalysisService
{
    private static readonly HttpClient _httpClient = new();
    private readonly IConfiguration _config;
    private readonly ILogger<FoodAnalysisService> _logger;

    public FoodAnalysisService(IConfiguration config, ILogger<FoodAnalysisService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<FoodAnalysisResult> AnalyzeAsync(string extractedText)
    {
        var section = _config.GetSection("AzureOpenAI");
        var endpoint = section["Endpoint"];
        var apiKey = section["ApiKey"];
        var deployment = section["DeploymentName"] ?? "gpt-4o";

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(apiKey)
            || endpoint.Contains("<YOUR-RESOURCE>", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Azure OpenAI not configured – returning mock analysis.");
            return BuildMock(extractedText);
        }

        var systemPrompt = @"You are NutriScan AI — a nutrition & food-safety analyst.
You receive raw OCR text from a packaged-food product label(ingredients, nutrition facts, claims).
Return ONLY valid JSON(no markdown, no prose) in this exact schema:

{
  ""productName"": string,
  ""category"": string,
  ""healthScore"": number (0-100, where 100 = extremely healthy, 0 = very unhealthy),
  ""healthCategory"": ""Healthy"" | ""Moderate"" | ""Unhealthy"",
  ""riskLevel"": ""Low"" | ""Medium"" | ""High"",
  ""flaggedIngredients"": [string],
  ""riskExplanation"": string,
  ""allergens"": [string],
  ""warnings"": [string],
  ""alternatives"": [string],
  ""summary"": string
}

    Rules:
        -Detect allergens from this set only: gluten, lactose, dairy, nuts, peanuts, soy, eggs, shellfish, fish, sesame.
        - healthCategory must align with healthScore: >= 70 Healthy, 40 - 69 Moderate, < 40 Unhealthy.
        - riskLevel reflects presence of harmful additives, excess sodium/ sugar / trans fats, preservatives.
        - flaggedIngredients: 0 - 6 concrete ingredient names from the label that drive the risk.
-alternatives: 2 - 5 healthier everyday substitutes(e.g., ""Whole wheat noodles"", ""Millet-based snacks"").
- warnings: short plain - English alerts(""High sodium"", ""Contains added sugars"").
- summary: 2 - 3 sentences, consumer - friendly.
- If the OCR text is empty or not a food label, return a safe default with healthScore = 50, riskLevel =""Low"", and summary explaining the label could not be read.
- JSON only.No code fences.No comments.";
        try
        {
            var url = $"{endpoint.TrimEnd('/')}/openai/deployments/{deployment}/chat/completions?api-version=2024-02-15-preview";

            var userContent = string.IsNullOrWhiteSpace(extractedText)
                ? "No OCR text was extracted from the image."
                : $"Raw OCR text from the food label:\n---\n{extractedText}\n---\n";
            var payload = new
            {
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user",   content = userContent }
                },
                temperature = 0.3,
                max_tokens = 900,
                response_format = new { type = "json_object" }
            };

            var json = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("api-key", apiKey);

            using var response = await _httpClient.SendAsync(request);
            var responseText = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Azure OpenAI failed {Status}: {Body}", response.StatusCode, responseText);
                return BuildMock(extractedText);
            }

            using var doc = JsonDocument.Parse(responseText);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(content))
                return BuildMock(extractedText);

            var parsed = JsonSerializer.Deserialize<FoodAnalysisResult>(content,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (parsed is null) return BuildMock(extractedText);

            // Defensive clamping / normalization.
            parsed.HealthScore = Math.Clamp(parsed.HealthScore, 0, 100);
            parsed.HealthCategory = NormalizeHealthCategory(parsed.HealthScore, parsed.HealthCategory);
            parsed.RiskLevel = NormalizeRisk(parsed.RiskLevel);
            parsed.Allergens = (parsed.Allergens ?? new()).Select(a => a.Trim().ToLowerInvariant()).Distinct().ToList();
            parsed.FlaggedIngredients ??= new();
            parsed.Alternatives ??= new();
            parsed.Warnings ??= new();

            if (string.IsNullOrWhiteSpace(parsed.ProductName))
                parsed.ProductName = "Unknown Food Product";
            if (string.IsNullOrWhiteSpace(parsed.Category))
                parsed.Category = "Packaged Food";

            return parsed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Food analysis failed");
            return BuildMock(extractedText);
        }
    }

    private static string NormalizeHealthCategory(int score, string? provided)
    {
        if (!string.IsNullOrWhiteSpace(provided) &&
            (provided.Equals("Healthy", StringComparison.OrdinalIgnoreCase) ||
             provided.Equals("Moderate", StringComparison.OrdinalIgnoreCase) ||
             provided.Equals("Unhealthy", StringComparison.OrdinalIgnoreCase)))
        {
            return char.ToUpper(provided[0]) + provided.Substring(1).ToLower();
        }
        return score >= 70 ? "Healthy" : score >= 40 ? "Moderate" : "Unhealthy";
    }

    private static string NormalizeRisk(string? r)
    {
        if (string.IsNullOrWhiteSpace(r)) return "Low";
        var lower = r.Trim().ToLowerInvariant();
        return lower switch
        {
            "high" => "High",
            "medium" or "med" => "Medium",
            _ => "Low"
        };
    }

    private static FoodAnalysisResult BuildMock(string text) => new()
    {
        ProductName = string.IsNullOrWhiteSpace(text) ? "Unknown Food Product" : "Sample Packaged Food",
        Category = "Packaged Food",
        HealthScore = 50,
        HealthCategory = "Moderate",
        RiskLevel = "Low",
        FlaggedIngredients = new List<string> { "Sodium", "Preservatives" },
        RiskExplanation = "OpenAI not configured – returning sample analysis. Configure AzureOpenAI in appsettings.json.",
        Allergens = new List<string>(),
        Warnings = new List<string> { "Demo mode – not a real analysis." },
        Alternatives = new List<string> { "Whole wheat alternative", "Millet-based snack", "Fresh homemade version" },
        Summary = "This is a mock response returned because Azure OpenAI is not configured. Set the Endpoint and ApiKey in appsettings.json to get real AI-powered analysis."
    };
}