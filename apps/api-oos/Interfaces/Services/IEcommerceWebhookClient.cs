namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Webhooks;

/// <summary>
/// Sends ecommerce domain events (orders, carts, products) to api-crms's existing
/// one-way, HMAC-signed Ecommerce webhook (<c>POST api/v1/webhooks/ecommerce</c>).
/// This is the only outbound path from api-oos to api-crms for commerce data; the
/// contract is owned by api-crms and is not generalised here.
/// </summary>
public interface IEcommerceWebhookClient
{
    /// <summary>
    /// Delivers a single ecommerce event. Implementations sign the serialized body
    /// with the shared secret and POST it to api-crms. Failures are swallowed and
    /// logged — order placement must not fail because the CRM is unreachable
    /// (delivery is at-least-once and the CRM is a passive receiver).
    /// </summary>
    Task SendAsync(EcommerceWebhookEvent webhookEvent, CancellationToken cancellationToken = default);
}
