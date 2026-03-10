const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@adiwajshing/baileys");
const fs = require("fs");
const path = require("path");
const Pino = require("pino");
const qrcode = require("qrcode-terminal");

// Ruta persistente para Railway
const AUTH_FILE = path.join("/mnt", "auth_info.json");

// Inicializa estado de autenticación
const { state, saveState } = useSingleFileAuthState(AUTH_FILE);

// Crea socket
const sock = makeWASocket({
    logger: Pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state
});

// Guarda estado automáticamente
sock.ev.on('creds.update', saveState);

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

    if(connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || "unknown";
        console.log(`Conexión cerrada, código: ${reason}`);

        if(reason !== DisconnectReason.loggedOut) {
            console.log('Intentando reconectar en 5s...');
            setTimeout(() => sock.connect(), 5000);
        }
    } else if(connection === 'open') {
        console.log('Conectado a WhatsApp ✅');
    }
});