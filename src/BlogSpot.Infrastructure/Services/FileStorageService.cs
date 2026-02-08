using BlogSpot.Application.Interfaces;

namespace BlogSpot.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _uploadPath;

    public FileStorageService()
    {
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var subFolder = contentType.StartsWith("image/") ? "images" : "files";
        var folderPath = Path.Combine(_uploadPath, subFolder);
        Directory.CreateDirectory(folderPath);

        var filePath = Path.Combine(folderPath, uniqueFileName);
        await using var stream = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(stream, ct);

        return $"/uploads/{subFolder}/{uniqueFileName}";
    }

    public Task DeleteFileAsync(string fileUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(fileUrl)) return Task.CompletedTask;

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", fileUrl.TrimStart('/'));
        if (File.Exists(filePath))
            File.Delete(filePath);

        return Task.CompletedTask;
    }
}
