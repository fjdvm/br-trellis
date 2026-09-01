using api_crms.Authorization;
using api_crms.Data;
using api_crms.Hubs;
using api_crms.Interfaces;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("CrmsDatabase")
    ?? throw new InvalidOperationException("Connection string 'CrmsDatabase' is required.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));
builder.Services.AddSingleton(new ContactIdentityOptions
{
    AutoAcceptThreshold = builder.Configuration.GetValue<decimal?>(
        "ContactIdentity:AutoAcceptThreshold")
        ?? ContactIdentityOptions.DefaultAutoAcceptThreshold,
    NoiseFloor = builder.Configuration.GetValue<decimal?>("ContactIdentity:NoiseFloor")
        ?? ContactIdentityOptions.DefaultNoiseFloor,
});
builder.Services.AddScoped<IContactIdentityRepository, ContactIdentityRepository>();
builder.Services.AddScoped<IContactIdentityService, ContactIdentityService>();
builder.Services.AddScoped<IContactRepository, ContactRepository>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<ICustomFieldService, CustomFieldService>();
builder.Services.AddScoped<ISegmentRepository, SegmentRepository>();
builder.Services.AddScoped<ISegmentService, SegmentService>();
builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
builder.Services.AddScoped<ICompanyService, CompanyService>();

// Ecommerce services
builder.Services.AddScoped<IEcommerceRepository, EcommerceRepository>();
builder.Services.AddScoped<IEcommerceIngestionService, EcommerceIngestionService>();
builder.Services.AddScoped<IEcommerceSyncStatusService, EcommerceSyncStatusService>();
builder.Services.AddSingleton(new CartAbandonmentOptions
{
    AbandonmentThreshold = TimeSpan.FromMinutes(
        builder.Configuration.GetValue<double?>("Ecommerce:AbandonmentThresholdMinutes") ?? 60),
    SweepInterval = TimeSpan.FromMinutes(
        builder.Configuration.GetValue<double?>("Ecommerce:SweepIntervalMinutes") ?? 15),
});
builder.Services.AddScoped<ICartAbandonmentService, CartAbandonmentService>();
builder.Services.AddScoped<IWorkflowService, WorkflowService>();

// Ecommerce list/query endpoints
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IWorkflowRunRepository, WorkflowRunRepository>();
builder.Services.AddScoped<IWorkflowRunQueryService, WorkflowRunQueryService>();

// Conversations (Tickets / Messages) services
builder.Services.AddScoped<ITicketRepository, TicketRepository>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IEmailRepository, EmailRepository>();
builder.Services.AddScoped<IEmailIngestionService, EmailIngestionService>();

// Real-time Conversations push (#137). The hub is hosted directly in api-crms
// (ADR 0004); the broadcaster is the single seam every message/ticket write path
// uses to push through it.
builder.Services.AddSignalR();
builder.Services.AddScoped<IConversationBroadcaster, SignalRConversationBroadcaster>();

// Shop-chat Ticket/Message ingestion webhook (#122)
builder.Services.AddScoped<ITicketIngestionRepository, TicketIngestionRepository>();
builder.Services.AddScoped<ITicketIngestionService, TicketIngestionService>();

// Canned Replies
builder.Services.AddScoped<ICannedReplyCategoryRepository, CannedReplyCategoryRepository>();
builder.Services.AddScoped<ICannedReplyCategoryService, CannedReplyCategoryService>();
builder.Services.AddScoped<ICannedReplyRepository, CannedReplyRepository>();
builder.Services.AddScoped<ICannedReplyService, CannedReplyService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Info.Title = "api-crms";
        document.Info.Version = "v1";
        document.Info.Description =
            "Trellis CRMS backend API. Passive ecommerce webhook receiver plus "
            + "contact, company, segment, and ecommerce read endpoints. "
            + "Protected endpoints require a JWT bearer token issued by internal-auth-service.";
        return Task.CompletedTask;
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://localhost:3005").AllowAnyMethod().AllowAnyHeader();
    });
});

// JWT Bearer Authentication — validates tokens issued by internal-auth-service
var jwtAuthority = Environment.GetEnvironmentVariable("JWT_AUTHORITY") ?? "https://localhost:5001";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "crms-client";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = jwtAuthority;
        options.Audience = jwtAudience;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters.ValidateAudience = false;

        // SignalR-over-JWT: a browser can't set an Authorization header on the
        // WebSocket upgrade, so the ConversationHub client sends the staff token
        // as an `access_token` query-string value. Lift it into the request for
        // the hub path only, so the same bearer scheme authenticates the hub as
        // the rest of api-crms's agent-facing API.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken)
                    && path.StartsWithSegments(ConversationHub.HubPath))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(CrmPermissionPolicies.EcommerceCanRead, policy =>
        policy.RequireAuthenticatedUser()
              .AddRequirements(new CrmPermissionRequirement("Ecommerce", "canRead")));

    options.AddPolicy(CrmPermissionPolicies.AutomationCanRead, policy =>
        policy.RequireAuthenticatedUser()
              .AddRequirements(new CrmPermissionRequirement("Automation", "canRead")));

    options.AddPolicy(CrmPermissionPolicies.ConversationsCanWrite, policy =>
        policy.RequireAuthenticatedUser()
              .AddRequirements(new CrmPermissionRequirement("Conversations", "canWrite")));
});
builder.Services.AddSingleton<IAuthorizationHandler, CrmPermissionAuthorizationHandler>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Browsable API reference UI (Scalar), served at /scalar.
    // Consumes the OpenAPI document generated by MapOpenApi at /openapi/v1.json.
    app.MapScalarApiReference(options =>
    {
        options
            .WithTitle("api-crms | API Reference")
            .WithOpenApiRoutePattern("/openapi/{documentName}.json");
    });

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
    SeedData.Seed(dbContext);
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ConversationHub>(ConversationHub.HubPath);

app.Run();

public partial class Program { }
