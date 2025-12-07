## How to activate and use the WhatsApp bot

### 1. Prerequisites

- **WhatsApp account**
  - Dedicated phone number / eSIM with WhatsApp (or WhatsApp Business) already registered.
  - Phone kept online (Wi‑Fi / data) so the bot can send/receive messages.

- **Backend (`root/backend/`)**
  - Env vars configured (DB, secrets, etc.).
  - FastAPI server running and reachable at the URL used by the worker.
  - Webhook endpoint for WhatsApp messages exposed (e.g. `/webhook/whatsapp`).

- **Worker (`root/baileys-worker/`)**
  - Node/TypeScript deps installed (`npm install`).
  - `.env.worker` filled with DEDICATED PHONE NUMBER `WHATSAPP_PHONE_NUMBER=your_phone_number` (e.g. `WHATSAPP_PHONE_NUMBER=33612345678`)
  - ⚠️ WARNING : The phone number must follow the E164 format (e.g. `33612345678` for French Number `+33612345678`)

---

### 2. Attach the bot to the WhatsApp number

1. **Prepare the WhatsApp account**
   - Install WhatsApp on the phone
   - Log in with the dedicated phone number
   - Complete setup

2. **Start the backend (Terminal 1)**
   - Run FastAPI (e.g. `uvicorn app.main:app --reload` or prod command).
   - Sanity check: health endpoint and WhatsApp webhook are reachable.

3. **Start the Baileys worker (Terminal 2)**
   - From `baileys-worker/`: `npm run init`.
   - On first run, the worker logs a **QR code** in the console (`./qr.png` file).
   - ⚠️ WARNING: the QR code is only valid for 60 seconds.

4. **Link the WhatsApp account**
   - On the phone: WhatsApp → Settings → Linked devices → “Link a device”.
   - Scan the QR shown by the worker (or open `qr.png`).
   - Check logs: connection should switch to **connected**.
   - ⚠️ WARNING : after successfull authentication, the bot no longer needs QR code to authenticate (the credentials are stored in `auth_info_baileys/`).

5. **Run the Baileys worker (Terminal 2)**
   - From `baileys-worker/`: `npm start`.
   - On first run, the worker should connect to WhatsApp and log a **connected** message from Terminal 2.

6. **Smoke test**
   - From another WhatsApp account, send a message to the bot number.
   - Expect:
     - Worker logs an incoming message.
     - Worker sends a batch to the backend webhook.
     - Backend may respond with an outgoing message.
     - Worker sends that message back to WhatsApp.

6. **Persist the session**
   - Ensure the Baileys session store is persisted and encrypted (see `auth_info_baileys/`).
   - Document how to re‑link if the session is lost (repeat QR flow).

---

### 3. How to share the bot with users

- **Direct number**
  - Share the WhatsApp number. Users save it and start a chat.

- **Click‑to‑Chat link**
  - Use `https://wa.me/<E164_NUMBER>` (e.g. `https://wa.me/33612345678`).
  - Place it on website, emails, social profiles.

- **QR code**
  - Generate a QR pointing to the `wa.me` link.
  - Use on printed material, slides, etc.

- **Groups (optional)**
  - Add the bot account to groups if needed.
  - Define bot behavior in groups in the backend logic.

- **Constraints**
  - Do not run multiple Baileys sessions on the same number.
  - Phone must remain active; if SIM/phone changes, re‑link via QR.
  - Inform users they talk to a bot and handle data lawfully (GDPR, etc.).