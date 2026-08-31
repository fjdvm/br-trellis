namespace ApiOos.Extensions;

using System.Text;
using ApiOos.Configurations;
using ApiOos.Constants;
using ApiOos.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrEmpty(connectionString))
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(connectionString));
        }
        return services;
    }

    public static IServiceCollection AddDomainServices(this IServiceCollection services)
    {
        services.AddScoped<ApiOos.Helpers.JwtTokenHelper>();
        services.AddScoped<ApiOos.Interfaces.Repositories.IUserRepository, ApiOos.Repositories.UserRepository>();
        services.AddScoped<ApiOos.Interfaces.Repositories.IProductRepository, ApiOos.Repositories.ProductRepository>();
        services.AddScoped<ApiOos.Interfaces.Repositories.ICartRepository, ApiOos.Repositories.CartRepository>();
        services.AddScoped<ApiOos.Interfaces.Repositories.IOrderRepository, ApiOos.Repositories.OrderRepository>();
        services.AddScoped<ApiOos.Interfaces.Repositories.IContactInquiryRepository, ApiOos.Repositories.ContactInquiryRepository>();
        services.AddScoped<ApiOos.Interfaces.Repositories.IReviewRepository, ApiOos.Repositories.ReviewRepository>();
        services.AddScoped<ApiOos.Interfaces.Repositories.IJobPostingRepository, ApiOos.Repositories.JobPostingRepository>();
        services.AddScoped<ApiOos.Interfaces.Repositories.IJobApplicationRepository, ApiOos.Repositories.JobApplicationRepository>();
        services.AddScoped<ApiOos.Interfaces.Services.IAuthService, ApiOos.Services.AuthService>();
        services.AddScoped<ApiOos.Interfaces.Services.IUserService, ApiOos.Services.UserService>();
        services.AddScoped<ApiOos.Interfaces.Services.IProductService, ApiOos.Services.ProductService>();
        services.AddScoped<ApiOos.Interfaces.Services.ICartService, ApiOos.Services.CartService>();
        services.AddScoped<ApiOos.Interfaces.Services.IOrderService, ApiOos.Services.OrderService>();
        services.AddScoped<ApiOos.Interfaces.Services.IContactService, ApiOos.Services.ContactService>();
        services.AddScoped<ApiOos.Interfaces.Services.ISentraCxService, ApiOos.Services.SentraCxService>();
        services.AddScoped<ApiOos.Interfaces.Services.IReviewService, ApiOos.Services.ReviewService>();
        services.AddScoped<ApiOos.Interfaces.Services.ICrmChatbotService, ApiOos.Services.CrmChatbotService>();
        services.AddScoped<ApiOos.Interfaces.Services.IJobService, ApiOos.Services.JobService>();

        // Outbound Ecommerce webhook client → api-crms (ADR 0001/0002: CRMS is a
        // passive, HMAC-signed receiver; api-oos is the caller).
        services.AddScoped<ApiOos.Interfaces.Services.IEcommerceWebhookClient, ApiOos.Services.EcommerceWebhookClient>();
        services.AddHttpClient(ApiOos.Services.EcommerceWebhookClient.HttpClientName, (sp, client) =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var crmsUrl = config["ApiCrms:BaseUrl"] ?? "https://localhost:5005";
            client.BaseAddress = new Uri(crmsUrl.EndsWith('/') ? crmsUrl : crmsUrl + "/");
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        });

        services.AddHttpClient("SentraCX", (sp, client) =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var crmUrl = config["SentraCX:ApiUrl"] ?? "http://localhost:5005";
            client.BaseAddress = new Uri(crmUrl);
        }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        });

        return services;
    }

    public static IServiceCollection AddAuthServices(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        var key = Encoding.ASCII.GetBytes(jwtSettings.SecretKey);

        // Internal-auth-service (staff) scheme — mirrors api-crms/web-crms: tokens
        // are issued by the OIDC provider at StaffAuth:Authority and validated via
        // its discovery document.
        var staffAuthority = configuration["StaffAuth:Authority"] ?? "https://localhost:5001";
        var staffAudience = configuration["StaffAuth:Audience"] ?? "oos-client";
        var requireHttpsMetadata = !string.Equals(
            configuration["ASPNETCORE_ENVIRONMENT"], "Development", StringComparison.OrdinalIgnoreCase);

        // Two JWT bearer schemes registered side-by-side. The customer scheme is the
        // default; staff endpoints opt in by name via [Authorize(AuthenticationSchemes)].
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = AuthSchemes.Customer;
            options.DefaultChallengeScheme = AuthSchemes.Customer;
        })
        // Customer scheme: api-oos's own symmetric-key JWTs (unchanged).
        .AddJwtBearer(AuthSchemes.Customer, options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        })
        // Staff scheme: tokens issued by internal-auth-service (OIDC discovery).
        .AddJwtBearer(AuthSchemes.Staff, options =>
        {
            options.Authority = staffAuthority;
            options.Audience = staffAudience;
            options.RequireHttpsMetadata = requireHttpsMetadata;
            options.TokenValidationParameters.ValidateAudience = false;
        });

        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", builder =>
            {
                builder.WithOrigins(allowedOrigins)
                       .AllowAnyHeader()
                       .AllowAnyMethod()
                       .AllowCredentials();
            });
        });
        return services;
    }

    public static IServiceCollection AddSwaggerServices(this IServiceCollection services)
    {
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "BR Online Shop API", Version = "v1" });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
        return services;
    }
}
