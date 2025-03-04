const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Tipo de arquivo não permitido. Apenas PDFs são aceitos."), false);
    }
    cb(null, true);
  },
});

app.use(cors());
app.use(express.json());

console.log("🚀 Inicializando API...");

// **Função para extrair seções corretamente**
function extractSections(text) {
  text = text.replace(/\n/g, " "); // Remove quebras de linha para facilitar o regex
  text = text.replace(/Altur\s*a/g, "Altura"); // Corrige palavras quebradas

  const regexSections = /\b([OPMF]\d+(-\d+)?)\b([\s\S]*?)(?=\b[OPMF]\d+(-\d+)?\b|$)/g;
  let matches;
  let extractedData = [];

  while ((matches = regexSections.exec(text)) !== null) {
    const sectionId = matches[1].trim(); // ID correto da seção (ex: O1, P14, M10, F4)
    const sectionContent = matches[3]; // Conteúdo da seção

    console.log(`\n🔍 Processando seção: ${sectionId}\n${sectionContent}\n`);

    // **Inicializa valores padrão**
    let largura = "Não encontrado";
    let altura = "Não encontrado";
    let ambiente = "Não encontrado";
    let quantidade = "Não encontrado";
    let vidro = "Não encontrado";
    let informacoes = "Não encontrado";

    // **Expressões Regulares melhoradas**
    const larguraMatch = /Largura\s*[:=]?\s*(\d+)/i.exec(sectionContent);
    const alturaMatch = /Altura\s*[:=]?\s*(\d+\s*\d*)/i.exec(sectionContent);  // <- Atualizado para pegar "120 0"
    const ambienteMatch = /Ambiente\s*[:=]?\s*([\w\s]+)/i.exec(sectionContent);
    const qtdMatch = /Qtd\s*[:=]?\s*(\d+)/i.exec(sectionContent);
    const vidroMatch = /Vidro\s*[:=]?\s*([\s\S]*?)(?=\n|$)/i.exec(sectionContent);
    const infoMatch = /Informações\s*[:=]?\s*([\s\S]*?)(?=\n|$)/i.exec(sectionContent);

    // **Atribui os valores extraídos**
    if (larguraMatch) largura = larguraMatch[1];
    if (alturaMatch) altura = alturaMatch[1].replace(/\s/g, ""); // Remove espaços entre números
    if (ambienteMatch) ambiente = ambienteMatch[1].trim();
    if (qtdMatch) quantidade = qtdMatch[1];
    if (vidroMatch) vidro = vidroMatch[1].trim();
    if (infoMatch) informacoes = infoMatch[1].trim();

    // **Adiciona ao array final**
    extractedData.push({
      ID: sectionId,
      Largura: largura,
      Altura: altura,
      Ambiente: ambiente,
      Quantidade: quantidade,
      Vidro: vidro,
      Informações: informacoes,
    });
  }

  return extractedData;
}

// **Rota de upload e processamento do PDF**
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    console.log("🔄 Processando arquivo PDF...");
    const pdfData = await pdfParse(req.file.buffer);
    const extractedSections = extractSections(pdfData.text);

    console.log("✅ PDF processado com sucesso!");
    res.json({ sections: extractedSections });
  } catch (error) {
    console.error("⚠️ Erro ao processar o PDF:", error.message);
    res.status(500).json({ error: "Erro ao processar o PDF: " + error.message });
  }
});

// **Inicia o servidor**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
