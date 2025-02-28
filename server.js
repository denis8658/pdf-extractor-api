const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");

const app = express();
const upload = multer(); // Configuração do multer para processar arquivos

app.use(cors()); // Permite acesso de outras origens, como FlutterFlow
app.use(express.json());

// Rota de teste para verificar se a API está rodando
app.get("/", (req, res) => {
  res.send("🚀 API de Extração de Texto de PDF está rodando!");
});

// Rota para upload e extração de texto do PDF
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const pdfText = await pdfParse(req.file.buffer);
    res.json({ text: pdfText.text });
  } catch (error) {
    res.status(500).json({ error: "Erro ao processar o PDF: " + error.message });
  }
});

// Inicia o servidor na porta 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
