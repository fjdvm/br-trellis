using System.Security.Cryptography;
using System.Text;
using ApiOos.Configurations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace ApiOos.Authorization;

public sealed class CrmSyncTokenAuthorizationHandler(IOptions<CrmSyncOptions> options)
    : AuthorizationHandler<CrmSyncTokenRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CrmSyncTokenRequirement requirement)
    {
        if (context.Resource is not HttpContext httpContext)
            return Task.CompletedTask;

        var token = httpContext.Request.Headers.Authorization
            .ToString()
            .Split(' ', 2, StringSplitOptions.TrimEntries)
            .Skip(1)
            .FirstOrDefault();
        var configuredToken = options.Value.ServiceToken;

        if (!string.IsNullOrWhiteSpace(configuredToken) &&
            !string.IsNullOrWhiteSpace(token) &&
            CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(token),
                Encoding.UTF8.GetBytes(configuredToken)))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
