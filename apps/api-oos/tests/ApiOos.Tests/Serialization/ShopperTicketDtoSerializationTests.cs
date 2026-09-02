using System.Text.Json;
using ApiOos.DTOs.Responses;
using FluentAssertions;
using Xunit;

namespace ApiOos.Tests.Serialization;

/// <summary>
/// Guards that the shopper ticket list serializes the HasStaffReplied flag web-shop
/// relies on to show/hide the "Message Staff" link (#145). A bool that serialized to
/// nothing (e.g. under an accidental WhenWritingDefault policy) would silently hide the
/// link forever.
/// </summary>
public sealed class ShopperTicketDtoSerializationTests
{
    [Fact]
    public void Serializes_hasStaffReplied_as_a_camelCase_boolean()
    {
        var dto = new ShopperTicketDto { Id = "t1", Status = "Ongoing", HasStaffReplied = true };

        // JsonSerializerDefaults.Web mirrors ASP.NET Core's controller serializer.
        var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions(JsonSerializerDefaults.Web));

        json.Should().Contain("\"hasStaffReplied\":true");
    }

    [Fact]
    public void Serializes_hasStaffReplied_false_rather_than_omitting_it()
    {
        var dto = new ShopperTicketDto { Id = "t1", Status = "Unclaimed", HasStaffReplied = false };

        var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions(JsonSerializerDefaults.Web));

        json.Should().Contain("\"hasStaffReplied\":false");
    }
}
