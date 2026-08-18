using BlogSpot.Application.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace BlogSpot.Infrastructure.Services;

/// <summary>
/// Uploads files to Cloudinary when credentials are configured,
/// falls back to local wwwroot/uploads for local development.
/// </summary>
public class FileStorageService : IFileStorageService
{
    private readonly Cloudinary? _cloudinary;
    private readonly string _localUploadPath;
    private readonly bool _useCloudinary;

    public FileStorageService(IConfiguration configuration, IWebHostEnvironment env)
    {
        _localUploadPath = Path.Combine(
            env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
            "uploads");
        Directory.CreateDirectory(_localUploadPath);

        var cloudName  = configuration["Cloudinary:CloudName"];
        var apiKey     = configuration["Cloudinary:ApiKey"];
        var apiSecret  = configuration["Cloudinary:ApiSecret"];

        if (!string.IsNullOrWhiteSpace(cloudName)
            && !string.IsNullOrWhiteSpace(apiKey)
            && !string.IsNullOrWhiteSpace(apiSecret))
        {
            _cloudinary = new Cloudinary(new Account(cloudName, apiKey, apiSecret));
            _useCloudinary = true;
        }
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName,
        string contentType, CancellationToken ct = default)
    {
        if (_useCloudinary && _cloudinary != null)
            return await UploadToCloudinaryAsync(fileStream, fileName, contentType, ct);

        return await UploadLocalAsync(fileStream, fileName, contentType, ct);
    }

    public async Task DeleteFileAsync(string fileUrl, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(fileUrl)) return;

        if (_useCloudinary && _cloudinary != null && fileUrl.Contains("cloudinary.com"))
        {
            await DeleteFromCloudinaryAsync(fileUrl);
            return;
        }

        // Local deletion
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
            fileUrl.TrimStart('/'));
        if (File.Exists(filePath)) File.Delete(filePath);
    }

    // --- Private helpers ---

    private async Task<string> UploadToCloudinaryAsync(Stream fileStream, string fileName,
        string contentType, CancellationToken ct)
    {
        var publicId = $"blogspot/{(contentType.StartsWith("image/") ? "images" : "files")}/{Guid.NewGuid()}";

        // Use ImageUploadParams for images; for other files Cloudinary auto-detects resource type
        var result = await _cloudinary!.UploadAsync(new ImageUploadParams
        {
            File       = new FileDescription(fileName, fileStream),
            PublicId   = publicId,
            Overwrite  = false
        }, ct);

        if (result.Error != null)
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");

        return result.SecureUrl.ToString();
    }

    private async Task UploadLocalAsync_Delete_Dummy() => await Task.CompletedTask;

    private async Task<string> UploadLocalAsync(Stream fileStream, string fileName,
        string contentType, CancellationToken ct)
    {
        var unique    = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var subFolder = contentType.StartsWith("image/") ? "images" : "files";
        var folder    = Path.Combine(_localUploadPath, subFolder);
        Directory.CreateDirectory(folder);

        var filePath = Path.Combine(folder, unique);
        await using var fs = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(fs, ct);

        return $"/uploads/{subFolder}/{unique}";
    }

    private async Task DeleteFromCloudinaryAsync(string fileUrl)
    {
        try
        {
            var uri      = new Uri(fileUrl);
            var segments = uri.AbsolutePath.Split('/');
            var uploadIdx = Array.IndexOf(segments, "upload");
            if (uploadIdx < 0) return;

            // Skip the version segment (v1234567) then join the rest as public_id
            var parts    = segments.Skip(uploadIdx + 2).ToArray();
            var publicId = string.Join("/", parts);

            // Strip file extension
            var dot = publicId.LastIndexOf('.');
            if (dot > 0) publicId = publicId[..dot];

            await _cloudinary!.DestroyAsync(new DeletionParams(publicId));
        }
        catch { /* best effort — don't fail the request */ }
    }
}

