// bot.js
const makeWASocket = require("@adiwajshing/baileys").default;
const fs = require("fs");
const qrcode = require("qrcode-terminal");

// Carga de credenciales existentes o inicializa nuevas
let auth = { creds: {} };
const authFile = './auth_info.json';

if (fs.existsSync(authFile)) {
    auth = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
}

// Guardar credenciales cuando cambien
function saveAuth() {
    fs.writeFileSync(authFile, JSON.stringify(auth, null, 2));
}

async function startBot() {
    const sock = makeWASocket({
        auth
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log("Escanea este QR con WhatsApp");
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('Conexión cerrada, código:', reason);
            if (reason !== 401) { // 401 = loggedOut
                startBot();
            } else {
                console.log("Sesión cerrada, escanea el QR de nuevo");
            }
        }

        if (connection === 'open') {
            console.log('Bot conectado!');
        }
    });

    sock.ev.on('creds.update', () => {
        saveAuth();
    });

    sock.ev.on('messages.upsert', (m) => {
        console.log('Mensaje recibido:', m);
    });
}

startBot();