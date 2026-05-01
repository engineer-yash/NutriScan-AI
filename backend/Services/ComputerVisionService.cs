using Azure;
using Azure.AI.Vision.ImageAnalysis;
using System.Text;
using System.Text.RegularExpressions;

namespace NutriScan.Api.Services;

public class ComputerVisionService : IComputerVisionService
{
    private readonly IConfiguration _config;
    private readonly ILogger<ComputerVisionService> _logger;

    public ComputerVisionService(IConfiguration config, ILogger<ComputerVisionService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<string> ExtractTextAsync(Stream imageStream)
    {
        var section = _config.GetSection("AzureVision");
        var endpoint = section["Endpoint"];
        var apiKey = section["ApiKey"];

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(apiKey)
            || endpoint.Contains("<YOUR-RESOURCE>", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Azure Vision not configured – returning empty OCR text.");
            return string.Empty;
        }

        try
        {
            var client = new ImageAnalysisClient(new Uri(endpoint), new AzureKeyCredential(apiKey));

            using var ms = new MemoryStream();
            await imageStream.CopyToAsync(ms);
            ms.Position = 0;

            var result = await client.AnalyzeAsync(
                BinaryData.FromStream(ms),
                VisualFeatures.Read | VisualFeatures.Caption);

            var lines = result.Value.Read?.Blocks
                .SelectMany(b => b.Lines)
                .Select(l => l.Text)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .ToList() ?? new List<string>();

            if (lines.Count == 0) return string.Empty;

            // Normalize: collapse whitespace, trim, strip stray control chars.
            var cleaned = lines
                .Select(l => Regex.Replace(l, @"\s+", " ").Trim())
                .Where(l => l.Length > 1)
                .Distinct()
                .ToList();

            var sb = new StringBuilder();
            foreach (var l in cleaned) sb.AppendLine(l);
            return sb.ToString().Trim();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Azure Vision OCR failed");
            return string.Empty;
        }
    }
}