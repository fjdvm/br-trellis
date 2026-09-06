# api-crms

Trellis CRMS backend API (.NET / EF Core). Passive ecommerce webhook receiver
plus contact, company, segment, and ecommerce read endpoints.

## Running

```bash
cd services/api-crms
dotnet run
```

Serves on `http://localhost:5035` (and `https://localhost:7133` with the `https`
launch profile).

## API documentation

The API is documented with OpenAPI (via the built-in
`Microsoft.AspNetCore.OpenApi`) and a browsable [Scalar](https://scalar.com) UI.

While the app is running in the `Development` environment:

- **Browsable UI (Scalar):** <http://localhost:5035/scalar>
- **Raw OpenAPI document:** <http://localhost:5035/openapi/v1.json>

A generated, version-controlled copy of the spec is committed at
[`openapi/v1.json`](./openapi/v1.json) so the API surface is reviewable in diffs
without running the service.

### Regenerating the committed spec

After changing controllers/DTOs, refresh the committed spec while the app is
running:

```bash
curl -s http://localhost:5035/openapi/v1.json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); open('openapi/v1.json','w').write(json.dumps(d, indent=2)+'\n')"
```

## Auth

Protected endpoints require a JWT bearer token issued by `internal-auth-service`.
See [`.env.example`](./.env.example) for `JWT_AUTHORITY` / `JWT_AUDIENCE`.
