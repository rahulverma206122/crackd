const fs = require("fs");
const path = require("path");

const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

const extractResumeText = async (filePath, fileType) => {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error("Resume file not found");
  }

  // =========================
  // PDF
  // =========================

  if (fileType === "pdf") {
    const buffer = fs.readFileSync(absolutePath);

    const parser = new PDFParse({
      data: buffer,
    });

    try {
      const result = await parser.getText();

      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  // =========================
  // DOCX
  // =========================

  if (fileType === "docx") {
    const result = await mammoth.extractRawText({
      path: absolutePath,
    });

    return result.value.trim();
  }

  throw new Error("Unsupported resume file type");
};

module.exports = extractResumeText;