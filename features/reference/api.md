# API Reference

**Status:** Features 1–2 — auth + list CRUD.

API mount path: `/todo` (see `backend/server.js`).

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Liveness check |
| `POST` | `/todo/register` | No | Create account; returns session payload |
| `POST` | `/todo/login` | No | Authenticate; returns session payload |
| `POST` | `/todo/logout` | Yes | Invalidate current session token |
| `GET` | `/todo/lists` | Yes | Fetch lists owned by the authenticated user (alphabetical by name) |
| `POST` | `/todo/lists` | Yes | Create a list for the authenticated user |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |

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

### List success payload (`200` / `201`)

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

### Create list request

```json
{ "name": "Groceries" }
```

### Error payload

```json
{ "message": "Human-readable explanation." }
```

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
- Cross-user list access returns `404` (not `403`).
