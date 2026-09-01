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
    const existing = document.querySelector(
      `script[src="${TESSERACT_URL}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("OCR engine could not be loaded.")),
        { once: true }
      );
      return;
    }

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
    .replace(/[|]/g, "I")
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.=-]+/, "")
    .replace(/[\s:;,.=-]+$/, "")
    .trim();
}

function cleanLine(value = "") {
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

function getLines(text: string) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);
}

function findLabelLine(
  lines: string[],
  labels: RegExp[],
  maxFollowingLines = 1
) {
  for (let i = 0; i < lines.length; i++) {
    if (!labels.some((label) => label.test(lines[i]))) continue;

    const current = lines[i];

    const afterColon = current.match(/[:.-]\s*(.+)$/);

    if (afterColon?.[1] && clean(afterColon[1]).length >= 2) {
      return clean(afterColon[1]);
    }

    for (
      let offset = 1;
      offset <= maxFollowingLines && i + offset < lines.length;
      offset++
    ) {
      const candidate = clean(lines[i + offset]);

      if (candidate.length >= 2) return candidate;
    }
  }

  return "";
}

function extractMrp(text: string, lines: string[]) {
  const labelled = findFirst(text, [
    /(?:M\.?\s*R\.?\s*P\.?|MRP|maximum\s+retail\s+price)\s*(?:₹|Rs\.?|INR)?\s*[:=.-]?\s*((?:₹|Rs\.?|INR)?\s*\d[\d,\s]*(?:\.\d{1,2})?)/i,

    /(?:M\.?\s*R\.?\s*P\.?|MRP|maximum\s+retail\s+price)[^\n]{0,25}?((?:₹|Rs\.?|INR)\s*\d[\d,]*(?:\.\d{1,2})?)/i,
  ]);

  if (labelled) {
    return labelled.startsWith("₹") ||
      /^Rs/i.test(labelled) ||
      /^INR/i.test(labelled)
      ? labelled
      : `₹ ${labelled}`;
  }

  for (const line of lines) {
    if (!/(?:MRP|M\.?\s*R\.?\s*P\.?|maximum retail price)/i.test(line)) {
      continue;
    }

    const amount = line.match(
      /(?:₹|Rs\.?|INR)\s*(\d[\d,]*(?:\.\d{1,2})?)/
    );

    if (amount?.[1]) return `₹ ${amount[1]}`;
  }

  return "";
}

function extractNetQuantity(text: string, lines: string[]) {
  const labelled = findFirst(text, [
    /(?:net\s*(?:qty|quantity|weight|wt|content|contents))\s*[:=.-]?\s*((?:\d+(?:[.,]\d+)?)\s*(?:kg|kgs|g|gm|gms|gram|grams|ml|l|litre|liter|litres|liters|pcs?|pieces?|pairs?|units?))/i,

    /(?:net\s*(?:qty|quantity))\s*[:=.-]?\s*((?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s*(?:pair|pairs|piece|pieces|pc|pcs|unit|units))/i,
  ]);

  if (labelled) return labelled;

  for (const line of lines) {
    if (!/net\s*(?:qty|quantity|weight|wt|content)/i.test(line)) {
      continue;
    }

    const value = line.match(
      /(?:net\s*(?:qty|quantity|weight|wt|content))\s*[:=.-]?\s*(.+)$/i
    );

    if (value?.[1]) {
      const cleaned = clean(value[1]);

      if (
        /\b(?:kg|kgs|g|gm|gms|gram|grams|ml|litre|liter|pair|pairs|piece|pieces|pc|pcs|unit|units)\b/i.test(
          cleaned
        )
      ) {
        return cleaned;
      }
    }
  }

  return "";
}

function extractManufacturer(text: string, lines: string[]) {
  const direct = findFirst(text, [
    /(?:manufactured\s+by|manufacturer|mfd\.?\s*by)\s*[:=.-]?\s*([^\n]{3,140})/i,
  ]);

  if (direct) return direct;

  return findLabelLine(
    lines,
    [/manufactured\s+by/i, /\bmanufacturer\b/i, /mfd\.?\s*by/i],
    1
  );
}

function extractPackerImporter(text: string, lines: string[]) {
  const direct = findFirst(text, [
    /(?:packed\s+by|packer|imported\s+by|importer)\s*[:=.-]?\s*([^\n]{3,140})/i,
  ]);

  if (direct) return direct;

  return findLabelLine(
    lines,
    [/packed\s+by/i, /\bpacker\b/i, /imported\s+by/i, /\bimporter\b/i],
    1
  );
}

function extractMonthYear(text: string) {
  return findFirst(text, [
    /(?:manufactured\s+on|manufactured|mfg\.?|mfd\.?|packed\s+on|packed|pkd\.?|packing\s+date)\s*[:=.-]?\s*((?:0?[1-9]|1[0-2])[/-](?:20)?\d{2})/i,

    /(?:manufactured\s+on|manufactured|mfg\.?|mfd\.?|packed\s+on|packed|pkd\.?)\s*[:=.-]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[\s,/-]+20\d{2})/i,
  ]);
}

function extractConsumerCare(text: string, lines: string[]) {
  const emailMatch = text.match(
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/
  );

  const phoneMatches =
    text.match(
      /(?:\+91[-\s]?)?(?:[6-9]\d{9}|0\d{2,4}[-\s]?\d{6,8})/g
    ) || [];

  const careLines = lines.filter((line) =>
    /consumer|customer\s*care|complaint|feedback|helpline|contact\s*us/i.test(
      line
    )
  );

  const careText = careLines.join(" ");

  const carePhone =
    careText.match(
      /(?:\+91[-\s]?)?(?:[6-9]\d{9}|0\d{2,4}[-\s]?\d{6,8})/
    )?.[0] || "";

  const phone = carePhone || phoneMatches[0] || "";
  const email = emailMatch?.[0] || "";

  if (phone && email) return `${phone} / ${email}`;
  if (phone) return phone;
  if (email) return email;

  const labelled = findLabelLine(
    lines,
    [
      /consumer\s*(?:care|complaint)/i,
      /customer\s*care/i,
      /complaint/i,
      /feedback/i,
      /helpline/i,
    ],
    1
  );

  return labelled;
}

function extractCountryOfOrigin(text: string) {
  return findFirst(text, [
    /(?:country\s+of\s+origin)\s*[:=.-]?\s*([A-Za-z][A-Za-z ]{1,35})/i,
    /(?:made\s+in|product\s+of)\s*[:=.-]?\s*([A-Za-z][A-Za-z ]{1,35})/i,
  ]);
}

function extractOther(lines: string[]) {
  const genericName = lines.find((line) =>
    /generic\s+name/i.test(line)
  );

  if (genericName) {
    const match = genericName.match(
      /generic\s+name\s*[:=.-]?\s*(.+)$/i
    );

    if (match?.[1]) return clean(match[1]);
  }

  const article = lines.find((line) =>
    /\barticle\s*:/i.test(line)
  );

  if (article) return clean(article);

  return "";
}

export function extractDeclarations(text: string): ExtractedData {
  const normalized = text.replace(/\r/g, "");
  const lines = getLines(normalized);

  return {
    mrp: extractMrp(normalized, lines),

    netQuantity: extractNetQuantity(normalized, lines),

    manufacturer: extractManufacturer(normalized, lines),

    packerImporter: extractPackerImporter(normalized, lines),

    monthYear: extractMonthYear(normalized),

    consumerCare: extractConsumerCare(normalized, lines),

    countryOfOrigin: extractCountryOfOrigin(normalized),

    other: extractOther(lines),
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
