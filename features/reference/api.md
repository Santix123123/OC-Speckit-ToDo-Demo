# API Reference

**Status:** Feature 1 — auth endpoints + authenticated lists stub.

API mount path: `/todo` (see `backend/server.js`).

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Liveness check |
| `POST` | `/todo/register` | No | Create account; returns session payload |
| `POST` | `/todo/login` | No | Authenticate; returns session payload |
| `POST` | `/todo/logout` | Yes | Invalidate current session token |
| `GET` | `/todo/lists` | Yes | Feature 1 stub — returns `[]` until Feature 2 list CRUD |

### Auth success payload (register `201`, login `200`)

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

### Error payload

```json
{ "message": "Human-readable explanation." }
```

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
