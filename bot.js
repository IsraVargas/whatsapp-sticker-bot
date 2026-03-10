// bot.js
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const fs = require('fs')
const qrcode = require('qrcode-terminal')
const P = require('pino')

async function startBot() {
  const { version } = await fetchLatestBaileysVersion()
  console.log('Usando Baileys v', version)

  // Aquí usamos multiFileAuthState porque v5.0.0 no tiene singleFileAuthState
  const { state, saveCreds } = await useMultiFileAuthState('auth_info') // genera carpeta auth_info

  const sock = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) qrcode.generate(qr, { small: true })
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log('Conexión cerrada, código:', reason)
      if (reason !== DisconnectReason.loggedOut) startBot()
    } else if (connection === 'open') {
      console.log('Conectado a WhatsApp!')
    }
  })

  sock.ev.on('messages.upsert', async (msg) => {
    const message = msg.messages[0]
    if (!message.message || message.key.fromMe) return

    const sender = message.key.remoteJid
    const text = message.message.conversation || ''

    console.log('Mensaje de', sender, ':', text)

    if (text.toLowerCase() === 'hola') {
      await sock.sendMessage(sender, { text: '¡Hola! StickerBot activo 🐱‍👤' })
    }
  })
}

startBot()