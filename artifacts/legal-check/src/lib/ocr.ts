import type { ExtractedData } from "./store";

declare global {
  interface Window {
    Tesseract?: any;
  }
}

const TESSERACT_URL =
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

async function loadTesseract() {
  if (window.Tesseract) return window.Tesseract;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TESSERACT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("OCR engine could not be loaded."));
    document.head.appendChild(script);
  });

  if (!window.Tesseract) {
    throw new Error("OCR engine is unavailable.");
  }

  return window.Tesseract;
}

function clean(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function findFirst(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return clean(match[1]);
    }
  }

  return "";
}

export function extractDeclarations(text: string): ExtractedData {
  const normalized = text.replace(/\r/g, "");

  const mrp = findFirst(normalized, [
    /(?:MRP|M\.R\.P\.?|maximum retail price)[^\n\d₹]{0,30}((?:₹|Rs\.?|INR)?\s*\d+(?:[.,]\d{1,2})?(?:\s*\([^\n)]*tax[^\n)]*\))?)/i,
    /((?:₹|Rs\.?|INR)\s*\d+(?:[.,]\d{1,2})?)/i,
  ]);

  const netQuantity = findFirst(normalized, [
    /(?:net\s*(?:qty|quantity|weight|content)|nett?\s*(?:wt|weight))\s*[:.-]?\s*((?:\d+(?:[.,]\d+)?)\s*(?:kg|g|gm|gms|ml|litre|liter|pcs?|pieces?|units?)[^\n]{0,25})/i,
    /\b((?:\d+(?:[.,]\d+)?)\s*(?:kg|g|gm|gms|ml|litre|liter|pcs?|pieces?|units?))\b/i,
  ]);

  const manufacturer = findFirst(normalized, [
    /(?:manufactured\s*by|manufacturer|mfd\.?\s*by)\s*[:.-]?\s*([^\n]{3,120})/i,
  ]);

  const packerImporter = findFirst(normalized, [
    /(?:packed\s*by|packer|imported\s*by|importer)\s*[:.-]?\s*([^\n]{3,120})/i,
  ]);

  const monthYear = findFirst(normalized, [
    /(?:mfg|mfd|manufactured|packed|pkd|packing)\s*(?:date|on)?\s*[:.-]?\s*((?:0?[1-9]|1[0-2])[/-](?:20)?\d{2})/i,
    /(?:mfg|mfd|manufactured|packed|pkd|packing)\s*(?:date|on)?\s*[:.-]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[ ,/-]+20\d{2})/i,
  ]);

  const consumerCare = findFirst(normalized, [
    /(?:consumer\s*(?:care|complaint|helpline)|customer\s*care|contact\s*us)\s*[:.-]?\s*([^\n]{3,120})/i,
    /([\w.+-]+@[\w.-]+\.[A-Za-z]{2,}[^\n]{0,50})/,
  ]);

  const countryOfOrigin = findFirst(normalized, [
    /(?:country\s*of\s*origin|made\s*in|product\s*of)\s*[:.-]?\s*([A-Za-z][A-Za-z ]{1,40})/i,
  ]);

  const lines = normalized
    .split("\n")
    .map(clean)
    .filter(Boolean);

  const other =
    lines.find((line) =>
      /product|commodity|contents?|edible|food|oil|soap|shampoo|biscuit|snack/i.test(
        line
      )
    ) || "";

  return {
    mrp,
    netQuantity,
    manufacturer,
    packerImporter,
    monthYear,
    consumerCare,
    countryOfOrigin,
    other,
  };
}

export async function runPackageOcr(
  imageDataUrl: string,
  onProgress?: (progress: number) => void
) {
  const Tesseract = await loadTesseract();

  const result = await Tesseract.recognize(imageDataUrl, "eng", {
    logger: (message: any) => {
      if (
        message.status === "recognizing text" &&
        typeof message.progress === "number"
      ) {
        onProgress?.(Math.round(message.progress * 100));
      }
    },
  });

  const rawText = result.data.text || "";

  return {
    rawText,
    confidence: Math.round(result.data.confidence || 0),
    extractedData: extractDeclarations(rawText),
  };
}
