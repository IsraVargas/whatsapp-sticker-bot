const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]
    }
})

client.on('qr', qr => {
    console.log("Escanea el QR")
    qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
    console.log("🤖 BOT LISTO")
})

client.on('message_create', async msg => {

    console.log("📩", msg.from, ":", msg.body)

    const command = msg.body.toLowerCase()

    // ping
    if (command === "!ping") {
        await msg.reply("pong 🏓")
        return
    }

    // menu
    if (command === "!menu") {

        await msg.reply(`🤖 BOTARDO

Comandos:

!ping → probar bot
!sticker → crear sticker
!id → ver id del chat

Uso sticker:
responde a una imagen o video con !sticker
`)

        return
    }

    // obtener id
    if (command === "!id") {

        await msg.reply(
            "Chat ID:\n" + msg.from +
            "\n\nAutor:\n" + (msg.author || "chat privado")
        )

        return
    }

    // crear sticker
    if (command === "!sticker") {

        let media = null

        if (msg.hasMedia) {

            media = await msg.downloadMedia()

        } else if (msg.hasQuotedMsg) {

            const quoted = await msg.getQuotedMessage()

            if (quoted.hasMedia) {
                media = await quoted.downloadMedia()
            }

        }

        if (!media) {
            await msg.reply("⚠️ responde a una imagen o video")
            return
        }

        await client.sendMessage(msg.from, media, {
            sendMediaAsSticker: true,
            stickerAuthor: "Botardo",
            stickerName: "Sticker"
        })

    }

})

client.initialize()