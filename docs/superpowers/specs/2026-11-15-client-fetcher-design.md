# Client Fetcher and Auth Action Design

## Context

The frontend server actions in `fe/shared/repository/actions.ts` call a Go API
under `/api/v1`. The Go auth middleware accepts protected requests only when
the Authorization header uses its required token scheme. Go does not read auth
cookies from incoming requests or emit auth cookies: login and refresh return
tokens in JSON, registration returns only a user, and logout accepts a refresh
token in its JSON body.

The in-progress frontend changes use Next.js HttpOnly cookies, but the
`Authorization` header construction is incomplete. They also model
registration as returning tokens and return login/refresh token payloads from
server actions, despite the existing React Query contract expecting a user for
login and `null` for refresh.

## Chosen approach

Keep the server-action and HttpOnly-cookie architecture, with all application
code changes confined to `fe/shared/repository/actions.ts`. Do not modify the
Go API or other frontend files.

The `$fetch` instance will keep its existing base URL and error behavior. On
each request, it will read the `access_token` cookie and construct the
Authorization header using the token scheme required by Go, unless the caller
supplied an Authorization header.

Auth actions will follow the Go API contract:

- Registration returns `ApiResponse<User>` and does not attempt to persist
  tokens.
- Login stores the returned access and refresh tokens in HttpOnly cookies,
  then returns only the nested user in `ApiResponse<User>`.
- Refresh sends the refresh cookie in the request body, stores the rotated
  tokens, and returns `ApiResponse<null>`.
- Logout sends the refresh cookie so Go can revoke it, then clears both
  cookies even if the request fails.

Token values will not be returned from server actions to client-side state.
Existing `throw: true` behavior remains so failed API calls continue to
surface as errors.

## Alternatives considered

1. **Keep tokens in HttpOnly Next.js cookies (chosen):** works with Go's auth
   contract while keeping token values out of client-visible action results.
2. **Return tokens to client code:** requires client-side token handling and
   would expose access and refresh tokens to JavaScript.
3. **Forward cookies to Go:** does not authenticate protected routes because
   the Go middleware checks only the Authorization header, and the API does
   not issue cookie headers.

## Validation

Run the frontend TypeScript check and ESLint on
`fe/shared/repository/actions.ts`. Confirm the action return types remain
compatible with the existing login, refresh, and logout React Query hooks.
