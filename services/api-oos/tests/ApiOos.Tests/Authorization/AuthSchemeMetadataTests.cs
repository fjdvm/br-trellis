namespace ApiOos.Tests.Authorization;

using System.Reflection;
using ApiOos.Constants;
using ApiOos.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Xunit;

/// <summary>
/// Verifies the multi-scheme auth contract for #120 at the controller-metadata
/// seam: every endpoint carries an explicit auth decision (a named scheme or an
/// explicit anonymous designation), each endpoint is tagged to the correct
/// scheme, and the dead reverse-pull mechanism no longer exists.
/// </summary>
public class AuthSchemeMetadataTests
{
    private static readonly Assembly ApiAssembly = typeof(ProductsController).Assembly;

    private static IEnumerable<Type> Controllers() =>
        ApiAssembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract);

    private static IEnumerable<MethodInfo> Actions(Type controller) =>
        controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => !m.IsSpecialName
                && m.GetCustomAttributes<HttpMethodAttribute>().Any());

    /// <summary>An endpoint is explicitly decided if the action or its controller
    /// carries either an <see cref="AuthorizeAttribute"/> or an
    /// <see cref="AllowAnonymousAttribute"/>.</summary>
    private static bool HasExplicitDecision(MethodInfo action)
    {
        var controller = action.DeclaringType!;
        bool actionAuthz = action.GetCustomAttributes<AuthorizeAttribute>().Any();
        bool actionAnon = action.GetCustomAttributes<AllowAnonymousAttribute>().Any();
        bool ctrlAuthz = controller.GetCustomAttributes<AuthorizeAttribute>().Any();
        bool ctrlAnon = controller.GetCustomAttributes<AllowAnonymousAttribute>().Any();
        return actionAuthz || actionAnon || ctrlAuthz || ctrlAnon;
    }

    private static IEnumerable<string> SchemesFor(MethodInfo action)
    {
        var controller = action.DeclaringType!;
        var attrs = action.GetCustomAttributes<AuthorizeAttribute>()
            .Concat(controller.GetCustomAttributes<AuthorizeAttribute>());
        return attrs
            .Select(a => a.AuthenticationSchemes)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .SelectMany(s => s!.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries));
    }

    [Fact]
    public void EveryEndpoint_HasAnExplicitAuthDecision()
    {
        var unscoped = Controllers()
            .SelectMany(Actions)
            .Where(a => !HasExplicitDecision(a))
            .Select(a => $"{a.DeclaringType!.Name}.{a.Name}")
            .ToList();

        unscoped.Should().BeEmpty(
            "every endpoint must be tagged to a scheme or explicitly anonymous — no endpoint unscoped by omission");
    }

    [Fact]
    public void EveryAuthorizeAttribute_NamesAKnownScheme()
    {
        var known = new[] { AuthSchemes.Customer, AuthSchemes.Staff };

        var offenders = Controllers()
            .SelectMany(Actions)
            .Where(a => a.GetCustomAttributes<AuthorizeAttribute>().Any()
                        || a.DeclaringType!.GetCustomAttributes<AuthorizeAttribute>().Any())
            .Where(a => !a.GetCustomAttributes<AllowAnonymousAttribute>().Any())
            .Where(a => SchemesFor(a).All(s => !known.Contains(s)) || !SchemesFor(a).Any())
            .Select(a => $"{a.DeclaringType!.Name}.{a.Name}")
            .ToList();

        offenders.Should().BeEmpty(
            "every [Authorize] endpoint must name one of the known schemes (Customer or Staff)");
    }

    [Theory]
    [InlineData("CartController")]
    [InlineData("OrdersController")]
    [InlineData("UsersController")]
    public void CustomerControllers_AreTaggedCustomerScheme(string controllerName)
    {
        var controller = Controllers().Single(c => c.Name == controllerName);
        var schemes = controller.GetCustomAttributes<AuthorizeAttribute>()
            .Select(a => a.AuthenticationSchemes)
            .ToList();

        schemes.Should().ContainSingle()
            .Which.Should().Be(AuthSchemes.Customer);
    }

    [Fact]
    public void StaffController_IsTaggedStaffScheme()
    {
        var controller = Controllers().SingleOrDefault(c => c.Name == "StaffController");
        controller.Should().NotBeNull("a staff-scoped endpoint must exist to prove the internal-auth scheme");

        controller!.GetCustomAttributes<AuthorizeAttribute>()
            .Select(a => a.AuthenticationSchemes)
            .Should().ContainSingle()
            .Which.Should().Be(AuthSchemes.Staff);
    }

    [Theory]
    [InlineData("ApiOos.Controllers.OrderSyncController")]
    [InlineData("ApiOos.Authorization.CrmSyncTokenRequirement")]
    [InlineData("ApiOos.Authorization.CrmSyncTokenAuthorizationHandler")]
    [InlineData("ApiOos.Configurations.CrmSyncOptions")]
    public void DeadReversePullMechanism_IsDeleted(string fullTypeName)
    {
        ApiAssembly.GetType(fullTypeName)
            .Should().BeNull($"{fullTypeName} is the dead reverse-pull mechanism and must be deleted");
    }
}
