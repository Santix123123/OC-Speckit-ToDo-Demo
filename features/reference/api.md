# API Reference

**Status:** Features 1–5 — auth, list CRUD, todo item CRUD, profile, and optional due dates.

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
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list (and its todos) |
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch todos in an owned list |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update an owned todo (title, `completed`, and/or `dueDate`) |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Fetch the authenticated user's own profile |
| `PUT` | `/todo/users/:id` | Yes | Update the authenticated user's own profile |

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

### Todo success payload (`200` / `201`)

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "dueDate": "2026-07-15",
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`dueDate` is `null` when not set.

### Create todo request

```json
{ "title": "Buy milk", "dueDate": "2026-07-15" }
```

`dueDate` is optional (`YYYY-MM-DD`). Omit it or send `null` for no due date.

### Update todo request

Any combination of `title`, `completed`, and `dueDate`. Send `dueDate: null` to clear. Omitting `dueDate` leaves the stored value unchanged.

```json
{ "title": "Buy oat milk", "completed": false, "dueDate": "2026-07-20" }
```

### Profile success payload (`200`)

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

### Update profile request

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`password` is optional. Omit it to leave the current password unchanged.

### Error payload

```json
{ "message": "Human-readable explanation." }
```

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
- Cross-user list/todo/profile access returns `404` (not `403`).
