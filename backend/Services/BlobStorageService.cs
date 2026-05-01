using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;

namespace NutriScan.Api.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly IConfiguration _config;
    private readonly ILogger<BlobStorageService> _logger;

    public BlobStorageService(IConfiguration config, ILogger<BlobStorageService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType)
    {
        var section = _config.GetSection("AzureBlob");
        var connStr = section["ConnectionString"];
        var container = section["ContainerName"] ?? "nutriscan-images";

        if (string.IsNullOrWhiteSpace(connStr) || connStr.Contains("<ACCOUNT>", StringComparison.OrdinalIgnoreCase))
        {
            // Configuration missing – surface a clear error instead of silently failing.
            throw new InvalidOperationException("Azure Blob Storage is not configured. Update appsettings.json 'AzureBlob' section.");
        }

        var service = new BlobServiceClient(connStr);
        var containerClient = service.GetBlobContainerClient(container);
        await containerClient.CreateIfNotExistsAsync();

        var unique = $"{Guid.NewGuid():N}_{fileName}";
        var blob = containerClient.GetBlobClient(unique);

        await blob.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType });

        // Private container → return a 30-day SAS URL.
        if (blob.CanGenerateSasUri)
        {
            var sasUri = blob.GenerateSasUri(
                BlobSasPermissions.Read,
                DateTimeOffset.UtcNow.AddDays(30));
            return sasUri.ToString();
        }

        return blob.Uri.ToString();
    }
}