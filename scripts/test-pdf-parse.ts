import * as fs from "fs";
const { PDFParse } = require("pdf-parse");

async function main() {
  const buffer = fs.readFileSync("/home/benp/Lnx Downloads/Great_Founders_Write (1) (1).pdf");
  const parser = new PDFParse(new Uint8Array(buffer));
  await parser.load();

  const text = await parser.getText();
  console.log("Total text length:", text.length);
  console.log("\n--- First 3000 chars ---");
  console.log(text.slice(0, 3000));

  // Search for chapter heading patterns to understand text structure
  console.log("\n--- Lines matching chapter patterns ---");
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      /^(chapter|part)\s+\d/i.test(line) ||
      /^(introduction|conclusion|postscript|acknowledgments|about the author)/i.test(line) ||
      /^\d+\s+[A-Z][a-z]/.test(line) ||
      line === "Table of Contents"
    ) {
      console.log(`Line ${i}: "${line}"`);
    }
  }

  parser.destroy();
}

main().catch(console.error);
