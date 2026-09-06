namespace ApiOos.DTOs.Responses;

/// <summary>Identity of an authenticated staff member as seen by api-oos.</summary>
public sealed class StaffIdentityResponse
{
    public string? Subject { get; init; }
    public string? Email { get; init; }
    public string? Name { get; init; }
}
