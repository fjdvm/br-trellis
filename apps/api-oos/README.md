# API OOS (.NET Web API Backend)

ASP.NET Core Web API backend for the `br-online-shop` monorepo built with .NET 10.

## Project Structure (enforced by `dotnet-structure` skill)
```
apps/api-oos/
├── Configurations/         → Options classes (bound from appsettings)
├── Constants/              → App-wide constants
├── Controllers/            → API endpoints (HTTP routing & binding only)
├── Data/                   → DbContext, EF Migrations & Seed data
├── DTOs/                   → Requests & Responses shapes
├── Exceptions/             → Custom exception types
├── Extensions/             → ServiceCollection extensions
├── Filters/                → Action/Exception filters
├── Helpers/                → Utility helper classes
├── Hubs/                   → SignalR real-time hubs
├── Interfaces/             → IRepository and IService contracts
├── Mappers/                → Entity <-> DTO mappers
├── Middleware/             → Custom middleware
├── Models/                 → EF Core entities
├── Repositories/           → Data access implementations
├── Services/               → Business logic implementations
├── Validators/             → FluentValidation validators
└── tests/                  → xUnit tests mirroring source tree
```

## Running the API Locally
```bash
cd apps/api-oos
dotnet run
```
- API Base URL: `https://localhost:7004/api`
- Swagger UI: `https://localhost:7004/swagger`

## Database Migrations (Entity Framework Core)

Ensure EF Core CLI tool is installed:
```bash
dotnet tool install --global dotnet-ef
```

### Adding a New Migration
```bash
cd apps/api-oos
dotnet ef migrations add <MigrationName> --output-dir Data/Migrations
```

### Updating the Local Database
```bash
cd apps/api-oos
dotnet ef database update
```
