using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace api_crms.Authorization;

public sealed class CrmPermissionRequirement(string moduleName, string verb) : IAuthorizationRequirement
{
    public string ModuleName { get; } = moduleName;
    public string Verb { get; } = verb;
}

public sealed class CrmPermissionAuthorizationHandler
    : AuthorizationHandler<CrmPermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CrmPermissionRequirement requirement)
    {
        if (HasSuperUserBypass(context.User) || HasPermission(context.User, requirement))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }

    private static bool HasSuperUserBypass(ClaimsPrincipal user) =>
        bool.TryParse(user.FindFirst("isSuperUser")?.Value, out var isSuperUser) && isSuperUser;

    private static bool HasPermission(ClaimsPrincipal user, CrmPermissionRequirement requirement)
    {
        var permissions = user.FindFirst("permissions")?.Value;
        if (string.IsNullOrWhiteSpace(permissions)) return false;

        try
        {
            using var document = JsonDocument.Parse(permissions);
            return document.RootElement.TryGetProperty("CRMS", out var crms)
                   && crms.TryGetProperty(requirement.ModuleName, out var module)
                   && module.TryGetProperty(requirement.Verb, out var permission)
                   && permission.ValueKind == JsonValueKind.True;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

public static class CrmPermissionPolicies
{
    public const string EcommerceCanRead = "EcommerceCanRead";
    public const string AutomationCanRead = "AutomationCanRead";
}
