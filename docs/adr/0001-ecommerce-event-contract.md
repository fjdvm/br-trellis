# Self-defined event contract for the ecommerce sync, with at-least-once delivery and upsert-based idempotency

The ecommerce platform is custom-built and owned by the same team as
Trellis, not a third-party SaaS — so there is no external webhook contract
(Shopify, WooCommerce, etc.) to conform to. We define the contract
ourselves: Order/Cart/Product sync to Trellis via HTTP webhooks, delivered
at-least-once with retry on non-2xx responses, payloads HMAC-signed so
Trellis can verify they came from the ecommerce platform. No ordering
guarantee is provided by the sender.

Trellis handles the resulting duplicate and out-of-order delivery by:
dedup on a per-event `event_id` (distinct from the entity's own id) before
applying any projection write, and upserting projections keyed on the
entity's platform-native id (`order_id`, `cart_id`, `product_id`) rather
than assuming a create event always arrives before its updates.

## Considered Options

- **Guaranteed ordering on the sender side** (message queue with per-key
  partitioning, or sequence numbers with receiver-side gap-buffering) —
  rejected. It pushes real infrastructure complexity onto the ecommerce
  platform for a benefit that upsert semantics on the receiving side get
  almost for free, at a scale (single custom store, modest cart volume)
  that doesn't need it. Revisit if a future workflow step requires strict
  sequencing that upsert can't tolerate.

## Consequences

- Every projection write in Trellis (Order, Cart, Product) must be an
  upsert, never an insert-only "create" path — a record may need to be
  created from an `updated` event if the corresponding `created` event
  hasn't arrived yet.
- Trellis must persist processed `event_id`s (or an equivalent dedup
  mechanism) to safely ignore redelivered events.
