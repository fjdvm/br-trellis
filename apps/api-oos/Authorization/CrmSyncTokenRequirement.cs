using Microsoft.AspNetCore.Authorization;

namespace ApiOos.Authorization;

public sealed class CrmSyncTokenRequirement : IAuthorizationRequirement
{
    public const string PolicyName = "CrmOrderSync";
}
