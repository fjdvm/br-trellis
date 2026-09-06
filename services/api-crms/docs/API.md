# Trellis CRM API Documentation

**Base URL:** `http://localhost:5062` (development)  
**Content-Type:** `application/json`  
**Framework:** .NET 10, ASP.NET Core, EF Core + SQLite

---

## Table of Contents

- [Contacts](#contacts)
- [Contact Identity](#contact-identity)
- [Ecommerce Webhook](#ecommerce-webhook)
- [Configuration](#configuration)
- [Error Handling](#error-handling)

---

## Contacts

### List Contacts

```
GET /api/v1/contacts
```

Returns all non-deleted contacts with their company and source references.

**Response:** `200 OK`

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Maya Chen",
    "email": "maya@example.com",
    "phone": "555-0100",
    "companyName": "Acme Corp",
    "sourceReferences": [
      { "sourceSystem": "ecommerce", "sourceId": "customer-200" }
    ]
  }
]
```

---

### Get Contact Detail

```
GET /api/v1/contacts/{id}
```

Returns full contact record including custom fields, timeline, orders, and LTV.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | GUID | Contact ID |

**Response:** `200 OK`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Maya Chen",
  "email": "maya@example.com",
  "phone": "555-0100",
  "sentimentScore": 0.85,
  "lifetimeValue": 1249.97,
  "company": {
    "id": "...",
    "name": "Acme Corp"
  },
  "sourceReferences": [
    { "sourceSystem": "ecommerce", "sourceId": "customer-200" }
  ],
  "customFields": [
    {
      "definitionId": "...",
      "name": "Region",
      "fieldType": "Text",
      "textValue": "APAC",
      "numberValue": null,
      "dateValue": null,
      "boolValue": null,
      "selectedOption": null
    }
  ],
  "timelineEntries": [
    {
      "id": "...",
      "sourceModule": "ecommerce",
      "entryType": "order.created",
      "summary": "Order order-100 created — Paid, total $149.99",
      "occurredAt": "2026-08-27T00:00:00+00:00"
    }
  ],
  "orders": [
    {
      "id": "...",
      "platformOrderId": "order-100",
      "status": "Paid",
      "total": 149.99,
      "refundedAmount": 0,
      "createdAt": "2026-08-27T00:00:00+00:00",
      "lineItems": [
        {
          "productId": "prod-1",
          "productName": "Widget",
          "quantity": 2,
          "unitPrice": 74.99
        }
      ]
    }
  ]
}
```

**Response:** `404 Not Found` — Contact does not exist or is deleted.

---

### Create Contact

```
POST /api/v1/contacts
```

**Request Body:**

```json
{
  "name": "Maya Chen",
  "email": "maya@example.com",
  "phone": "555-0100"
}
```

All fields are optional (nullable).

**Response:** `201 Created` — Returns `ContactDetail` (same shape as GET).  
**Location Header:** `/api/v1/contacts/{id}`

---

### Update Contact

```
PUT /api/v1/contacts/{id}
```

**Request Body:**

```json
{
  "name": "Maya Chen-Updated",
  "email": "maya.new@example.com",
  "phone": "555-0200"
}
```

Only provided (non-null/empty) fields are updated. Omitted fields retain their current value.

**Response:** `200 OK` — Returns updated `ContactDetail`.  
**Response:** `404 Not Found` — Contact does not exist or is deleted.

---

### Delete Contact (Soft Delete)

```
DELETE /api/v1/contacts/{id}
```

Soft-deletes the contact (sets `deleted_at`).

**Response:** `204 No Content`  
**Response:** `404 Not Found`

---

### Update Custom Field Value

```
PUT /api/v1/contacts/{id}/custom-fields
```

**Request Body:**

```json
{
  "definitionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "textValue": "APAC",
  "numberValue": null,
  "dateValue": null,
  "boolValue": null,
  "optionId": null
}
```

Set the value field matching the definition's type. Only one value field should be non-null.

**Response:** `204 No Content`

---

## Contact Identity

### Health Check

```
GET /api/v1/contact-identity/health
```

**Response:** `200 OK`

---

### Resolve or Create Contact

```
POST /api/v1/contact-identity/resolve-or-create
```

Matches an incoming external record to an existing Contact via email/phone/name confidence scoring. If a high-confidence match exists, links the source reference. If ambiguous, creates a new contact marked for pending review.

**Request Body:**

```json
{
  "sourceSystem": "ecommerce",
  "sourceId": "customer-200",
  "name": "Maya Chen",
  "email": "maya@example.com",
  "phone": "555-0100"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceSystem` | string | ✅ | External system identifier (e.g., "ecommerce", "pos") |
| `sourceId` | string | ✅ | Record ID in the external system |
| `name` | string | ❌ | Contact name for matching |
| `email` | string | ❌ | Email for matching (highest confidence) |
| `phone` | string | ❌ | Phone for matching (highest confidence) |

**Response:** `200 OK`

```json
{
  "contactId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "createdContact": true
}
```

| Field | Description |
|-------|-------------|
| `contactId` | The resolved or newly created Contact's ID |
| `createdContact` | `true` if a new contact was created, `false` if matched to existing |

---

### List Pending Review Contacts

```
GET /api/v1/contact-identity/pending-review
```

Returns contacts with ambiguous identity matches awaiting human review.

**Response:** `200 OK`

```json
[
  {
    "contact": {
      "id": "...",
      "name": "Maya Chen",
      "email": "maya@example.com",
      "phone": null
    },
    "candidates": [
      {
        "contact": {
          "id": "...",
          "name": "Maya C.",
          "email": "maya@company.com",
          "phone": "555-0100"
        },
        "confidenceScore": 0.5
      }
    ]
  }
]
```

---

## Ecommerce Webhook

### Receive Webhook Event

```
POST /api/v1/webhooks/ecommerce
```

Ingests Order, Cart, and Product events from the ecommerce platform. Every request must include a valid HMAC-SHA256 signature.

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Webhook-Signature` | ✅ | `sha256={hex-digest}` — HMAC-SHA256 of the raw request body using the shared secret |
| `Content-Type` | ✅ | `application/json` |

**Request Body:**

```json
{
  "eventId": "evt-unique-123",
  "eventType": "order.created",
  "data": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | Unique event identifier for deduplication |
| `eventType` | string | One of the supported event types (see below) |
| `data` | object | Event-specific payload |

**Response:** `200 OK` — Event processed (or skipped as duplicate).  
**Response:** `401 Unauthorized` — Invalid or missing signature.  
**Response:** `400 Bad Request` — Malformed payload.

---

### Supported Event Types

#### `order.created`

A new order was placed.

```json
{
  "eventId": "evt-1",
  "eventType": "order.created",
  "data": {
    "orderId": "order-100",
    "contactId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "paid",
    "total": 149.99,
    "refundedAmount": 0,
    "occurredAt": "2026-08-27T00:00:00Z",
    "lineItems": [
      {
        "productId": "prod-1",
        "productName": "Widget",
        "quantity": 2,
        "unitPrice": 74.99
      }
    ]
  }
}
```

**Side effects:**
- Creates/upserts Order projection (keyed on `orderId`)
- Writes Timeline Entry for the contact
- Recalculates contact's Lifetime Value

---

#### `order.updated`

An existing order's status changed (e.g., paid → shipped → delivered).

Same shape as `order.created`. The `status` field reflects the new status.

**Valid statuses:** `pending`, `paid`, `shipped`, `delivered`, `refunded`

---

#### `order.refunded`

An order was (partially or fully) refunded.

```json
{
  "eventId": "evt-2",
  "eventType": "order.refunded",
  "data": {
    "orderId": "order-100",
    "contactId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "refunded",
    "total": 149.99,
    "refundedAmount": 50.00,
    "occurredAt": "2026-08-28T12:00:00Z",
    "lineItems": [...]
  }
}
```

**Side effects:**
- Updates Order projection status and refunded amount
- Writes Timeline Entry
- Recalculates LTV (refunded orders excluded from LTV calculation)

---

#### `cart.updated`

A cart was created or modified (items added/removed). There is no separate `cart.created` event — first occurrence creates the projection.

```json
{
  "eventId": "evt-3",
  "eventType": "cart.updated",
  "data": {
    "cartId": "cart-200",
    "contactId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "occurredAt": "2026-08-27T10:30:00Z",
    "items": [
      {
        "productId": "prod-1",
        "productName": "Widget",
        "quantity": 1,
        "unitPrice": 29.99
      }
    ]
  }
}
```

| Field | Notes |
|-------|-------|
| `contactId` | Nullable — anonymous carts have no contact |
| `items` | Full replacement of the cart's contents on each update |

**Side effects:**
- Creates/upserts Cart projection (keyed on `cartId`)
- Replaces cart items on each update
- Resets `lastActivityAt` (used by abandonment detection)

---

#### `product.updated`

A product's catalog data or stock status changed.

```json
{
  "eventId": "evt-4",
  "eventType": "product.updated",
  "data": {
    "productId": "prod-1",
    "name": "Widget v2",
    "price": 39.99,
    "inStock": true,
    "occurredAt": "2026-08-27T08:00:00Z"
  }
}
```

**Side effects:**
- Creates/upserts Product projection (keyed on `productId`)
- `inStock` is stored as-is from the ecommerce platform (no threshold logic)
- `inStock` is available as a Segment rule condition

---

### Signature Calculation

The ecommerce platform signs each webhook request using HMAC-SHA256:

```
signature = HMAC-SHA256(raw_request_body_bytes, shared_secret)
header = "sha256=" + hex(signature)
```

**Example (bash):**

```bash
PAYLOAD='{"eventId":"evt-1","eventType":"order.created","data":{...}}'
SECRET="your-webhook-secret"
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
curl -X POST http://localhost:5062/api/v1/webhooks/ecommerce \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

---

### Idempotency

- Every event carries a unique `eventId` distinct from the entity's own ID.
- Trellis persists processed `eventId`s and skips reprocessing on redelivery.
- Duplicate events return `200 OK` (receipt acknowledged) but produce no side effects.

### Out-of-Order Tolerance

- All projection writes are **upserts** keyed on the entity's platform-native ID.
- An `order.updated` arriving before `order.created` still produces a correct record.
- No ordering guarantee is required from the sender.

---

## Configuration

### appsettings.json

```json
{
  "ConnectionStrings": {
    "CrmsDatabase": "Data Source=trellis.db"
  },
  "Ecommerce": {
    "WebhookSecret": "change-me-in-production",
    "AbandonmentThresholdMinutes": 60,
    "SweepIntervalMinutes": 15
  },
  "ContactIdentity": {
    "AutoAcceptThreshold": 0.9,
    "NoiseFloor": 0.1
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `Ecommerce:WebhookSecret` | — | Shared HMAC secret for webhook signature validation |
| `Ecommerce:AbandonmentThresholdMinutes` | `60` | Minutes of inactivity before a cart is flagged abandoned |
| `Ecommerce:SweepIntervalMinutes` | `15` | How often the abandonment/workflow sweep runs |
| `ContactIdentity:AutoAcceptThreshold` | `0.9` | Confidence score at or above which a match is auto-accepted |
| `ContactIdentity:NoiseFloor` | `0.1` | Confidence below which a match is discarded as noise |

---

## Error Handling

| Status Code | Meaning |
|-------------|---------|
| `200 OK` | Success (GET, POST identity, webhook) |
| `201 Created` | Resource created (POST contact) |
| `204 No Content` | Success with no body (PUT, DELETE) |
| `400 Bad Request` | Malformed request body |
| `401 Unauthorized` | Invalid/missing webhook signature |
| `404 Not Found` | Resource does not exist or is soft-deleted |
| `500 Internal Server Error` | Unexpected server error |

---

## Data Model Overview

### Lifetime Value (LTV)

- Denormalized on the Contact record
- Calculated as: `SUM(completed order totals) - SUM(refunded amounts)`
- Only orders with status `Paid`, `Shipped`, or `Delivered` contribute
- Recalculated automatically on every order event for the contact
- Floor of `0` (never negative)

### Cart Abandonment

- Detected by a scheduled sweep (not event-driven)
- Criteria: active cart + has items + identifiable contact + no order exists + inactive > threshold
- Flags cart status as `Abandoned`
- Emits internal event consumed by the Workflow engine

### Workflow Engine

- Triggered by `cart.abandoned` internal event
- Multi-step automation (wait duration + action per step)
- Stop condition evaluated after wait, before action execution
- V1 action type: email (templated message)
- Runs advanced by the same scheduled sweep as cart abandonment

### Segment Rules

Dynamic segments support these field conditions:

| Field | Type | Operators |
|-------|------|-----------|
| `Name`, `Email`, `Phone` | string | equals, not_equals, contains |
| `SentimentScore` | numeric | less_than, greater_than, equals, etc. |
| `LifetimeValue` | numeric | less_than, greater_than, greater_than_or_equal, etc. |
| `in_stock` | boolean | equals (`"true"` / `"false"`) — checks related Product stock via cart items |
| Custom fields | varies | All operators supported |

Rule format:

```json
{
  "matchMode": "MatchAll",
  "conditions": [
    { "field": "LifetimeValue", "operator": "greater_than", "value": "1000" },
    { "field": "in_stock", "operator": "equals", "value": "true" }
  ]
}
```

`matchMode`: `"MatchAll"` (AND) or `"MatchAny"` (OR). No nested boolean logic.
