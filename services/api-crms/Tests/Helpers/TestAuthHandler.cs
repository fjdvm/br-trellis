using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace api_crms.Tests.Helpers;

public class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (Request.Headers.ContainsKey("X-Test-Anonymous"))
            return Task.FromResult(AuthenticateResult.NoResult());

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "test-user-id"),
            new(ClaimTypes.Email, "test@example.com"),
        };

        if (Request.Headers.TryGetValue("X-Test-Permissions", out var permissions))
        {
            claims.Add(new Claim("permissions", permissions.ToString()));
        }
        else
        {
            claims.Add(new Claim("permissions", """
                {"CRMS":{"Ecommerce":{"canRead":true},"Automation":{"canRead":true}}}
                """));
        }

        if (Request.Headers.TryGetValue("X-Test-Is-SuperUser", out var isSuperUser))
            claims.Add(new Claim("isSuperUser", isSuperUser.ToString()));

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
