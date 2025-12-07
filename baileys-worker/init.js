// Libraries
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion, // ← Stabilizator
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");

// Configuration constants
const AUTH_STATE_FOLDER = "auth_info_baileys";

// ===== BAILEYS AUTHENTICATION =====
async function initAuth(cleanAuth = true) {
  console.log("\n🔐 INITIALISATION AUTHENTIFICATION\n");

  // ===== 1. CLEAN CORRUPTED AUTH STATE =====
  const fs = require("fs");
  const authPath = `./${AUTH_STATE_FOLDER}`;

  if (cleanAuth && fs.existsSync(authPath)) {
    console.log("🧹 Nettoyage ancien auth state...\n");
    fs.rmSync(authPath, { recursive: true, force: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(
    AUTH_STATE_FOLDER
  );

  // ===== 2. FETCH LATEST VERSION (IMPORTANT!) =====
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📦 Baileys version: ${version.join(".")}`);
  console.log(
    `${isLatest ? "✅" : "⚠️"} ${isLatest ? "Latest" : "Outdated"}\n`
  );

  // ===== 3. CREATE BAILEYS SOCKET =====
  const sock = makeWASocket({
    auth: state,
    version, // ← Utilise version détectée
    // Browser config plus standard
    browser: ["Chrome (Linux)", "", ""], // Plus générique
    // Options de stabilité
    syncFullHistory: false, // Pas de sync complète (plus rapide)
    printQRInTerminal: false, // Désactivé (déprécié)
    defaultQueryTimeoutMs: undefined, // Pas de timeout custom
  });

  // ===== 4. SAVE CREDENTIALS =====
  sock.ev.on("creds.update", saveCreds);

  let qrCount = 0; // Compteur de QR générés

  // ===== 5. HANDLE CONNECTION =====
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCount++;
      const filePath = `./qr.png`;

      QRCode.toFile(filePath, qr, { width: 256 }, (err) => {
        if (err) {
          console.error("\n❌ Erreur génération qr.png:", err.message);
          console.log("\nTentative d'affichage texte du QR:\n");
          qrcode.generate(qr, { small: true });
          return;
        }

        console.log(`\n📱 QR CODE #${qrCount} (expire dans 60s)`);
        console.log(`📁 Fichier: ${filePath}`);
        console.log("\nÉtapes:");
        console.log("1. Ouvre le fichier qr.png (explorateur ou visionneuse)");
        console.log("2. Ouvre WhatsApp");
        console.log("3. Settings > Linked Devices");
        console.log("4. Link a Device");
        console.log("5. Scanne RAPIDEMENT le QR affiché dans l'image qr.png\n");
      });
    }

    if (connection === "open") {
      console.log("\n✅ AUTHENTIFICATION RÉUSSIE!\n");
      console.log(`📁 Credentials: ./${AUTH_STATE_FOLDER}/`);
      console.log("\n🚀 Lance maintenant: npm start\n");
      process.exit(0);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMsg = lastDisconnect?.error?.message;

      console.log(`\n❌ Connexion fermée (code: ${statusCode})`);
      console.log(`Détail: ${errorMsg}\n`);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(
          "Solution: Auth state corrompu, script va redémarrer...\n"
        );
        setTimeout(() => initAuth(), 2000);
      } else if (statusCode === 405) {
        console.log("⚠️ Connection Failure (405)\n");
        console.log("Causes possibles:");
        console.log("  • Trop de tentatives (attends 5 min)");
        console.log("  • Numéro WhatsApp banni/restreint");
        console.log("  • Firewall/Proxy bloque WebSocket");
        console.log("  • Version Baileys obsolète\n");
        console.log("Solutions:");
        console.log("  1. Attends 5 minutes");
        console.log("  2. Utilise un autre réseau WiFi");
        console.log(
          "  3. Lance: npm install @whiskeysockets/baileys@latest"
        );
        console.log("  4. Réessaye avec un autre numéro WhatsApp\n");
        process.exit(1);
      } else if (statusCode === DisconnectReason.restartRequired) {
        console.log("🔄 Redémarrage requis...\n");
        setTimeout(() => initAuth(false), 2000);
      } else {
        console.log("🔄 Reconnexion dans 3s...\n");
        setTimeout(() => initAuth(false), 3000);
      }
    }
  });
}

initAuth().catch((err) => {
  console.error("💥 Erreur:", err);
  process.exit(1);
});
