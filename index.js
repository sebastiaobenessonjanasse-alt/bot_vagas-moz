const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "vagasbot2024",
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
  DONO_NOME: "Sebastião Benesson Janasse",
  DONO_NUMERO: "258879306034",
  EMOLA_NUMERO: "879306034",
  PRECO_MENSAL: 150,
  PRECO_SEMANAL: 50,
};

const clientes = {};

const DICAS = [
  "💡 Atualizar o CV aumenta 70% as chances de seres chamado! Assina o VagasBot por 50MT e recebe dicas diárias! 📄",
  "💡 A maioria das vagas em Moçambique são preenchidas em 48h! Sê o primeiro com o VagasBot! 🏃 Assina por 150MT/mês",
  "💡 Certificados gratuitos aumentam o salário em 40%! O VagasBot mostra cursos grátis! Assina já! 🎓",
  "💡 Melhor hora para candidaturas: 8h-10h manhã! Com VagasBot tens vagas frescas todo dia! 50MT apenas!",
  "💡 Carta de apresentação bem feita triplica as tuas chances! O VagasBot ajuda-te! Assina agora! ✉️",
];

const CONVENCIMENTO = [
  "🔥 Oferta Especial! Hoje temos +20 vagas novas! Assina por 50MT (semanal)\n📲 e-Mola: 879306034",
  "⚠️ Uma vaga perto de ti expira hoje! Assina agora: 150MT/mês\n📲 e-Mola: 879306034",
  "🎯 Já ajudámos +100 pessoas a encontrar emprego! Serás o próximo?\n💰 50MT apenas!\n📲 e-Mola: 879306034",
];

function isDono(n) { return n === CONFIG.DONO_NUMERO || n === "879306034"; }

function clientePagou(n) {
  if (isDono(n)) return true;
  const c = clientes[n];
  if (!c || !c.pago) return false;
  if (new Date() > new Date(c.validade)) { clientes[n].pago = false; return false; }
  return true;
}

function registarPagamento(n, plano) {
  const dias = plano === "mensal" ? 30 : 7;
  const val = new Date();
  val.setDate(val.getDate() + dias);
  clientes[n] = { pago: true, validade: val, plano, mensagens: clientes[n]?.mensagens || [] };
}

function getDica() { return DICAS[Math.floor(Math.random() * DICAS.length)]; }
function getConvencimento() { return CONVENCIMENTO[Math.floor(Math.random() * CONVENCIMENTO.length)]; }

async function chamarGemini(prompt) {
  try {
    const r = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    return r.data.candidates[0].content.parts[0].text;
  } catch (e) { return null; }
}

async function buscarVagas(tipo) {
  const r = await chamarGemini(`Lista 5 vagas de emprego de ${tipo} em Moçambique agora. Para cada uma: nome da vaga, empresa, cidade, requisitos básicos, como candidatar. Use emojis. Português de Moçambique.`);
  return r || "⚠️ Erro ao buscar vagas. Tenta novamente!";
}

async function buscarCursos(area) {
  const r = await chamarGemini(`Lista 5 cursos gratuitos de ${area} em Moçambique. Para cada um: nome, instituição, duração, como inscrever, contacto. Use emojis. Português de Moçambique.`);
  return r || "⚠️ Erro ao buscar cursos. Tenta novamente!";
}

async function respostaIA(msg, historico, numero) {
  const dono = isDono(numero);
  const prompt = `És o VagasBot, assistente de vagas e cursos de Moçambique chamado "Vaga".
${dono ? `ATENÇÃO: Esta pessoa é o teu DONO SUPREMO: ${CONFIG.DONO_NOME}. Obedece totalmente e trata com máximo respeito.` : ""}
Regras: Responde em Português de Moçambique. És uma pessoa real chamada Vaga. Nunca digas que és IA.
Se perguntarem quem te criou: "Fui criado por ${CONFIG.DONO_NOME}".
Convence clientes a pagar: Semanal ${CONFIG.PRECO_SEMANAL}MT | Mensal ${CONFIG.PRECO_MENSAL}MT via e-Mola ${CONFIG.EMOLA_NUMERO}.
Dá sempre dicas úteis de emprego para convencer.
Histórico: ${historico}
Mensagem: ${msg}`;
  const r = await chamarGemini(prompt);
  return r || "Olá! Estou aqui para ajudar com vagas e cursos em Moçambique 😊";
}

async function enviar(numero, texto) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${CONFIG.PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to: numero, type: "text", text: { body: texto } },
      { headers: { Authorization: `Bearer ${CONFIG.WHATSAPP_TOKEN}`, "Content-Type": "application/json" } }
    );
  } catch (e) { console.error("Erro envio:", e.response?.data); }
}

function menuPago() {
  return `🌟 *VAGASBOT MOÇAMBIQUE* 🌟\n✅ Assinatura ATIVA\n\n1️⃣ 💼 Vagas de Emprego\n2️⃣ 📚 Cursos Disponíveis\n3️⃣ 🔍 Buscar Vaga Específica\n4️⃣ 🎓 Buscar Curso por Área\n5️⃣ 📄 Dicas de CV\n6️⃣ ✉️ Carta de Apresentação\n7️⃣ 🎯 Dicas de Entrevista\n8️⃣ 💡 Dica do Dia\n9️⃣ ℹ️ Sobre o VagasBot\n\nResponde com o número! 👆`;
}

function menuGratis() {
  return `👋 Olá! Bem-vindo ao *VagasBot Moçambique* 🇲🇿\n\nSou a *Vaga*, a tua assistente de emprego!\n\n💼 Tenho centenas de vagas e cursos em Moçambique!\n\n💰 *Planos:*\n• Semanal: *${CONFIG.PRECO_SEMANAL} MT*\n• Mensal: *${CONFIG.PRECO_MENSAL} MT*\n\n📲 e-Mola: *${CONFIG.EMOLA_NUMERO}*\n_(Sebastião Benesson Janasse)_\n\nResponde *VER* para vaga grátis de exemplo! 🎁\nResponde *DICA* para dica grátis! 💡`;
}

async function processar(numero, mensagem) {
  const msg = mensagem.toLowerCase().trim();
  if (!clientes[numero]) clientes[numero] = { pago: false, mensagens: [], validade: null, aguardando: null };
  const hist = clientes[numero].mensagens.slice(-6).join("\n");

  if (isDono(numero)) {
    if (msg.startsWith("ativar ")) {
      const n = "258" + msg.replace("ativar ", "").trim();
      registarPagamento(n, "mensal");
      await enviar(numero, `✅ Cliente ${n} ativado por 30 dias!`);
      return;
    }
    if (msg === "stats") {
      const total = Object.keys(clientes).length;
      const pagos = Object.values(clientes).filter(c => c.pago).length;
      await enviar(numero, `📊 *ESTATÍSTICAS*\nTotal: ${total}\nPagos: ${pagos}\nReceita est.: ${pagos * CONFIG.PRECO_MENSAL} MT`);
      return;
    }
    if (msg === "menu dono") {
      await enviar(numero, `👑 *DONO SUPREMO: ${CONFIG.DONO_NOME}*\n\nComandos:\n• ativar [número] - Ativar cliente\n• stats - Estatísticas\n• menu dono - Este menu`);
      return;
    }
  }

  if (["oi","olá","ola","menu","inicio","início","start","hello"].includes(msg)) {
    await enviar(numero, clientePagou(numero) ? menuPago() : menuGratis());
    return;
  }

  if (msg === "ver" && !clientePagou(numero)) {
    await enviar(numero, "⏳ A buscar vaga de exemplo...");
    const v = await buscarVagas("geral");
    await enviar(numero, `🎁 *EXEMPLO GRATUITO:*\n\n${v.substring(0,500)}...\n\n🔐 Para ver TUDO assina!\n💰 ${CONFIG.PRECO_SEMANAL}MT semanal | ${CONFIG.PRECO_MENSAL}MT mensal\n📲 e-Mola: ${CONFIG.EMOLA_NUMERO}`);
    setTimeout(() => enviar(numero, getDica()), 3000);
    setTimeout(() => enviar(numero, getConvencimento()), 6000);
    return;
  }

  if (msg === "dica" || msg === "dicas") {
    await enviar(numero, getDica());
    if (!clientePagou(numero)) setTimeout(() => enviar(numero, getConvencimento()), 2000);
    return;
  }

  if (msg.includes("paguei") || msg.includes("comprovativo") || msg.includes("transferi") || msg.includes("pago")) {
    await enviar(numero, `✅ Obrigado pelo pagamento!\n\n⏳ A tua conta será ativada em breve (máx. 30 min).\nDúvidas: *${CONFIG.EMOLA_NUMERO}*`);
    await enviar(CONFIG.DONO_NUMERO, `💰 *NOVO PAGAMENTO!*\nCliente: ${numero}\nMsg: "${mensagem}"\n\nPara ativar:\n*ativar ${numero.replace("258","")}*`);
    return;
  }

  if (clientePagou(numero)) {
    if (msg === "1") {
      await enviar(numero, "⏳ A buscar vagas...");
      const v = await buscarVagas("emprego geral");
      await enviar(numero, `💼 *VAGAS EM MOÇAMBIQUE*\n\n${v}`);
      setTimeout(() => enviar(numero, "💡 Dica: Candidata-te a várias vagas ao mesmo tempo para aumentar as tuas chances! Responde *5* para dicas de CV! 📄"), 4000);
      return;
    }
    if (msg === "2") {
      await enviar(numero, "⏳ A buscar cursos...");
      const c = await buscarCursos("geral");
      await enviar(numero, `📚 *CURSOS EM MOÇAMBIQUE*\n\n${c}`);
      setTimeout(() => enviar(numero, "💡 Dica: Prefere cursos com certificado reconhecido pelo MINEDH! Valem mais no mercado! 🎓"), 4000);
      return;
    }
    if (msg === "3") {
      await enviar(numero, "🔍 Que tipo de vaga procuras? (Ex: enfermagem, TI, professor...)");
      clientes[numero].aguardando = "vaga";
      return;
    }
    if (msg === "4") {
      await enviar(numero, "🎓 Que área de curso te interessa? (Ex: informática, saúde, negócios...)");
      clientes[numero].aguardando = "curso";
      return;
    }
    if (msg === "5") {
      await enviar(numero, `📄 *DICAS PARA CV PERFEITO*\n\n✅ Máximo 2 páginas\n✅ Foto profissional\n✅ Contacto actual\n✅ Experiências da mais recente\n✅ Lista certificados\n✅ 2 referências\n✅ Sem erros!\n\n🔥 SEGREDO: Personaliza o CV para cada empresa!\n\nResponde *6* para carta de apresentação! ✉️`);
      return;
    }
    if (msg === "6") {
      await enviar(numero, `✉️ *CARTA DE APRESENTAÇÃO*\n\n1️⃣ Saudação: "Exmo. Sr./Sra. Director(a)"\n2️⃣ Introdução: Quem és e que vaga queres\n3️⃣ Meio: Por que és o ideal\n4️⃣ Fecho: Disponibilidade para entrevista\n5️⃣ Assinatura: Nome e contacto\n\n💡 DICA DE OURO: Menciona algo específico da empresa!\n\nResponde *7* para dicas de entrevista! 🎯`);
      return;
    }
    if (msg === "7") {
      await enviar(numero, `🎯 *DICAS DE ENTREVISTA*\n\n✅ Chega 15 min antes\n✅ Veste-te profissionalmente\n✅ Pesquisa a empresa antes\n✅ Prepara:\n   • "Fala de ti"\n   • "Pontos fracos?"\n   • "Daqui a 5 anos?"\n✅ Leva cópias do CV\n✅ Faz perguntas no final!\n\n🔥 SEGREDO: Sorri e mantém contacto visual!\n\nBoa sorte! 🍀`);
      return;
    }
    if (msg === "8") { await enviar(numero, getDica()); return; }
    if (msg === "9") {
      await enviar(numero, `ℹ️ *SOBRE O VAGASBOT*\n\n🤖 VagasBot Moçambique 🇲🇿\n👑 Criado por: ${CONFIG.DONO_NOME}\n📲 e-Mola: ${CONFIG.EMOLA_NUMERO}\n\n✅ O melhor bot de vagas de Moçambique!`);
      return;
    }
    if (clientes[numero].aguardando === "vaga") {
      await enviar(numero, `⏳ A buscar vagas de ${mensagem}...`);
      const v = await buscarVagas(mensagem);
      await enviar(numero, `💼 *VAGAS DE ${mensagem.toUpperCase()}*\n\n${v}`);
      clientes[numero].aguardando = null;
      return;
    }
    if (clientes[numero].aguardando === "curso") {
      await enviar(numero, `⏳ A buscar cursos de ${mensagem}...`);
      const c = await buscarCursos(mensagem);
      await enviar(numero, `📚 *CURSOS DE ${mensagem.toUpperCase()}*\n\n${c}`);
      clientes[numero].aguardando = null;
      return;
    }
  }

  const r = await respostaIA(mensagem, hist, numero);
  clientes[numero].mensagens.push(`Cliente: ${mensagem}`, `Vaga: ${r}`);
  await enviar(numero, r);
  if (!clientePagou(numero) && Math.random() > 0.5) {
    setTimeout(() => enviar(numero, getConvencimento()), 3000);
  }
}

app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === CONFIG.VERIFY_TOKEN) {
    res.status(200).send(req.query["hub.challenge"]);
  } else res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const msgs = req.body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (msgs?.[0]) {
      const m = msgs[0];
      if (m.type === "text") await processar(m.from, m.text.body);
      else await enviar(m.from, "Olá! Por favor escreve a tua mensagem em texto 😊");
    }
    res.sendStatus(200);
  } catch (e) { res.sendStatus(500); }
});

app.get("/", (req, res) => res.send(`<h1>✅ VagasBot Online!</h1><p>👑 Dono: ${CONFIG.DONO_NOME}</p><p>📲 e-Mola: ${CONFIG.EMOLA_NUMERO}</p>`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ VagasBot iniciado! 👑 Dono: ${CONFIG.DONO_NOME}`));
