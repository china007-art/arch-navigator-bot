export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot is running");
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message;

    if (!message || !message.text) {
      return res.status(200).send("OK");
    }

    const chatId = message.chat.id;
    const userText = message.text.trim();
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    if (!botToken) {
      console.error("Missing TELEGRAM_BOT_TOKEN");
      return res.status(200).send("OK");
    }

    if (userText === "/start") {
      await sendTelegramMessage(
        botToken,
        chatId,
        "Привет! Это Arch Navigator KZ — помощник по строительным нормам и архитектуре. Напиши свой вопрос или параметры объекта."
      );
      return res.status(200).send("OK");
    }

    if (!geminiKey) {
      await sendTelegramMessage(botToken, chatId, "Не настроен GEMINI_API_KEY.");
      return res.status(200).send("OK");
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Ты эксперт-архитектор по строительным нормам РК. Отвечай чётко, по делу и ссылайся на релевантные нормы и пункты, если они применимы. Запрос пользователя: ${userText}`
                }
              ]
            }
          ]
        })
      }
    );

    const geminiData = await geminiResponse.json();
    const replyText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Не удалось получить ответ от модели. Попробуй переформулировать запрос.";

    await sendTelegramMessage(botToken, chatId, replyText.slice(0, 4000));
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Bot error:", err);
    return res.status(200).send("OK");
  }
}

async function sendTelegramMessage(token, chatId, text) {
  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  const tgData = await tgRes.text();
  if (!tgRes.ok) {
    console.error("Telegram sendMessage failed:", tgRes.status, tgData);
  }
}
