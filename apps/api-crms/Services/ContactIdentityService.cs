using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;

namespace api_crms.Services;

public sealed class ContactIdentityService(
    IContactIdentityRepository contactIdentityRepository,
    ContactIdentityOptions options) : IContactIdentityService
{
    public async Task<ResolveOrCreateContactResult> ResolveOrCreateContactAsync(
        ResolveOrCreateContactCommand command,
        CancellationToken cancellationToken = default)
    {
        var sourceSystem = RequireValue(command.SourceSystem, nameof(command.SourceSystem));
        var sourceId = RequireValue(command.SourceId, nameof(command.SourceId));
        var existingReference = await contactIdentityRepository.FindActiveSourceReferenceAsync(
            sourceSystem, sourceId, cancellationToken);

        if (existingReference is not null)
        {
            return new ResolveOrCreateContactResult(existingReference.ContactId, false);
        }

        var email = NormalizeEmail(command.Email);
        var phone = NormalizePhone(command.Phone);
        var name = NormalizeOptional(command.Name);
        var matchedContacts = await FindMatchingContactsAsync(email, phone, name, cancellationToken);

        if (matchedContacts is [var matchedContact] &&
            matchedContact.Confidence >= options.AutoAcceptThreshold)
        {
            contactIdentityRepository.AddSourceReference(CreateSourceReference(
                matchedContact.ContactId, sourceSystem, sourceId, matchedContact.Confidence,
                SourceReferenceStatus.Linked));
            var concurrentContactId = await contactIdentityRepository
                .SaveChangesOrGetConcurrentContactIdAsync(sourceSystem, sourceId, cancellationToken);
            return new ResolveOrCreateContactResult(
                concurrentContactId ?? matchedContact.ContactId, false);
        }

        var reviewCandidates = matchedContacts
            .Where(match => match.Confidence >= options.NoiseFloor)
            .ToList();
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = name,
            Email = email,
            Phone = phone,
        };
        var sourceReference = CreateSourceReference(
            contact.Id,
            sourceSystem,
            sourceId,
            reviewCandidates.Count == 0 ? null : reviewCandidates.Max(match => match.Confidence),
            reviewCandidates.Count == 0
                ? SourceReferenceStatus.Linked
                : SourceReferenceStatus.PendingReview);
        contactIdentityRepository.AddContact(contact);
        contactIdentityRepository.AddSourceReference(sourceReference);
        contactIdentityRepository.AddIdentityMatchCandidates(reviewCandidates.Select(match =>
            new IdentityMatchCandidate
            {
                Id = Guid.NewGuid(),
                SourceReferenceId = sourceReference.Id,
                CandidateContactId = match.ContactId,
                ConfidenceScore = match.Confidence,
                CreatedAt = DateTimeOffset.UtcNow,
            }));
        var concurrentCreatedContactId = await contactIdentityRepository
            .SaveChangesOrGetConcurrentContactIdAsync(sourceSystem, sourceId, cancellationToken);
        if (concurrentCreatedContactId is not null)
        {
            return new ResolveOrCreateContactResult(concurrentCreatedContactId.Value, false);
        }

        return new ResolveOrCreateContactResult(contact.Id, true);
    }

    public async Task<IReadOnlyList<PendingReviewContact>> ListPendingReviewContactsAsync(
        CancellationToken cancellationToken = default)
    {
        var pendingReferences = await contactIdentityRepository
            .ListPendingReviewSourceReferencesAsync(cancellationToken);
        return PendingReviewContactMapper.ToReadModel(pendingReferences);
    }

    private async Task<List<ContactMatch>> FindMatchingContactsAsync(
        string? email,
        string? phone,
        string? name,
        CancellationToken cancellationToken)
    {
        if (email is null && phone is null && name is null)
        {
            return [];
        }

        var contacts = await contactIdentityRepository.ListActiveContactsAsync(cancellationToken);
        return contacts.Select(contact => new ContactMatch(
                contact.Id,
                CalculateConfidence(contact, email, phone, name)))
            .Where(match => match.Confidence > 0m)
            .ToList();
    }

    private static SourceReference CreateSourceReference(
        Guid contactId,
        string sourceSystem,
        string sourceId,
        decimal? confidence,
        SourceReferenceStatus status)
    {
        return new SourceReference
        {
            Id = Guid.NewGuid(),
            ContactId = contactId,
            SourceSystem = sourceSystem,
            SourceId = sourceId,
            MatchConfidence = confidence,
            Status = status,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }

    private static decimal CalculateConfidence(
        Contact contact,
        string? email,
        string? phone,
        string? name)
    {
        if ((email is not null && NormalizeEmail(contact.Email) == email) ||
            (phone is not null && NormalizePhone(contact.Phone) == phone))
        {
            return 1m;
        }

        return name is not null && NormalizeName(contact.Name) == NormalizeName(name) ? 0.5m : 0m;
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

    private sealed record ContactMatch(Guid ContactId, decimal Confidence);
}

public sealed record ResolveOrCreateContactCommand(
    string SourceSystem,
    string SourceId,
    string? Name,
    string? Email,
    string? Phone);

public sealed record ResolveOrCreateContactResult(Guid ContactId, bool CreatedContact);

public sealed class ContactIdentityOptions
{
    public const decimal DefaultAutoAcceptThreshold = 0.9m;
    public const decimal DefaultNoiseFloor = 0.1m;

    public decimal AutoAcceptThreshold { get; init; } = DefaultAutoAcceptThreshold;

    public decimal NoiseFloor { get; init; } = DefaultNoiseFloor;
}
