const makeWASocket = require("@adiwajshing/baileys").default;
const Pino = require("pino");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode-terminal");

// Archivo para mantener la sesión
const AUTH_FILE = path.join("/mnt", "auth_info.json");
let auth = {};

// Carga sesión si existe
if (fs.existsSync(AUTH_FILE)) {
    auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
}

// Crea el socket
const sock = makeWASocket({
    logger: Pino({ level: "silent" }),
    printQRInTerminal: true,
    auth
});

// Guardar sesión cada vez que se actualice
sock.ev.on('creds.update', () => {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(sock.authState, null, 2));
});

// Mensajes entrantes
sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    console.log(`Mensaje recibido de ${sender}: ${text}`);

    if (text?.toLowerCase() === "ping") {
        await sock.sendMessage(sender, { text: "pong" });
    }
});

// Manejo de desconexiones
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || "unknown";
        console.log(`Conexión cerrada, código: ${reason}`);

        // Reconectar si no se cerró por logout
        if (reason !== 401 /* logged out */) {
            console.log('Intentando reconectar en 5s...');
            setTimeout(() => sock.connect(), 5000);
        }
    } else if (connection === 'open') {
        console.log('Conectado a WhatsApp ✅');
    }
});