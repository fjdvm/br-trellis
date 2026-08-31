namespace ApiOos.Tests.Controllers;

using ApiOos.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Xunit;

public class HealthControllerTests
{
    [Fact]
    public void Get_ReturnsOkResult_WithStatusHealthy()
    {
        // Arrange
        var controller = new HealthController();

        // Act
        var result = controller.Get();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);

        var response = okResult.Value;
        response.Should().NotBeNull();
    }
}
