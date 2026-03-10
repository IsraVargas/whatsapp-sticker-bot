const makeWASocket = require("@adiwajshing/baileys").default;
const Pino = require("pino");
const fs = require("fs");
const path = require("path");

const AUTH_FILE = path.join("/mnt", "auth_info.json");
let auth = {};

// Carga auth si existe
if (fs.existsSync(AUTH_FILE)) {
    auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
}

// Crea el socket
const sock = makeWASocket({
    logger: Pino({ level: "silent" }),
    printQRInTerminal: true,
    auth
});

// Guardar credenciales actualizadas
sock.ev.on('creds.update', () => {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(sock.auth, null, 2));
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

// Conexión y reconexión
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || "unknown";
        console.log(`Conexión cerrada, código: ${reason}`);
        if (reason !== 401) { // no logout
            setTimeout(() => sock.connect(), 5000);
        }
    } else if (connection === 'open') {
        console.log('Conectado a WhatsApp ✅');
    }
});