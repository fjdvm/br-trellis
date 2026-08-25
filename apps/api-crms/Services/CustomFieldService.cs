using api_crms.Data;
using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed class CustomFieldService(AppDbContext dbContext) : ICustomFieldService
{
    public async Task<IReadOnlyList<ContactCustomFieldValueDto>> GetValuesForContactAsync(
        Guid contactId,
        CancellationToken cancellationToken)
    {
        var values = await dbContext.CustomFieldValues.AsNoTracking()
            .Where(v => v.ContactId == contactId)
            .Include(v => v.Definition)
            .Include(v => v.Option)
            .ToListAsync(cancellationToken);

        return values.Select(v => new ContactCustomFieldValueDto(
            v.CustomFieldDefinitionId,
            v.Definition.Name,
            v.Definition.FieldType.ToString(),
            v.TextValue,
            v.NumberValue,
            v.DateValue,
            v.BoolValue,
            v.Option is null ? null : new ContactCustomFieldOptionDto(v.Option.Id, v.Option.Label)
        )).ToList();
    }

    public async Task UpdateValueAsync(
        Guid contactId,
        CustomFieldValueUpdateDto update,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.CustomFieldValues
            .SingleOrDefaultAsync(v =>
                v.ContactId == contactId &&
                v.CustomFieldDefinitionId == update.DefinitionId,
                cancellationToken);

        if (existing is null)
        {
            existing = new CustomFieldValue
            {
                Id = Guid.NewGuid(),
                ContactId = contactId,
                CustomFieldDefinitionId = update.DefinitionId,
            };
            dbContext.CustomFieldValues.Add(existing);
        }

        existing.TextValue = update.TextValue;
        existing.NumberValue = update.NumberValue;
        existing.DateValue = update.DateValue;
        existing.BoolValue = update.BoolValue;
        existing.OptionId = update.OptionId;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
