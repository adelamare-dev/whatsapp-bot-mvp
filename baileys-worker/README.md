# OCTAVE Baileys Worker (WhatsApp Interface)

## What This Does

Node.js worker that:
- **Connects to WhatsApp** using the Baileys library (unofficial WhatsApp Web API)
- **Receives messages** from WhatsApp users and forwards them to the FastAPI backend
- **Sends replies** back to WhatsApp when instructed by the backend

This is the "bridge" between WhatsApp and the OCTAVE backend—it handles all WhatsApp communication.

---

## How to Run Locally

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm
- A WhatsApp account for the bot

### Setup

```bash
# 1. Navigate to worker folder
cd baileys-worker

# 2. Install dependencies
npm install
```

### First-Time Setup (QR Code Pairing)

```bash
# Generate credentials by scanning QR code
npm run init
```

1. A QR code will appear in the terminal
2. Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
3. Scan the QR code
4. Wait for "✅ Paired successfully!" message
5. Credentials are saved in `auth_info_baileys/`

### Start the Worker

```bash
# Start the bot (requires credentials from init step)
npm run start
```

### Verify It Works

1. Send a message to the bot's WhatsApp number
2. Check terminal for `📤 Forwarded: <your_number>`
3. If backend is running, you should receive a reply

---

## Project Structure

```
baileys-worker/
├── bot.js                   # Main worker (Express + Baileys)
├── init.js                  # QR code pairing script
├── auth_info_baileys/       # WhatsApp credentials (gitignored)
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run init` | Pair with WhatsApp (scan QR code) |
| `npm run start` | Start the worker (requires credentials) |
| `npm run clean` | Delete credentials (re-pair needed) |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `worker.FASTAPI_URL` | `http://localhost:8000` | Backend URL for forwarding messages |
| `worker.PORT` | `3000` | HTTP server port for receiving replies |

Create a `.env` file to override defaults:
```env
worker.FASTAPI_URL=http://localhost:8000
worker.PORT=3000
```

---

## Integration with Other Services

```
┌─────────────────┐                              ┌─────────────────┐
│    WhatsApp     │ ◄────── Baileys ──────────► │  Baileys Worker │
│    (Users)      │                              │  (port 3000)    │
└─────────────────┘                              └────────┬────────┘
                                                          │
                                    POST /webhook/baileys/{id}
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  FastAPI Backend │
                                                 │  (port 8000)     │
                                                 └─────────────────┘
```

---

## Troubleshooting

### "❌ ERREUR: Credentials non trouvés!"
Run `npm run init` first to pair with WhatsApp.

### "💀 LOGGED OUT - Credentials invalides!"
Your WhatsApp session expired. Run:
```bash
npm run clean
npm run init
npm run start
```

### Worker crashes on startup
1. Check that Node.js 18+ is installed: `node --version`
2. Ensure dependencies are installed: `npm install`
3. Verify credentials exist: `ls auth_info_baileys/creds.json`

---

## Security Notes

- **Never commit `auth_info_baileys/`** — it contains your WhatsApp session
- The worker uses an unofficial API; WhatsApp may block accounts that abuse it
- For production, consider the official WhatsApp Business API
