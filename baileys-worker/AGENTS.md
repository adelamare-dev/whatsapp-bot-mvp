# AGENTS.md - baileys-worker

## Scope
WhatsApp bridge service: receives messages from WhatsApp via Baileys, forwards to FastAPI backend, exposes HTTP endpoint for outbound replies. Manages WhatsApp Web session persistence.

## Commands

- **Install**: `npm install`
- **First-time setup (QR pairing)**: `npm run init` - generates qr.png, requires WhatsApp scan
- **Start worker**: `npm start` - runs Express server on PORT (default 3000)
- **Reset credentials**: `npm run clean` - deletes auth_info_baileys/, requires re-pairing

## Conventions

- **Session management**: Credentials stored in `auth_info_baileys/` (gitignored), never commit
- **Version detection**: Always use `fetchLatestBaileysVersion()` before creating socket
- **Error handling**: Log errors with emoji prefixes (❌, ✅, 🚀), don't crash on FastAPI failures
- **JID format**: WhatsApp numbers formatted as `{phone}@s.whatsapp.net` for sendMessage
- **Environment**: Variables loaded via dotenv, use defaults if .env missing

## Boundary Rules

- **API contract**: POST `/send/:conversation_id` with body `{ "text": "..." }`
- **Webhook contract**: POST to `{FASTAPI_URL}/webhook/baileys/{conversationId}` with WhatsApp message payload
- **No direct DB access**: Worker only bridges WhatsApp ↔ HTTP, backend handles persistence
- **Stateless**: Session state persisted in auth_info_baileys/, no in-memory state across restarts

↑ See root AGENTS.md for Working Principles.

## Meta — Keep This File Alive

After changes:
- If new endpoints added → update Boundary Rules
- If environment variables change → update Conventions
- If session management changes → update Scope
- Never auto-update without explicit user confirmation
- If this file exceeds 150 lines, condense before adding new rules
