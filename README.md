# OCTAVE WhatsApp Bot MVP

WhatsApp chatbot MVP built on top of a FastAPI backend and a Node.js worker using the `@whiskeysockets/baileys` library.

The goal of this project is to receive messages from WhatsApp, process them in a Python backend, and send responses back through a persistent WhatsApp Web session.

---

## Monorepo Overview

This monorepo contains **3 services** that work together:

| Service | Path | Tech | Purpose |
|---------|------|------|---------|
| **Backend** | [`backend/`](./backend/README.md) | FastAPI (Python 3.10+) | Business logic, webhook handler, reply orchestration |
| **Baileys Worker** | [`baileys-worker/`](./baileys-worker/README.md) | Node.js 18+ | WhatsApp Web bridge via Baileys |
| **Website** | [`octave_website/`](./octave_website/README.md) | VitePress | Static marketing site + fallback form |

### Quick Start (All Services)

```powershell
# Terminal 1 – Backend
cd backend
py -m venv .venv && .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 – Baileys Worker (first time: npm run init to scan QR)
cd baileys-worker
npm install
npm start

# Terminal 3 – Website
cd octave_website
npm install
npm run docs:dev
```

> **Tip**: Each service has its own README with detailed setup instructions.

---

## 1. Architecture Overview

The system is composed of three services:

- **`backend/` – FastAPI HTTP API**
  - Exposes a webhook endpoint for incoming WhatsApp messages.
  - Contains the business logic for how the bot replies.
  - Sends HTTP requests to the Baileys worker to send messages back to WhatsApp.

- **`baileys-worker/` – Node.js WhatsApp worker**
  - Manages the WhatsApp Web session using Baileys.
  - Exposes an HTTP endpoint to send outbound messages.
  - Forwards all inbound WhatsApp messages to the FastAPI backend.

- **`octave_website/` – VitePress static site**
  - Marketing landing page for OCTAVE.
  - Fallback form for users without WhatsApp access.
  - Routes: `/`, `/how-it-works`, `/why-octave`, `/fallback-form`.

**Message flow**

1. **User → WhatsApp**: A user sends a message to the WhatsApp number linked to the bot.
2. **WhatsApp → Baileys Worker**: Baileys receives the message in `bot.js`.
3. **Baileys Worker → Backend**: The worker posts the message payload to:
   - `POST {FASTAPI_URL}/webhook/baileys/{conversation_id}`
4. **Backend → Baileys Worker**: The backend decides how to respond and calls:
   - `POST http://localhost:3000/send/{conversation_id}` with a JSON body `{ "text": "..." }`.
5. **Baileys Worker → WhatsApp**: The worker sends the message to the user via the WhatsApp Web session.

`conversation_id` is the WhatsApp phone number in international format, **without** the `@s.whatsapp.net` suffix.

---

## 2. Project Structure

At the root of the project you will find:

- **`backend/`** – FastAPI backend
  - `app/main.py` – FastAPI application entrypoint.
  - `app/routers/baileys.py` – Webhook and reply logic for WhatsApp messages.
  - `requirements.txt` – Python dependencies.

- **`baileys-worker/`** – Node.js WhatsApp worker
  - `bot.js` – Main worker that:
    - Listens to WhatsApp events.
    - Forwards messages to FastAPI.
    - Exposes `POST /send/:conversation_id` to send messages.
  - `init.js` – One-time (or occasional) script to initialize / refresh WhatsApp authentication via QR code.
  - `auth_info_baileys/` – Folder where Baileys stores session credentials.
  - `.env` – Environment variables consumed by the worker.
  - `package.json` – Node.js dependencies and scripts.

---

## 3. Prerequisites

- **Python**: 3.10+ (for FastAPI backend)
- **Node.js**: 18+ (for `fetch` and `AbortSignal.timeout` support)
- **npm**: 9+ (or the version bundled with your Node.js install)
- A smartphone with **WhatsApp** installed to link the bot via QR code.

On Windows, commands below assume **PowerShell**.

---

## 4. Quick Start (Local Development)

### 4.1. Start the FastAPI backend

1. Open a terminal in the `backend` folder.

2. Create and activate a virtual environment (recommended):

   ```powershell
   # from .\backend
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install the Python dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

4. Start the FastAPI server (default: port **8000**):

   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Check the health endpoint in your browser or with `curl`:

   - `GET http://127.0.0.1:8000/`
   - Expected response:

     ```json
     {"status": "ok", "service": "octave-api"}
     ```

### 4.2. Configure the Baileys worker

1. Open the `baileys-worker/.env` file and review/update the values:

   ```env
   FASTAPI_URL=http://127.0.0.1:8000
   WHATSAPP_PHONE_NUMBER=your_international_format_whatsapp_number (e.g., 33606060606)
   PORT=3000

   # Optional: Monitoring
   NODE_ENV=development
   ```

   - **FASTAPI_URL** should point to your running FastAPI backend.
   - **WHATSAPP_PHONE_NUMBER** is your full WhatsApp number (international format). It is used for identification/metadata.
   - **PORT** should remain `3000` to match the backend code (`baileys.py` currently calls `http://localhost:3000`).

### 4.3. Install Node.js dependencies

In a new terminal, open the `baileys-worker` folder and run:

```powershell
# from .\baileys-worker
npm install
```

This installs `@whiskeysockets/baileys`, `express`, `dotenv`, `qrcode`, etc.

### 4.4. Initialize WhatsApp authentication (QR code)

This step sets up or refreshes the WhatsApp Web session credentials.

1. In the `baileys-worker` folder, run:

   ```powershell
   npm run init
   ```

2. The script will:

   - Clean old credentials (by default).
   - Fetch the latest compatible Baileys version.
   - Generate a QR code image **`qr.png`** in the `baileys-worker` root.

3. Link your WhatsApp account:

   - Open the generated `qr.png` file.
   - On your phone, open **WhatsApp → Settings → Linked Devices → Link a Device**.
   - Scan the QR code from `qr.png` **quickly**.

4. On success, the script prints:

   - `✅ AUTHENTIFICATION RÉUSSIE!`
   - The credentials are stored in `./auth_info_baileys/`.

You can now close this terminal once the script exits with success.

### 4.5. Start the Baileys worker

1. In the `baileys-worker` folder, start the worker:

   ```powershell
   npm start
   ```

2. You should see logs similar to:

   - `🚀 HTTP server ready on :3000`
   - `✅ Bot connecté à WhatsApp`

The system is now fully operational:

- **Backend**: `http://127.0.0.1:8000`
- **Baileys worker**: `http://127.0.0.1:3000`

Send a WhatsApp message to the linked number to test the bot.

---

## 5. Backend Behavior (`backend/app/routers/baileys.py`)

The backend exposes a single webhook used by the Baileys worker:

- **`POST /webhook/baileys/{conversation_id}`**
  - Called by the Baileys worker when a new message is received.
  - Request body (simplified):

    ```json
    {
      "message": { "...": "raw WhatsApp message payload" },
      "key": { "...": "message key" },
      "messageTimestamp": 1234567890,
      "pushName": "Sender Name"
    }
    ```

  - `conversation_id` is the sender's WhatsApp number (e.g. `541122791311`).

### 5.1. Text extraction

The router attempts to extract text content in a robust but simple way:

- `conversation` – plain text messages.
- `extendedTextMessage.text` – formatted / replied messages.
- `imageMessage.caption` – text attached to an image.
- `videoMessage.caption` – text attached to a video.

The extracted text is normalized to lowercase.

### 5.2. Reply logic

Depending on the incoming message, the backend behaves as follows:

- **Location message (`locationMessage`)**
  - Immediately replies: `"📍 Location reçue!"`.
  - Schedules a background task that waits 2 seconds and then replies:
    - `"✅ Ferme cartographiée! 78.5 ha"`.

- **Text message**
  - If text is `"start"`:
    - Replies: `"🌾 Bienvenue! Partage ta location"`.
  - If text is `"ping"`:
    - Replies: `"🏓 Pong!"`.
  - For any other text:
    - Replies: `"Echo: {text}"`.

All replies are sent via the helper function:

- `POST http://localhost:3000/send/{conversation_id}` with body `{ "text": "..." }`.

---

## 6. Baileys Worker Behavior (`baileys-worker/bot.js`)

The worker performs three main functions:

1. **Expose an HTTP API to send messages**

   - **`POST /send/:conversation_id`**
     - Body: `{ "text": "Your message" }`.
     - Uses `sock.sendMessage(jid, { text })` where `jid = conversation_id + "@s.whatsapp.net"`.

2. **Maintain a stable WhatsApp connection**

   - Uses `useMultiFileAuthState("auth_info_baileys")` to persist session.
   - Uses `fetchLatestBaileysVersion()` to align with WhatsApp Web.
   - Automatically attempts reconnection on non-fatal disconnects.
   - Exits with instructions if the session is logged out (credentials invalid).

3. **Forward inbound messages to FastAPI**

   - Listens to `messages.upsert` events from Baileys.
   - Ignores:
     - Messages sent **by the bot itself** (`fromMe`).
     - WhatsApp **status** messages (`status@broadcast`).
   - Extracts `conversationId` from `msg.key.remoteJid`.
   - Sends a POST request to:

     ```text
     {FASTAPI_URL}/webhook/baileys/{conversationId}
     ```

     with a JSON body containing the WhatsApp message payload.

---

## 7. Environment Variables

### 7.1. Baileys worker (`baileys-worker/.env`)

- **FASTAPI_URL**
  - URL of the FastAPI backend.
  - Example: `http://127.0.0.1:8000`.

- **WHATSAPP_PHONE_NUMBER**
  - Phone number associated with the WhatsApp account used by the bot.
  - Must be in international format without `+`.

- **PORT**
  - Intended HTTP port for the worker. The current implementation listens on port `3000` directly in `bot.js`.

- **NODE_ENV** (optional)
  - Environment (e.g. `development`, `production`).

### 7.2. Backend (`backend/.env`)

- Currently empty and **not required** for local development.
- Reserved for future configuration (database URLs, API keys, etc.).

---

## 8. Common Workflows

### 8.1. Reset WhatsApp session

If you see logs like:

- `LOGGED OUT - Credentials invalides!`

You need to reset the WhatsApp credentials:

1. Stop the `npm start` process.
2. Delete the `auth_info_baileys/` folder.
   - **On Windows**: delete the folder manually in your file explorer.
   - Or from a shell that supports `rm -rf` (e.g. Git Bash):

     ```bash
     npm run clean
     ```

3. Run `npm run init` again and rescan the QR code.
4. Restart the worker with `npm start`.

### 8.2. Change backend URL

If your backend runs on a different host or port:

1. Update `FASTAPI_URL` in `baileys-worker/.env` (e.g. to a LAN IP or a tunneled URL).
2. Restart the Baileys worker (`npm start`).

> Note: the backend currently assumes the worker is on `http://localhost:3000`. If you change the worker port, you must also update the URL in `backend/app/routers/baileys.py`.

---

## 9. Troubleshooting

- **Backend not reachable**
  - Symptom: worker logs `❌ FastAPI error: 500` or another HTTP error.
  - Check that the backend is running and that `FASTAPI_URL` is correct.

- **Bot not connected to WhatsApp**
  - Symptom: `"Bot not connected"` when calling `/send/:conversation_id`.
  - Ensure `npm start` is running and that QR authentication has been completed.

- **QR code expires repeatedly**
  - The QR code is time-limited (about 60 seconds).
  - Re-run `npm run init` and scan quickly; ensure network is stable.

- **Port conflicts (8000 or 3000 already in use)**
  - Stop other processes using those ports or reconfigure ports consistently in:
    - `uvicorn` command (backend).
    - `FASTAPI_URL` env variable.
    - `bot.js` and `baileys.py` if you change the worker port.

---

## 10. Next Steps

- Replace the simple echo and demo responses with your actual business logic.
- Add persistence (e.g. database) and richer conversation flows.
- Secure the communication between backend and worker (auth tokens, IP filtering, etc.).
