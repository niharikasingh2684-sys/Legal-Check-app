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
    script.onerror = () =>
      reject(new Error("OCR engine could not be loaded."));
    document.head.appendChild(script);
  });

  if (!window.Tesseract) {
    throw new Error("OCR engine is unavailable.");
  }

  return window.Tesseract;
}

function clean(value = "") {
  return value
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLine(value = "") {
  return clean(value.replace(/^[\s:;.,\-–—]+/, ""));
}

function findFirst(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanLine(match[1]);
    }
  }

  return "";
}

function getLines(text: string) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map(clean)
    .filter(Boolean);
}

function findLineValue(lines: string[], keywords: RegExp[]) {
  for (const line of lines) {
    for (const keyword of keywords) {
      if (keyword.test(line)) {
        const parts = line.split(/[:\-]/);

        if (parts.length > 1) {
          const value = cleanLine(parts.slice(1).join(" "));
          if (value) return value;
        }

        return line;
      }
    }
  }

  return "";
}

export function extractDeclarations(text: string): ExtractedData {
  const normalized = text.replace(/\r/g, "");
  const lines = getLines(normalized);

  // -----------------------------
  // MRP
  // -----------------------------
  let mrp = findFirst(normalized, [
    /(?:M\.?\s*R\.?\s*P\.?|MRP|maximum\s+retail\s+price)[^\n₹\d]{0,20}(₹?\s*\d[\d,]*(?:\.\d{1,2})?(?:\s*\([^)\n]*tax[^)\n]*\))?)/i,

    /(?:M\.?\s*R\.?\s*P\.?|MRP)[^\n]{0,30}?(₹\s*\d[\d,]*(?:\.\d{1,2})?)/i,

    /₹\s*(\d[\d,]*(?:\.\d{1,2})?)/i,
  ]);

  if (mrp && !/[₹Rr]/.test(mrp)) {
    mrp = `₹ ${mrp}`;
  }

  // -----------------------------
  // NET QUANTITY
  // Require an actual quantity unit.
  // This prevents Article No. values
  // such as 22G-896 being treated as quantity.
  // -----------------------------
  const quantityPatterns = [
    /(?:net\s*(?:qty|quantity|weight|content)|nett?\s*(?:wt|weight))\s*[:.\-]?\s*(\d+(?:[.,]\d+)?\s*(?:kg|kgs|g|gm|gms|gram|grams|ml|mL|l|litre|liter|litres|liters|pcs|pieces|pair|pairs|units?)\b)/i,

    /(?:net\s*(?:qty|quantity))\s*[:.\-]?\s*([^\n]{1,40})/i,
  ];

  let netQuantity = findFirst(normalized, quantityPatterns);

  if (
    netQuantity &&
    !/\b(?:kg|kgs|g|gm|gms|gram|grams|ml|l|litre|liter|litres|liters|pcs|pieces|pair|pairs|units?)\b/i.test(
      netQuantity
    )
  ) {
    netQuantity = "";
  }

  // -----------------------------
  // MANUFACTURER
  // -----------------------------
  let manufacturer = findFirst(normalized, [
    /(?:manufactured\s*by|manufacturer|mfd\.?\s*by)\s*[:.\-]?\s*([^\n]{3,160})/i,
  ]);

  if (!manufacturer) {
    manufacturer = findLineValue(lines, [
      /manufactured\s*by/i,
      /\bmanufacturer\b/i,
    ]);
  }

  // Remove common OCR garbage from beginning.
  manufacturer = cleanLine(
    manufacturer.replace(/^(?:by\s*)?[:\-–—]+\s*/i, "")
  );

  // -----------------------------
  // PACKER / IMPORTER
  // -----------------------------
  let packerImporter = findFirst(normalized, [
    /(?:packed\s*by|packer|imported\s*by|importer)\s*[:.\-]?\s*([^\n]{3,160})/i,
  ]);

  if (!packerImporter) {
    packerImporter = findLineValue(lines, [
      /packed\s*by/i,
      /\bpacker\b/i,
      /imported\s*by/i,
      /\bimporter\b/i,
    ]);
  }

  // -----------------------------
  // MONTH / YEAR
  // -----------------------------
  const monthYear = findFirst(normalized, [
    /(?:manufactured\s*on|manufacturing\s*date|mfg\.?\s*(?:date|on)?|mfd\.?\s*(?:date|on)?|packed\s*on|packing\s*date|pkd\.?\s*(?:date|on)?)\s*[:.\-]?\s*((?:0?[1-9]|1[0-2])[\/\-](?:20)?\d{2})/i,

    /(?:manufactured\s*on|mfg\.?|mfd\.?|packed\s*on|pkd\.?)[^\n]{0,20}((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s,\/\-]+20\d{2})/i,
  ]);

  // -----------------------------
  // CONSUMER CARE
  // Prefer actual phone/email/contact
  // information and explicitly avoid UID.
  // -----------------------------
  let consumerCare = "";

  const consumerLineIndex = lines.findIndex((line) =>
    /consumer\s*(?:complaint|care|feedback)|customer\s*care|contact\s*(?:customer|us)|complaint/i.test(
      line
    )
  );

  if (consumerLineIndex >= 0) {
    const context = lines
      .slice(
        consumerLineIndex,
        Math.min(lines.length, consumerLineIndex + 3)
      )
      .join(" ");

    const email = context.match(
      /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/
    )?.[0];

    const phone = context.match(
      /(?:\+91[\s-]?)?[6-9]\d{9}\b/
    )?.[0];

    if (phone && email) {
      consumerCare = `Tel: ${phone} / Email: ${email}`;
    } else if (phone) {
      consumerCare = `Tel: ${phone}`;
    } else if (email) {
      consumerCare = `Email: ${email}`;
    } else {
      consumerCare = clean(context);
    }
  }

  if (!consumerCare) {
    const email = normalized.match(
      /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/
    )?.[0];

    const phone = normalized.match(
      /(?:\+91[\s-]?)?[6-9]\d{9}\b/
    )?.[0];

    if (phone && email) {
      consumerCare = `Tel: ${phone} / Email: ${email}`;
    } else if (phone) {
      consumerCare = `Tel: ${phone}`;
    } else if (email) {
      consumerCare = `Email: ${email}`;
    }
  }

  // Never accept a UID/barcode number as consumer care.
  if (/^\s*(?:UID|U1D)[\s:\-]*\d+/i.test(consumerCare)) {
    consumerCare = "";
  }

  // -----------------------------
  // COUNTRY OF ORIGIN
  // Only populate when explicitly printed.
  // Never guess India from an Indian address.
  // -----------------------------
  const countryOfOrigin = findFirst(normalized, [
    /country\s*of\s*origin\s*[:.\-]?\s*([A-Za-z][A-Za-z ]{1,40})/i,
    /(?:made\s*in|product\s*of)\s*[:.\-]?\s*([A-Za-z][A-Za-z ]{1,40})/i,
  ]);

  // -----------------------------
  // OTHER USEFUL DECLARATIONS
  // -----------------------------
  const otherCandidates: string[] = [];

  const genericName = findFirst(normalized, [
    /generic\s*name\s*[:.\-]?\s*([^\n]{2,80})/i,
  ]);

  const article = findFirst(normalized, [
    /article\s*(?:no\.?|number)?\s*[:.\-]?\s*([^\n]{2,60})/i,
  ]);

  const batch = findFirst(normalized, [
    /batch\s*(?:no\.?|number)?\s*[:.\-]?\s*([^\n]{2,60})/i,
  ]);

  if (genericName) {
    otherCandidates.push(`Generic Name: ${genericName}`);
  }

  if (article) {
    otherCandidates.push(`Article No.: ${article}`);
  }

  if (batch) {
    otherCandidates.push(`Batch No.: ${batch}`);
  }

  const other = otherCandidates.join(" | ");

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
