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

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
