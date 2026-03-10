const { default: makeWASocket, DisconnectReason, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const fs = require('fs-extra')

const { state, saveState } = useSingleFileAuthState('./auth_info.json')

async function startBot() {

    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' }),
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) {
            console.log("📲 Escanea este QR en tu teléfono")
            qrcode.generate(qr, { small: true })
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('🔴 Conexión cerrada, motivo:', reason)
            if (reason !== DisconnectReason.loggedOut) {
                startBot() // reconectar automáticamente
            }
        }
        if (connection === 'open') {
            console.log("🤖 BOT CONECTADO")
        }
    })

    sock.ev.on('creds.update', saveState)

    // Manejo de mensajes
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return

        const sender = msg.key.remoteJid
        const body = msg.message.conversation || msg.message?.extendedTextMessage?.text
        if (!body) return

        const command = body.toLowerCase()

        console.log("📩", sender, ":", body)

        // !ping
        if (command === "!ping") {
            await sock.sendMessage(sender, { text: "pong 🏓" })
            return
        }

        // !menu
        if (command === "!menu") {
            const menuText = `🤖 BOTARDO

Comandos:

!ping → probar bot
!id → ver id del chat
!sticker → crear sticker (responde a una imagen)

Uso sticker: responde a una imagen con !sticker
`
            await sock.sendMessage(sender, { text: menuText })
            return
        }

        // !id
        if (command === "!id") {
            const senderName = msg.pushName || "Desconocido"
            await sock.sendMessage(sender, {
                text: `Chat ID:\n${sender}\n\nAutor:\n${senderName}`
            })
            return
        }

        // !sticker
        if (command === "!sticker") {
            const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
            if (!quoted || !quoted.imageMessage) {
                await sock.sendMessage(sender, { text: "⚠️ Responde a una imagen con !sticker" })
                return
            }

            const media = await sock.downloadMediaMessage({ message: quoted.imageMessage, filename: 'sticker.jpg' })
            await sock.sendMessage(sender, { sticker: media })
        }
    })
}

startBot()