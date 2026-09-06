using api_crms.Data;
using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;

namespace api_crms.Services;

public sealed class CannedReplyService(
    ICannedReplyRepository replyRepository,
    AppDbContext dbContext) : ICannedReplyService
{
    public async Task<IReadOnlyList<CannedReplyListItemDto>> ListRepliesAsync(
        bool includeArchived,
        Guid? categoryId,
        CancellationToken cancellationToken)
    {
        var replies = await replyRepository.ListRepliesAsync(includeArchived, categoryId, cancellationToken);
        return CannedReplyMapper.ToListItems(replies);
    }

    public async Task<CannedReplyDetailDto?> GetReplyByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var reply = await replyRepository.GetReplyByIdAsync(id, cancellationToken);
        return reply is null ? null : CannedReplyMapper.ToDetail(reply);
    }

    public async Task<CannedReplyDetailDto> CreateReplyAsync(
        CreateCannedReplyDto input,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            throw new ArgumentException("Canned reply name is required.");
        }

        if (string.IsNullOrWhiteSpace(input.Body))
        {
            throw new ArgumentException("Canned reply body is required.");
        }

        await ValidateCategory(input.CategoryId, cancellationToken);

        var reply = new CannedReply
        {
            Id = Guid.NewGuid(),
            CategoryId = input.CategoryId,
            Name = input.Name.Trim(),
            Body = input.Body.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.CannedReplies.Add(reply);
        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await replyRepository.GetReplyByIdAsync(reply.Id, cancellationToken);
        return CannedReplyMapper.ToDetail(full!);
    }

    public async Task<CannedReplyDetailDto?> UpdateReplyAsync(
        Guid id,
        UpdateCannedReplyDto input,
        CancellationToken cancellationToken)
    {
        var reply = await dbContext.CannedReplies.FindAsync([id], cancellationToken);
        if (reply is null || reply.DeletedAt is not null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(input.Name))
        {
            reply.Name = input.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(input.Body))
        {
            reply.Body = input.Body.Trim();
        }

        if (input.CategoryId.HasValue)
        {
            await ValidateCategory(input.CategoryId.Value, cancellationToken);
            reply.CategoryId = input.CategoryId.Value;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await replyRepository.GetReplyByIdAsync(id, cancellationToken);
        return full is null ? null : CannedReplyMapper.ToDetail(full);
    }

    public async Task<bool> ArchiveReplyAsync(Guid id, CancellationToken cancellationToken)
    {
        var reply = await dbContext.CannedReplies.FindAsync([id], cancellationToken);
        if (reply is null || reply.DeletedAt is not null)
        {
            return false;
        }

        reply.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CannedReplyDetailDto?> RestoreReplyAsync(Guid id, CancellationToken cancellationToken)
    {
        var reply = await dbContext.CannedReplies.FindAsync([id], cancellationToken);
        if (reply is null || reply.DeletedAt is null)
        {
            return null;
        }

        // A reply can't be restored into an archived category — that would put an
        // active reply under a hidden category, the exact orphaning the archive
        // guard prevents. Its category must be active first.
        await ValidateCategory(reply.CategoryId, cancellationToken);

        reply.DeletedAt = null;
        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await replyRepository.GetReplyByIdAsync(id, cancellationToken);
        return full is null ? null : CannedReplyMapper.ToDetail(full);
    }

    private async Task ValidateCategory(Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await dbContext.CannedReplyCategories.FindAsync([categoryId], cancellationToken);
        if (category is null || category.DeletedAt is not null)
        {
            throw new ArgumentException("Canned reply category does not exist.");
        }
    }
}
