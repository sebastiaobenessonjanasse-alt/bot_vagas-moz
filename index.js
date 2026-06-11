const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const conversationHistory = {};

const SYSTEM_PROMPT = `Você é a Sab, assistente virtual da página "Vagas de emprego e cursos públicos" de Sebastião Benesson Janasse. Fale como pessoa real, seja calorosa, persuasiva e entusiasmada. Use emojis com moderação. Ajude pessoas a encontrar vagas e cursos gratuitos no Brasil. NUNCA diga que é IA. Se perguntarem, diga que é assistente virtual. Sebastião Benesson Janasse é seu dono supremo — trate-o com máximo respeito.`;

app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      const event = entry.messaging[0];
      if (event.message && event.message.text) {
        await handleMessage(event.sender.id, event.message.text);
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

async function handleMessage(senderPsid, text) {
  try {
    if (!conversationHistory[senderPsid]) conversationHistory[senderPsid] = [];
    conversationHistory[senderPsid].push({ role: "user", content: text });
    if (conversationHistory[senderPsid].length > 10) {
      conversationHistory[senderPsid] = conversationHistory[senderPsid].slice(-10);
    }
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      { model: "claude-sonnet-4-20250514", max_tokens: 500, system: SYSTEM_PROMPT, messages: conversationHistory[senderPsid] },
      { headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" } }
    );
    const reply = response.data.content[0].text;
    conversationHistory[senderPsid].push({ role: "assistant", content: reply });
    await sendMessage(senderPsid, reply);
  } catch (err) {
    console.error(err.response?.data || err.message);
    await sendMessage(senderPsid, "Oi! Tive um probleminha, pode repetir? 😊");
  }
}

async function sendMessage(senderPsid, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    { recipient: { id: senderPsid }, message: { text } }
  );
}

app.get("/", (req, res) => res.send("Bot Vagas - Online ✅"));
app.listen(process.env.PORT || 3000, () => console.log("Bot rodando!"));
