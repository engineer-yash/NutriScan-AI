namespace NutriScan.Api.Services;

public interface IBlobStorageService
{
    /// <summary>Uploads the stream and returns a readable URL (SAS if blob is private).</summary>
    Task<string> UploadAsync(Stream stream, string fileName, string contentType);
}