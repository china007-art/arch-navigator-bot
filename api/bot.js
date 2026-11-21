export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot is running");
  }

  try {
    const message = req.body?.message;
    if (!message || !message.text) {
      return res.status(200).send("OK");
    }

    const chatId = message.chat.id;
    const userText = message.text;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (userText === "/start") {
      await sendTelegramMessage(
        botToken,
        chatId,
        "Привет! Это Arch Navigator KZ — помощник по строительным нормам и архитектуре. Напиши свой вопрос или параметры объекта."
      );
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
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}