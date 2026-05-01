namespace NutriScan.Api.Services;

public interface IComputerVisionService
{
    Task<string> ExtractTextAsync(Stream imageStream);
}
