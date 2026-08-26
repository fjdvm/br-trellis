using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class ContactMapper
{
    public static IReadOnlyList<ContactListItemDto> ToListItems(IEnumerable<Contact> contacts)
    {
        return contacts.Select(contact => new ContactListItemDto(
            contact.Id,
            contact.Name,
            contact.Email,
            contact.Phone,
            contact.Company?.Name,
            contact.SourceReferences
                .OrderBy(r => r.SourceSystem)
                .Select(r => new ContactSourceReferenceDto(r.SourceSystem, r.SourceId))
                .ToList()
        )).ToList();
    }

    public static ContactDetailDto ToDetail(Contact contact)
    {
        return new ContactDetailDto(
            contact.Id,
            contact.Name,
            contact.Email,
            contact.Phone,
            contact.SentimentScore,
            contact.LifetimeValue,
            contact.Company is null
                ? null
                : new ContactCompanyDto(contact.Company.Id, contact.Company.Name),
            contact.SourceReferences
                .OrderBy(r => r.SourceSystem)
                .Select(r => new ContactSourceReferenceDto(r.SourceSystem, r.SourceId))
                .ToList(),
            contact.CustomFieldValues.Select(v => new ContactCustomFieldValueDto(
                v.CustomFieldDefinitionId,
                v.Definition.Name,
                v.Definition.FieldType.ToString(),
                v.TextValue,
                v.NumberValue,
                v.DateValue,
                v.BoolValue,
                v.Option is null
                    ? null
                    : new ContactCustomFieldOptionDto(v.Option.Id, v.Option.Label)
            )).ToList(),
            contact.TimelineEntries
                .OrderByDescending(e => e.OccurredAt)
                .Select(e => new ContactTimelineEntryDto(
                    e.Id,
                    e.SourceModule,
                    e.EntryType,
                    e.Summary,
                    e.OccurredAt))
                .ToList(),
            contact.Orders
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new ContactOrderDto(
                    o.Id,
                    o.PlatformOrderId,
                    o.Status.ToString(),
                    o.Total,
                    o.RefundedAmount,
                    o.CreatedAt,
                    o.LineItems.Select(li => new ContactOrderLineItemDto(
                        li.ProductId,
                        li.ProductName,
                        li.Quantity,
                        li.UnitPrice)).ToList()))
                .ToList()
        );
    }
}
