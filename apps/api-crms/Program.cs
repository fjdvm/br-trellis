using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;

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

// Ecommerce services
builder.Services.AddScoped<IEcommerceRepository, EcommerceRepository>();
builder.Services.AddScoped<IEcommerceIngestionService, EcommerceIngestionService>();
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

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://localhost:3005").AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
    SeedData.Seed(dbContext);
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthorization();

app.MapControllers();

app.Run();
