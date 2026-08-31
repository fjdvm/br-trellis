namespace ApiOos.Constants;

/// <summary>
/// Names of the two side-by-side JWT bearer authentication schemes registered
/// in api-oos. Every controller/action tags itself to exactly one of these
/// (or opts out explicitly with <c>[AllowAnonymous]</c>) so that no endpoint is
/// unscoped by omission.
/// </summary>
public static class AuthSchemes
{
    /// <summary>
    /// Shop customers. Validates api-oos's own symmetric-key JWTs (issued by
    /// <c>AuthController</c>). Unchanged from the pre-integration behaviour.
    /// </summary>
    public const string Customer = "Customer";

    /// <summary>
    /// Internal staff. Validates tokens issued by internal-auth-service (the
    /// same OIDC provider <c>api-crms</c>/<c>web-crms</c> authenticate staff with).
    /// </summary>
    public const string Staff = "Staff";
}
