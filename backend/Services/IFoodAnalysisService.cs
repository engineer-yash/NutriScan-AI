using NutriScan.Api.DTOs;

namespace NutriScan.Api.Services;

public interface IFoodAnalysisService
{
    Task<FoodAnalysisResult> AnalyzeAsync(string extractedText);
}