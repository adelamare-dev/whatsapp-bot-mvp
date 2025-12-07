// Libraries
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const express = require("express");
require("dotenv").config();

// Configuration constants (from .env or defaults)
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const PORT = process.env.PORT || 3000;
const AUTH_STATE_FOLDER = "auth_info_baileys";
const CONNECT_TIMEOUT_MS = 60000;
const RETRY_REQUEST_DELAY_MS = 5000;
const RESTART_DELAY_MS = 5000;
const FASTAPI_REQUEST_TIMEOUT_MS = 30000;

// ===== 0. BAILEYS SOCKET =====
let sock;

// ===== 1. EXPRESS SERVER (receive from FastAPI) =====
const app = express();
app.use(express.json());

app.post("/send/:conversation_id", async (req, res) => {
  const { conversation_id } = req.params;
  const { text } = req.body;

  if (!sock) {
    return res.status(503).json({ error: "Bot not connected" });
  }

  try {
    const jid = conversation_id + "@s.whatsapp.net";
    await sock.sendMessage(jid, { text });

    console.log(`✅ Sent to ${conversation_id}`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Send error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 HTTP server ready on :${PORT}`);
});

// ===== 2. BAILEYS CONNECTION =====
// Entrypoint that creates a Baileys socket, handles pairing, reconnection
// and forwards inbound messages to the FastAPI backend.
async function startBot() {
  console.log("🤖 Démarrage Baileys Worker...\n");

  // ===== 1. BAILEYS AUTHENTICATION =====
  const { state, saveCreds } = await useMultiFileAuthState(
    AUTH_STATE_FOLDER
  );

  // ===== 2. BAILEYS VERSION =====
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📦 Baileys version: ${version.join(".")}`);
  console.log(
    `${isLatest ? "✅" : "⚠️"} ${isLatest ? "Latest" : "Outdated"}\n`
  );

  // ===== 3. BAILEYS SOCKET =====
  sock = makeWASocket({
    auth: state,
    version,
    browser: ["Chrome (Linux)", "", ""], // Simulates a stable desktop browser to reduce rejections
    connectTimeoutMs: CONNECT_TIMEOUT_MS,
    retryRequestDelayMs: RETRY_REQUEST_DELAY_MS,
    syncFullHistory: false,
    printQRInTerminal: false,
  });

  // ===== 4. BAILEYS CREDENTIALS =====
  sock.ev.on("creds.update", saveCreds);

  // ===== 5. BAILEYS CONNECTION LIFECYCLE =====
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ Bot connecté à WhatsApp\n");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      console.log(`❌ Connexion fermée (code: ${statusCode})`);

      if (statusCode === DisconnectReason.loggedOut) {
        console.error("\n💀 LOGGED OUT - Credentials invalides!\n");
        console.error("Solution:");
        console.error("  1. Supprime ./auth_info_baileys/");
        console.error("  2. Lance: npm run init");
        console.error("  3. Scanne le QR");
        console.error("  4. Relance: npm start\n");
        process.exit(1);
      } else {
        // Reconnexion auto
        console.log(
          `🔄 Reconnexion dans ${RESTART_DELAY_MS / 1000}s...\n`
        );
        setTimeout(startBot, RESTART_DELAY_MS);
      }
    }
  });

  // ===== 6. FORWARD MESSAGES TO FASTAPI =====
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      // Ignore propres messages
      if (msg.key.fromMe) continue;

      // Ignore statuts
      if (msg.key.remoteJid === "status@broadcast") continue;

      // conversation_id = numéro WhatsApp unique
      const conversationId = msg.key.remoteJid.replace(
        "@s.whatsapp.net",
        ""
      );

      try {
        const response = await fetch(
          `${FASTAPI_URL}/webhook/baileys/${conversationId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(FASTAPI_REQUEST_TIMEOUT_MS),
            body: JSON.stringify({
              message: msg.message,
              key: msg.key,
              messageTimestamp: msg.messageTimestamp,
              pushName: msg.pushName,
            }),
          }
        );

        if (response.ok) {
          console.log(`📤 Forwarded: ${conversationId}`);
        } else {
          console.error(`❌ FastAPI error: ${response.status}`);
        }
      } catch (error) {
        console.error(
          `❌ Error forwarding ${conversationId}:`,
          error.message
        );
        // Continue même si erreur (pas de crash)
      }
    }
  });
}

// ===== 3. GUARD: Vérifier que credentials existent =====
const fs = require("fs");
const credsPath = `./${AUTH_STATE_FOLDER}/creds.json`;

if (!fs.existsSync(credsPath)) {
  console.error("\n❌ ERREUR: Credentials non trouvés!\n");
  console.error("Solution:");
  console.error("  1. Lance: npm run init");
  console.error("  2. Scanne le QR Code");
  console.error("  3. Attends confirmation");
  console.error("  4. Relance: npm start\n");
  process.exit(1);
}

// ===== 4. STARTUP =====
startBot().catch((err) => {
  console.error("💥 Crash:", err);
  process.exit(1);
});
