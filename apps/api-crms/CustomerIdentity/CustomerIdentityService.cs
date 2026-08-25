using api_crms.CustomerIdentity.Persistence;
using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;

namespace api_crms.CustomerIdentity;

public sealed class CustomerIdentityService(
    ICustomerIdentityRepository customerIdentityRepository,
    CustomerIdentityOptions options) : ICustomerIdentityService
{
    public async Task<ResolveOrCreateCustomerResult> ResolveOrCreateCustomerAsync(
        ResolveOrCreateCustomerCommand command,
        CancellationToken cancellationToken = default)
    {
        var sourceSystem = RequireValue(command.SourceSystem, nameof(command.SourceSystem));
        var sourceId = RequireValue(command.SourceId, nameof(command.SourceId));
        var existingReference = await customerIdentityRepository.FindActiveSourceReferenceAsync(
            sourceSystem, sourceId, cancellationToken);

        if (existingReference is not null)
        {
            return new ResolveOrCreateCustomerResult(existingReference.CustomerId, false);
        }

        var email = NormalizeEmail(command.Email);
        var phone = NormalizePhone(command.Phone);
        var name = NormalizeOptional(command.Name);
        var matchedCustomers = await FindMatchingCustomersAsync(email, phone, name, cancellationToken);

        if (matchedCustomers is [var matchedCustomer] &&
            matchedCustomer.Confidence >= options.AutoAcceptThreshold)
        {
            customerIdentityRepository.AddSourceReference(CreateSourceReference(
                matchedCustomer.CustomerId, sourceSystem, sourceId, matchedCustomer.Confidence,
                SourceReferenceStatus.Linked));
            var concurrentCustomerId = await customerIdentityRepository
                .SaveChangesOrGetConcurrentCustomerIdAsync(sourceSystem, sourceId, cancellationToken);
            return new ResolveOrCreateCustomerResult(
                concurrentCustomerId ?? matchedCustomer.CustomerId, false);
        }

        var reviewCandidates = matchedCustomers
            .Where(match => match.Confidence >= options.NoiseFloor)
            .ToList();
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = name,
            Email = email,
            Phone = phone,
        };
        var sourceReference = CreateSourceReference(
            customer.Id,
            sourceSystem,
            sourceId,
            reviewCandidates.Count == 0 ? null : reviewCandidates.Max(match => match.Confidence),
            reviewCandidates.Count == 0
                ? SourceReferenceStatus.Linked
                : SourceReferenceStatus.PendingReview);
        customerIdentityRepository.AddCustomer(customer);
        customerIdentityRepository.AddSourceReference(sourceReference);
        customerIdentityRepository.AddIdentityMatchCandidates(reviewCandidates.Select(match =>
            new IdentityMatchCandidate
            {
                Id = Guid.NewGuid(),
                SourceReferenceId = sourceReference.Id,
                CandidateCustomerId = match.CustomerId,
                ConfidenceScore = match.Confidence,
                CreatedAt = DateTimeOffset.UtcNow,
            }));
        var concurrentCreatedCustomerId = await customerIdentityRepository
            .SaveChangesOrGetConcurrentCustomerIdAsync(sourceSystem, sourceId, cancellationToken);
        if (concurrentCreatedCustomerId is not null)
        {
            return new ResolveOrCreateCustomerResult(concurrentCreatedCustomerId.Value, false);
        }

        return new ResolveOrCreateCustomerResult(customer.Id, true);
    }

    public async Task<IReadOnlyList<PendingReviewCustomer>> ListPendingReviewCustomersAsync(
        CancellationToken cancellationToken = default)
    {
        var pendingReferences = await customerIdentityRepository
            .ListPendingReviewSourceReferencesAsync(cancellationToken);
        return PendingReviewCustomerMapper.ToReadModel(pendingReferences);
    }

    private async Task<List<CustomerMatch>> FindMatchingCustomersAsync(
        string? email,
        string? phone,
        string? name,
        CancellationToken cancellationToken)
    {
        if (email is null && phone is null && name is null)
        {
            return [];
        }

        var customers = await customerIdentityRepository.ListActiveCustomersAsync(cancellationToken);
        return customers.Select(customer => new CustomerMatch(
                customer.Id,
                CalculateConfidence(customer, email, phone, name)))
            .Where(match => match.Confidence > 0m)
            .ToList();
    }

    private static SourceReference CreateSourceReference(
        Guid customerId,
        string sourceSystem,
        string sourceId,
        decimal? confidence,
        SourceReferenceStatus status)
    {
        return new SourceReference
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            SourceSystem = sourceSystem,
            SourceId = sourceId,
            MatchConfidence = confidence,
            Status = status,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }

    private static decimal CalculateConfidence(
        Customer customer,
        string? email,
        string? phone,
        string? name)
    {
        if ((email is not null && NormalizeEmail(customer.Email) == email) ||
            (phone is not null && NormalizePhone(customer.Phone) == phone))
        {
            return 1m;
        }

        return name is not null && NormalizeName(customer.Name) == NormalizeName(name) ? 0.5m : 0m;
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

    private static string? NormalizeEmail(string? email) => NormalizeOptional(email)?.ToLowerInvariant();

    private static string? NormalizeName(string? name) => NormalizeOptional(name)?.ToLowerInvariant();

    private static string? NormalizePhone(string? phone)
    {
        var digits = NormalizeOptional(phone)?.Where(char.IsDigit).ToArray();
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
