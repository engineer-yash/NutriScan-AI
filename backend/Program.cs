using System.Text;
using NutriScan.Api.Data;
using NutriScan.Api.Helpers;
using NutriScan.Api.Repositories;
using NutriScan.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not configured");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
options.SwaggerDoc("v1", new OpenApiInfo { Title = "NutriScan AI", Version = "v1" });

options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
    Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer YOUR_TOKEN"
    });
options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, new string[]{} }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("https://nutriscan-web.azurewebsites.net")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// --- Repositories ---
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFoodScanRepository, FoodScanRepository>();

// --- Services ---
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();
builder.Services.AddScoped<IComputerVisionService, ComputerVisionService>();
builder.Services.AddScoped<IFoodAnalysisService, FoodAnalysisService>();

builder.Services.AddSingleton<JwtHelper>();

// Multipart upload size (10 MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 10 * 1024 * 1024;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => Results.Ok(new { status = "ok", service = "NutriScan AI API" }));

app.Run();