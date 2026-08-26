using System.Security.Cryptography;
using System.Text;
using api_crms.Helpers;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class HmacSignatureValidatorTests
{
    private const string Secret = "test-webhook-secret";

    [Fact]
    public void Valid_signature_returns_true()
    {
        var payload = Encoding.UTF8.GetBytes("{\"event_type\":\"order.created\"}");
        var signature = ComputeSignature(payload, Secret);

        Assert.True(HmacSignatureValidator.IsValid(payload, $"sha256={signature}", Secret));
    }

    [Fact]
    public void Invalid_signature_returns_false()
    {
        var payload = Encoding.UTF8.GetBytes("{\"event_type\":\"order.created\"}");

        Assert.False(HmacSignatureValidator.IsValid(payload, "sha256=deadbeef", Secret));
    }

    [Fact]
    public void Tampered_payload_returns_false()
    {
        var originalPayload = Encoding.UTF8.GetBytes("{\"event_type\":\"order.created\"}");
        var signature = ComputeSignature(originalPayload, Secret);
        var tamperedPayload = Encoding.UTF8.GetBytes("{\"event_type\":\"order.refunded\"}");

        Assert.False(HmacSignatureValidator.IsValid(tamperedPayload, $"sha256={signature}", Secret));
    }

    [Fact]
    public void Missing_header_returns_false()
    {
        var payload = Encoding.UTF8.GetBytes("{\"event_type\":\"order.created\"}");

        Assert.False(HmacSignatureValidator.IsValid(payload, null, Secret));
    }

    [Fact]
    public void Empty_header_returns_false()
    {
        var payload = Encoding.UTF8.GetBytes("{\"event_type\":\"order.created\"}");

        Assert.False(HmacSignatureValidator.IsValid(payload, string.Empty, Secret));
    }

    [Fact]
    public void Wrong_prefix_returns_false()
    {
        var payload = Encoding.UTF8.GetBytes("{\"event_type\":\"order.created\"}");
        var signature = ComputeSignature(payload, Secret);

        Assert.False(HmacSignatureValidator.IsValid(payload, $"md5={signature}", Secret));
    }

    [Fact]
    public void Signature_comparison_is_case_insensitive()
    {
        var payload = Encoding.UTF8.GetBytes("{\"event_type\":\"order.created\"}");
        var signature = ComputeSignature(payload, Secret).ToUpperInvariant();

        Assert.True(HmacSignatureValidator.IsValid(payload, $"sha256={signature}", Secret));
    }

    private static string ComputeSignature(byte[] payload, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var hash = HMACSHA256.HashData(keyBytes, payload);
        return Convert.ToHexStringLower(hash);
    }
}
