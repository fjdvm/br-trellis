using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ICustomFieldService
{
    Task<IReadOnlyList<ContactCustomFieldValueDto>> GetValuesForContactAsync(
        Guid contactId,
        CancellationToken cancellationToken);

    Task UpdateValueAsync(
        Guid contactId,
        CustomFieldValueUpdateDto update,
        CancellationToken cancellationToken);
}
