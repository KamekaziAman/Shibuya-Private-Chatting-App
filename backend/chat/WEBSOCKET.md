# Chat WebSocket protocol

Connect to `ws://127.0.0.1:8000/ws/chat/<conversation_id>/?token=<JWT_ACCESS_TOKEN>`.
Use `wss://` in production. The server rejects anonymous users with close code `4401`
and authenticated non-participants with `4403`.

## Client events

Send a message (the stable client ID makes reconnect retries idempotent):

```json
{
  "type": "message.send",
  "client_id": "pending-1719140000000",
  "content": "Hello from Shibuya"
}
```

Typing and read-receipt foundations:

```json
{ "type": "typing.start" }
{ "type": "typing.stop" }
{ "type": "message.read" }
```

## Server events

New message:

```json
{
  "type": "message.new",
  "client_id": "pending-1719140000000",
  "message": {
    "id": 42,
    "client_id": "pending-1719140000000",
    "sender": "aman",
    "content": "Hello from Shibuya",
    "timestamp": "2026-06-23T12:00:00+00:00",
    "is_read": false
  }
}
```

```json
{ "type": "typing.update", "username": "aman", "is_typing": true }
{ "type": "presence.update", "username": "aman", "status": "online" }
{ "type": "messages.read", "username": "aman", "message_ids": [40, 41, 42] }
{ "type": "error", "code": "empty_message", "message": "Message content cannot be empty.", "client_id": null }
```

For multi-process deployment set `REDIS_URL`; the in-memory channel layer configured
without it is intentionally limited to local development.
