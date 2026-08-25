using api_crms.CustomerIdentity.Persistence;
using Microsoft.EntityFrameworkCore;

namespace api_crms.CustomerIdentity;

public sealed class CustomerIdentityService(
    CustomerIdentityDbContext dbContext,
    CustomerIdentityOptions options)
{
    public async Task<ResolveOrCreateCustomerResult> ResolveOrCreateCustomerAsync(
        ResolveOrCreateCustomerCommand command,
        CancellationToken cancellationToken = default)
    {
        var sourceSystem = RequireValue(command.SourceSystem, nameof(command.SourceSystem));
        var sourceId = RequireValue(command.SourceId, nameof(command.SourceId));

        var existingReference = await dbContext.SourceReferences
            .AsNoTracking()
            .SingleOrDefaultAsync(reference =>
                reference.DeletedAt == null &&
                reference.SourceSystem == sourceSystem &&
                reference.SourceId == sourceId,
                cancellationToken);

        if (existingReference is not null)
        {
            return new ResolveOrCreateCustomerResult(existingReference.CustomerId, false);
        }

        var email = NormalizeEmail(command.Email);
        var phone = NormalizePhone(command.Phone);
        var matchedCustomers = await FindMatchingCustomersAsync(email, phone, cancellationToken);

        if (matchedCustomers.Count == 1 &&
            matchedCustomers[0].Confidence >= options.AutoAcceptThreshold)
        {
            var matchedCustomer = matchedCustomers[0];
            dbContext.SourceReferences.Add(CreateLinkedSourceReference(
                matchedCustomer.CustomerId,
                sourceSystem,
                sourceId,
                matchedCustomer.Confidence));
            var concurrentCustomerId = await SaveChangesOrGetConcurrentCustomerIdAsync(
                sourceSystem,
                sourceId,
                cancellationToken);
            if (concurrentCustomerId is not null)
            {
                return new ResolveOrCreateCustomerResult(concurrentCustomerId.Value, false);
            }

            return new ResolveOrCreateCustomerResult(matchedCustomer.CustomerId, false);
        }

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = NormalizeOptional(command.Name),
            Email = email,
            Phone = phone,
        };
        dbContext.Customers.Add(customer);
        dbContext.SourceReferences.Add(CreateLinkedSourceReference(
            customer.Id,
            sourceSystem,
            sourceId,
            null));
        var concurrentCreatedCustomerId = await SaveChangesOrGetConcurrentCustomerIdAsync(
            sourceSystem,
            sourceId,
            cancellationToken);
        if (concurrentCreatedCustomerId is not null)
        {
            return new ResolveOrCreateCustomerResult(concurrentCreatedCustomerId.Value, false);
        }

        return new ResolveOrCreateCustomerResult(customer.Id, true);
    }

    private async Task<Guid?> SaveChangesOrGetConcurrentCustomerIdAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return null;
        }
        catch (DbUpdateException)
        {
            dbContext.ChangeTracker.Clear();
            return await dbContext.SourceReferences
                .AsNoTracking()
                .Where(reference =>
                    reference.DeletedAt == null &&
                    reference.SourceSystem == sourceSystem &&
                    reference.SourceId == sourceId)
                .Select(reference => (Guid?)reference.CustomerId)
                .SingleOrDefaultAsync(cancellationToken);
        }
    }

    private async Task<List<CustomerMatch>> FindMatchingCustomersAsync(
        string? email,
        string? phone,
        CancellationToken cancellationToken)
    {
        if (email is null && phone is null)
        {
            return [];
        }

        var customers = await dbContext.Customers
            .AsNoTracking()
            .Where(customer => customer.DeletedAt == null)
            .ToListAsync(cancellationToken);

        return customers
            .Select(customer => new CustomerMatch(
                customer.Id,
                CalculateConfidence(customer, email, phone)))
            .Where(match => match.Confidence > 0m)
            .ToList();
    }

    private static SourceReference CreateLinkedSourceReference(
        Guid customerId,
        string sourceSystem,
        string sourceId,
        decimal? confidence)
    {
        return new SourceReference
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            SourceSystem = sourceSystem,
            SourceId = sourceId,
            MatchConfidence = confidence,
            Status = SourceReferenceStatus.Linked,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }

    private static decimal CalculateConfidence(Customer customer, string? email, string? phone)
    {
        var emailMatches = email is not null && NormalizeEmail(customer.Email) == email;
        var phoneMatches = phone is not null && NormalizePhone(customer.Phone) == phone;
        return emailMatches || phoneMatches ? 1m : 0m;
    }

    private static string RequireValue(string value, string parameterName)
    {
        return string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("A value is required.", parameterName)
            : value.Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? NormalizeEmail(string? email)
    {
        return NormalizeOptional(email)?.ToLowerInvariant();
    }

    private static string? NormalizePhone(string? phone)
    {
        var digits = NormalizeOptional(phone)?
            .Where(char.IsDigit)
            .ToArray();
        return digits is null or { Length: 0 } ? null : new string(digits);
    }

    private sealed record CustomerMatch(Guid CustomerId, decimal Confidence);
}

public sealed record ResolveOrCreateCustomerCommand(
    string SourceSystem,
    string SourceId,
    string? Name,
    string? Email,
    string? Phone);

public sealed record ResolveOrCreateCustomerResult(Guid CustomerId, bool CreatedCustomer);
