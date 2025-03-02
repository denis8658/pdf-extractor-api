const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");

const app = express();
const upload = multer(); // Configuração do multer para processar arquivos

app.use(cors()); // Permite acesso de outras origens, como FlutterFlow
app.use(express.json());

console.log("🚀 Inicializando API...");

// Rota de teste para verificar se a API está rodando
app.get("/", (req, res) => {
  console.log("✅ Rota '/' acessada - API está rodando.");
  res.send("🚀 API de Extração de Texto de PDF está rodando!");
});

// Rota para upload e extração de texto do PDF
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("📥 Recebendo requisição POST em /upload...");

  // Logs para verificar os dados recebidos
  console.log("🔹 Headers recebidos:", req.headers);
  console.log("🔹 Body recebido:", req.body);
  console.log("🔹 Arquivo recebido:", req.file ? req.file.originalname : "Nenhum arquivo");

  try {
    if (!req.file) {
      console.log("❌ Nenhum arquivo foi enviado!");
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    // Processar o PDF
    console.log("🔄 Processando arquivo PDF...");
    const pdfText = await pdfParse(req.file.buffer);
    console.log("✅ PDF processado com sucesso!");

    res.json({ text: pdfText.text });
  } catch (error) {
    console.error("⚠️ Erro ao processar o PDF:", error.message);
    res.status(500).json({ error: "Erro ao processar o PDF: " + error.message });
  }
});

// Inicia o servidor na porta 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
