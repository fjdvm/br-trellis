using System.Security.Cryptography;
using System.Text;

namespace api_crms.Helpers;

public static class HmacSignatureValidator
{
    /// <summary>
    /// Validates an HMAC-SHA256 signature on raw payload bytes.
    /// The expected signature header format is "sha256={hex-digest}".
    /// </summary>
    public static bool IsValid(byte[] payload, string? signatureHeader, string secret)
    {
        if (string.IsNullOrEmpty(signatureHeader))
            return false;

        if (!signatureHeader.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
            return false;

        var receivedHex = signatureHeader["sha256=".Length..];
        if (string.IsNullOrEmpty(receivedHex))
            return false;

        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var computedHash = HMACSHA256.HashData(keyBytes, payload);
        var computedHex = Convert.ToHexStringLower(computedHash);

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedHex),
            Encoding.UTF8.GetBytes(receivedHex.ToLowerInvariant()));
    }
}
