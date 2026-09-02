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

function cleanStart(value = "") {
  return clean(value.replace(/^[\s:;.,\-–—]+/, ""));
}

function findFirst(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanStart(match[1]);
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

function removeTrailingGarbage(value: string) {
  return clean(
    value
      .replace(/\s+(?:he|hc|h[eoc]|[=|])\s*[=|]?\s*$/i, "")
      .replace(/\s+[=|]+\s*$/g, "")
  );
}

function validIndianPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91") &&
    /^[6-9]/.test(digits.substring(2))
  ) {
    return `+91 ${digits.substring(2)}`;
  }

  return "";
}

export function extractDeclarations(text: string): ExtractedData {
  const normalized = text.replace(/\r/g, "");
  const lines = getLines(normalized);

  // MRP
  let mrp = findFirst(normalized, [
    /(?:M\.?\s*R\.?\s*P\.?|MRP|maximum\s+retail\s+price)[^\n₹\d]{0,25}(₹?\s*\d[\d,]*(?:\.\d{1,2})?(?:\s*\([^)\n]*tax[^)\n]*\))?)/i,
    /(?:M\.?\s*R\.?\s*P\.?|MRP)[^\n]{0,35}?(₹\s*\d[\d,]*(?:\.\d{1,2})?)/i,
  ]);

  if (mrp && !mrp.includes("₹")) {
    mrp = `₹ ${mrp}`;
  }

  // Net quantity
  let netQuantity = findFirst(normalized, [
    /(?:net\s*(?:qty|quantity|weight|content)|nett?\s*(?:wt|weight))\s*[:.\-]?\s*(\d+(?:[.,]\d+)?\s*(?:kg|kgs|g|gm|gms|gram|grams|ml|mL|l|litre|liter|litres|liters|pcs|pieces|pair|pairs|units?)\b)/i,
  ]);

  if (
    netQuantity &&
    !/\b(?:kg|kgs|g|gm|gms|gram|grams|ml|l|litre|liter|litres|liters|pcs|pieces|pair|pairs|units?)\b/i.test(
      netQuantity
    )
  ) {
    netQuantity = "";
  }

  // Manufacturer
  let manufacturer = "";

  for (let i = 0; i < lines.length; i++) {
    if (/manufactured\s*by|manufacturer|mfd\.?\s*by/i.test(lines[i])) {
      const match = lines[i].match(
        /(?:manufactured\s*by|manufacturer|mfd\.?\s*by)\s*[:.\-]?\s*(.*)/i
      );

      if (match?.[1]) {
        manufacturer = removeTrailingGarbage(match[1]);
      }

      if (!manufacturer && lines[i + 1]) {
        manufacturer = removeTrailingGarbage(lines[i + 1]);
      }

      break;
    }
  }

  // Packer / Importer
  let packerImporter = "";

  for (let i = 0; i < lines.length; i++) {
    if (/packed\s*by|\bpacker\b|imported\s*by|\bimporter\b/i.test(lines[i])) {
      const match = lines[i].match(
        /(?:packed\s*by|packer|imported\s*by|importer)\s*[:.\-]?\s*(.*)/i
      );

      if (match?.[1]) {
        packerImporter = removeTrailingGarbage(match[1]);
      }

      if (!packerImporter && lines[i + 1]) {
        packerImporter = removeTrailingGarbage(lines[i + 1]);
      }

      break;
    }
  }

  // Month / year
  const monthYear = findFirst(normalized, [
    /(?:manufactured\s*on|manufacturing\s*date|mfg\.?\s*(?:date|on)?|mfd\.?\s*(?:date|on)?|packed\s*on|packing\s*date|pkd\.?\s*(?:date|on)?)\s*[:.\-]?\s*((?:0?[1-9]|1[0-2])[\/\-](?:20)?\d{2})/i,
    /(?:manufactured\s*on|mfg\.?|mfd\.?|packed\s*on|pkd\.?)[^\n]{0,20}((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s,\/\-]+20\d{2})/i,
  ]);

  // Consumer care
  let consumerCare = "";

  const contactStart = lines.findIndex((line) =>
    /consumer\s*(?:complaint|care|feedback)|customer\s*care|contact\s*(?:customer|us)|complaint|feedback/i.test(
      line
    )
  );

  if (contactStart >= 0) {
    const context = lines
      .slice(contactStart, Math.min(lines.length, contactStart + 4))
      .join(" ");

    const emails =
      context.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g) || [];

    const numberCandidates =
      context.match(/(?:\+91[\s-]?)?[6-9][\d\s-]{8,14}\d/g) || [];

    let phone = "";

    for (const candidate of numberCandidates) {
      const checked = validIndianPhone(candidate);
      if (checked) {
        phone = checked;
        break;
      }
    }

    const email = emails[0] || "";

    if (phone && email) {
      consumerCare = `Tel: ${phone} / Email: ${email}`;
    } else if (phone) {
      consumerCare = `Tel: ${phone}`;
    } else if (email) {
      consumerCare = `Email: ${email}`;
    }
  }

  // If the contact section was badly segmented by OCR,
  // search the complete text, but never use UID/barcode values.
  if (!consumerCare) {
    const email =
      normalized.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || "";

    const candidates =
      normalized.match(/(?:\+91[\s-]?)?[6-9][\d\s-]{8,14}\d/g) || [];

    let phone = "";

    for (const candidate of candidates) {
      const nearbyIndex = normalized.indexOf(candidate);
      const nearby = normalized.slice(
        Math.max(0, nearbyIndex - 30),
        nearbyIndex + candidate.length + 30
      );

      if (/UID|barcode/i.test(nearby)) continue;

      const checked = validIndianPhone(candidate);

      if (checked) {
        phone = checked;
        break;
      }
    }

    if (phone && email) {
      consumerCare = `Tel: ${phone} / Email: ${email}`;
    } else if (phone) {
      consumerCare = `Tel: ${phone}`;
    } else if (email) {
      consumerCare = `Email: ${email}`;
    }
  }

  // Country of origin:
  // only record it when the label explicitly states it.
  const countryOfOrigin = findFirst(normalized, [
    /country\s*of\s*origin\s*[:.\-]?\s*([A-Za-z][A-Za-z ]{1,30})/i,
    /(?:made\s*in|product\s*of)\s*[:.\-]?\s*([A-Za-z][A-Za-z ]{1,30})/i,
  ]);

  // Other declarations
  const otherParts: string[] = [];

  let genericName = findFirst(normalized, [
    /generic\s*name\s*[:.\-]?\s*([^\n]{2,60})/i,
  ]);

  // Stop generic-name extraction before another known declaration.
  genericName = genericName
    .split(
      /\s+(?=net\s*(?:qty|quantity)|article\s*(?:no|number)|batch\s*(?:no|number)|m\.?r\.?p\.?|manufactured\s*by)/i
    )[0]
    .trim();

  let article = findFirst(normalized, [
    /article\s*(?:no\.?|number)?\s*[:.\-]?\s*([^\n]{2,50})/i,
  ]);

  article = article
    .split(
      /\s+(?=colour|color|m\.?r\.?p\.?|batch|generic\s*name|net\s*(?:qty|quantity))/i
    )[0]
    .trim();

  let batch = findFirst(normalized, [
    /batch\s*(?:no\.?|number)?\s*[:.\-]?\s*([^\n]{2,50})/i,
  ]);

  batch = batch
    .split(
      /\s+(?=generic\s*name|net\s*(?:qty|quantity)|manufactured|m\.?r\.?p\.?)/i
    )[0]
    .trim();

  if (genericName) {
    otherParts.push(`Generic Name: ${genericName}`);
  }

  if (article) {
    otherParts.push(`Article No.: ${article}`);
  }

  if (batch) {
    otherParts.push(`Batch No.: ${batch}`);
  }

  const other = otherParts.join(" | ");

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
