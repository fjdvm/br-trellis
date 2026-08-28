using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IEcommerceSyncStatusService
{
    Task<EcommerceSyncStatusDto> GetSyncStatusAsync(CancellationToken cancellationToken);
}
