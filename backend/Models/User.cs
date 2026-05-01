using System.ComponentModel.DataAnnotations;

namespace NutriScan.Api.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}