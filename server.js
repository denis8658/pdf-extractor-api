const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

console.log("🚀 Inicializando API...");

// Função para identificar as seções dinamicamente
function extractSections(text) {
  const regexSections = /(\b[A-Z0-9-]+\b)([\s\S]*?)(?=\b[A-Z0-9-]+\b|$)/g;
  let matches;
  let extractedData = [];

  while ((matches = regexSections.exec(text)) !== null) {
    const sectionId = matches[1]; // ID da seção
    const sectionContent = matches[2]; // Conteúdo da seção

    // Expressões Regulares para capturar as informações
    const larguraMatch = /Largura\s*:\s*(\d+)/.exec(sectionContent);
    const alturaMatch = /Altura\s*:\s*(\d+)/.exec(sectionContent);
    const ambienteMatch = /Ambiente\s*:\s*([\w\s]+)/.exec(sectionContent);
    const qtdMatch = /Qtd\s*:\s*(\d+)/.exec(sectionContent);
    const vidroMatch = /Vidro\s*:\s*([\s\S]*?)(?=\n|$)/.exec(sectionContent);
    const infoMatch = /Informações\s*:\s*([\s\S]*?)(?=\n|$)/.exec(sectionContent);

    // Adiciona ao array de saída
    extractedData.push({
      ID: sectionId,
      Largura: larguraMatch ? larguraMatch[1] : "Não encontrado",
      Altura: alturaMatch ? alturaMatch[1] : "Não encontrado",
      Ambiente: ambienteMatch ? ambienteMatch[1].trim() : "Não encontrado",
      Quantidade: qtdMatch ? qtdMatch[1] : "Não encontrado",
      Vidro: vidroMatch ? vidroMatch[1].trim() : "Não encontrado",
      Informações: infoMatch ? infoMatch[1].trim() : "Não encontrado",
    });
  }

  return extractedData;
}

// Rota para upload e extração dos dados
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    console.log("🔄 Processando arquivo PDF...");
    const pdfData = await pdfParse(req.file.buffer);
    console.log(pdfData.text); // Log do texto extraído
    const extractedSections = extractSections(pdfData.text);
    
    console.log("✅ PDF processado com sucesso!");
    res.json({ sections: extractedSections });
  } catch (error) {
    console.error("⚠️ Erro ao processar o PDF:", error.message);
    res.status(500).json({ error: "Erro ao processar o PDF: " + error.message });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));