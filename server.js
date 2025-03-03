const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido. Apenas PDFs são aceitos.'), false);
    }
    cb(null, true);
  }
});

app.use(cors());
app.use(express.json());

console.log("🚀 Inicializando API...");

// **FUNÇÃO ATUALIZADA PARA EXTRAÇÃO CORRETA**
function extractSections(text) {
  const regexSections = /\b([OPMF]\d+)\b([\s\S]*?)(?=\b[OPMF]\d+\b|$)/g;
  let matches;
  let extractedData = [];

  while ((matches = regexSections.exec(text)) !== null) {
    const sectionId = matches[1].trim(); // ID correto da seção (O1, P14, M10)
    const sectionContent = matches[2]; // Conteúdo da seção

    // Inicializa valores padrão
    let largura = "Não encontrado";
    let altura = "Não encontrado";
    let ambiente = "Não encontrado";
    let quantidade = "Não encontrado";
    let vidro = "Não encontrado";
    let informacoes = "Não encontrado";

    // **Expressões Regulares ajustadas**
    const larguraMatch = /Largura\s*\n?(\d+)/.exec(sectionContent);
    const alturaMatch = /Altur?a\s*\n?(\d+)/.exec(sectionContent);
    const ambienteMatch = /Ambiente\s*\n?([\w\s]+)/.exec(sectionContent);
    const qtdMatch = /Qtd\s*\n?(\d+)/.exec(sectionContent);
    const vidroMatch = /Vidro\s*\n?([\s\S]*?)(?=\n|$)/.exec(sectionContent);
    const infoMatch = /Informações\s*\n?([\s\S]*?)(?=\n|$)/.exec(sectionContent);

    // **Atribui os valores extraídos**
    if (larguraMatch) largura = larguraMatch[1];
    if (alturaMatch) altura = alturaMatch[1];
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

// **ROTA DE UPLOAD ATUALIZADA**
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
    res.json({ sections: extractedSections }); // Retorna um array com as seções corretamente extraídas
  } catch (error) {
    console.error("⚠️ Erro ao processar o PDF:", error.message);
    res.status(500).json({ error: "Erro ao processar o PDF: " + error.message });
  }
});

// **INICIA O SERVIDOR**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
