// bot.js
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require("@adiwajshing/baileys");
const { state, saveState } = useSingleFileAuthState('./auth_info.json');
const qrcode = require('qrcode-terminal');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // muestra QR en consola para escanear si no hay auth
    });

    // Guardar credenciales cuando se actualicen
    sock.ev.on('creds.update', saveState);

    // Escuchar QR si es necesario
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Mostrar QR en consola si no se ha autenticado
            qrcode.generate(qr, { small: true });
            console.log("Escanea este QR con WhatsApp para autenticar el bot");
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('Conexión cerrada, código:', reason);
            // Reconectar automáticamente si la sesión no fue cerrada por el usuario
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log('La sesión se cerró, escanea el QR de nuevo');
            }
        }

        if (connection === 'open') {
            console.log('Bot conectado correctamente!');
        }
    });

    // Ejemplo: recibir mensajes
    sock.ev.on('messages.upsert', (m) => {
        console.log('Mensaje recibido:', m);
    });
}

startBot();