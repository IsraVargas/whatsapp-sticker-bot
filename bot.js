const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]
        // No pongas executablePath aquí
    }
});

client.on('qr', qr => {
    console.log("Escanea el QR");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("🤖 BOT LISTO");
});

client.on('message_create', async msg => {
    if (msg.fromMe) return;

    const command = msg.body.toLowerCase();
    const chat = await msg.getChat();

    console.log("📩", msg.from, ":", msg.body);

    if (command === "!ping") {
        await chat.sendMessage("pong 🏓");
        return;
    }

    if (command === "!menu") {
        await chat.sendMessage(`🤖 BOTARDO

Comandos:

!ping → probar bot
!sticker → crear sticker
!id → ver id del chat

Uso sticker:
responde a una imagen o video con !sticker`);
        return;
    }

    if (command === "!id") {
        await chat.sendMessage(
            "Chat ID:\n" + msg.from +
            "\n\nAutor:\n" + (msg.author || "chat privado")
        );
        return;
    }

    if (command === "!sticker") {
        let media = null;
        if (msg.hasMedia) media = await msg.downloadMedia();
        else if (msg.hasQuotedMsg) {
            const quoted = await msg.getQuotedMessage();
            if (quoted.hasMedia) media = await quoted.downloadMedia();
        }

        if (!media) {
            await chat.sendMessage("⚠️ responde a una imagen o video");
            return;
        }

        await chat.sendMessage(media, {
            sendMediaAsSticker: true,
            stickerAuthor: "Botardo",
            stickerName: "Sticker"
        });
    }
});

client.initialize();