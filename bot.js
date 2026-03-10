// bot.js
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys/lib/index')
const { state, saveState } = useSingleFileAuthState('./auth_info.json')
const P = require('pino') // Para logging
const qrcode = require('qrcode-terminal')

// Función principal para iniciar el bot
async function startBot() {
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log('Baileys version:', version, 'Latest?', isLatest)

  // Crear socket
  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    logger: P({ level: 'silent' })
  })

  // Guardar estado de autenticación cuando cambie
  sock.ev.on('creds.update', saveState)

  // Detectar conexión y desconexión
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('Escanea este QR con tu WhatsApp:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const reason = lastDisconnect.error?.output?.statusCode
      console.log('Conexión cerrada, código:', reason)
      // Reintentar
      if (reason !== DisconnectReason.loggedOut) {
        startBot()
      }
    } else if (connection === 'open') {
      console.log('Conectado a WhatsApp!')
    }
  })

  // Escuchar mensajes
  sock.ev.on('messages.upsert', async (msg) => {
    const message = msg.messages[0]
    if (!message.message || message.key.fromMe) return

    const sender = message.key.remoteJid
    const text = message.message.conversation || ''

    console.log('Mensaje recibido de', sender, ':', text)

    // Responder a cualquier mensaje
    if (text.toLowerCase() === 'hola') {
      await sock.sendMessage(sender, { text: '¡Hola! Soy tu StickerBot 🐱‍👤' })
    }
  })
}

// Iniciar bot
startBot()