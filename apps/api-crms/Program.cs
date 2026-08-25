using api_crms.CustomerIdentity;
using api_crms.CustomerIdentity.Persistence;
using api_crms.Interfaces;
using api_crms.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("CrmsDatabase")
    ?? throw new InvalidOperationException("Connection string 'CrmsDatabase' is required.");

builder.Services.AddDbContext<CustomerIdentityDbContext>(options =>
    options.UseSqlite(connectionString));
builder.Services.AddSingleton(new CustomerIdentityOptions
{
    AutoAcceptThreshold = builder.Configuration.GetValue<decimal?>(
        "CustomerIdentity:AutoAcceptThreshold")
        ?? CustomerIdentityOptions.DefaultAutoAcceptThreshold,
    NoiseFloor = builder.Configuration.GetValue<decimal?>("CustomerIdentity:NoiseFloor")
        ?? CustomerIdentityOptions.DefaultNoiseFloor,
});
builder.Services.AddScoped<ICustomerIdentityRepository, CustomerIdentityRepository>();
builder.Services.AddScoped<ICustomerIdentityService, CustomerIdentityService>();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
