import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type InspectionStatus = 'compliant' | 'violations_flagged' | 'needs_review' | 'in_progress' | 'draft';
export type FieldResult = 'pass' | 'fail' | 'review' | 'pending';

export interface ExtractedData {
  mrp: string;
  netQuantity: string;
  manufacturer: string;
  packerImporter: string;
  monthYear: string;
  consumerCare: string;
  countryOfOrigin: string;
  other: string;
}

export interface Violation {
  field: keyof ExtractedData;
  detectedText: string;
  expectedRequirement: string;
  applicableRule: string;
  evidence: string;
  acknowledged: boolean;
}

export interface Inspection {
  id: string;
  date: string;
  productName: string;
  imageUrl?: string;
  source?: 'demo' | 'upload';
  status: InspectionStatus;
  extractedData: ExtractedData;
  results: Record<keyof ExtractedData, FieldResult>;
  violations: Violation[];
  reviewNotes?: string;
}

export const DEMO_EXTRACTION: ExtractedData = {
  mrp: "₹ 195.00 (Incl. of all taxes)",
  netQuantity: "1 Litre at 30°C",
  manufacturer: "Marico Ltd, Mumbai",
  packerImporter: "Marico Ltd",
  monthYear: "10/23",
  consumerCare: "Call 1800-22-2248, csc@marico.com",
  countryOfOrigin: "",
  other: "Blended Edible Vegetable Oil",
};

export const DEMO_RESULTS: Record<keyof ExtractedData, FieldResult> = {
  mrp: "pass",
  netQuantity: "pass",
  manufacturer: "pass",
  packerImporter: "pass",
  monthYear: "review",
  consumerCare: "pass",
  countryOfOrigin: "fail",
  other: "pass"
};

export const DEMO_VIOLATIONS: Violation[] = [
  {
    field: "monthYear",
    detectedText: "10/23",
    expectedRequirement: "Must clearly state Month and Year of Manufacture/Pack in explicit format (e.g. Oct 2023 or 10/2023)",
    applicableRule: "Rule 6(1)(d)",
    evidence: "Crop from image showing 10/23",
    acknowledged: false
  },
  {
    field: "countryOfOrigin",
    detectedText: "(Not Found)",
    expectedRequirement: "Country of origin must be declared if imported, or implied otherwise. As blended oil often contains imported components, explicit origin is required.",
    applicableRule: "Rule 6(1)(ea)",
    evidence: "Full package scan missing 'Made in' declaration",
    acknowledged: false
  }
];

export const INITIAL_EXTRACTION: ExtractedData = {
  mrp: "", netQuantity: "", manufacturer: "", packerImporter: "",
  monthYear: "", consumerCare: "", countryOfOrigin: "", other: ""
};

interface StoreContextType {
  history: Inspection[];
  currentInspection: Inspection | null;
  startNewInspection: (imageUrl?: string) => void;
  loadDemoInspection: () => void;
  updateExtraction: (data: ExtractedData) => void;
  runComplianceCheck: () => void;
  acknowledgeViolation: (index: number) => void;
  saveCurrentInspection: () => void;
  openInspection: (id: string) => void;
  clearCurrent: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Inspection[]>(() => {
    try {
      const stored = localStorage.getItem('legal_check_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    localStorage.setItem('legal_check_history', JSON.stringify(history));
  }, [history]);

  const startNewInspection = (imageUrl?: string) => {
    setCurrentInspection({
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      productName: "Unknown Product",
      imageUrl,
      source: imageUrl ? 'upload' : undefined,
      status: 'draft',
      extractedData: INITIAL_EXTRACTION,
      results: Object.keys(INITIAL_EXTRACTION).reduce((acc, key) => ({ ...acc, [key]: 'pending' }), {} as Record<keyof ExtractedData, FieldResult>),
      violations: [],
    });
  };

  const loadDemoInspection = () => {
    setCurrentInspection({
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      productName: "Saffola Gold Blended Edible Vegetable Oil",
      source: 'demo',
      status: 'in_progress',
      extractedData: DEMO_EXTRACTION,
      results: Object.keys(INITIAL_EXTRACTION).reduce((acc, key) => ({ ...acc, [key]: 'pending' }), {} as Record<keyof ExtractedData, FieldResult>),
      violations: [],
    });
  };

const updateExtraction = (data: ExtractedData) => {
  setCurrentInspection((inspection) => {
    if (!inspection) return inspection;

    return {
      ...inspection,
      extractedData: data,
      status: "in_progress",
    };
  });
};

  const runComplianceCheck = () => {
    if (!currentInspection) return;

    const data = currentInspection.extractedData;
    const isDemo = currentInspection.source === 'demo' || currentInspection.productName.includes("Saffola");
    const results = {} as Record<keyof ExtractedData, FieldResult>;
    const violations: Violation[] = [];

    const addIssue = (
      field: keyof ExtractedData,
      result: 'fail' | 'review',
      expectedRequirement: string,
      applicableRule: string,
      evidence: string,
    ) => {
      results[field] = result;
      violations.push({
        field,
        detectedText: data[field] || '(Not detected)',
        expectedRequirement,
        applicableRule,
        evidence,
        acknowledged: false,
      });
    };

    if (data.mrp && /(₹|rs\.?|inr)/i.test(data.mrp) && /\d/.test(data.mrp)) {
      results.mrp = 'pass';
    } else if (!data.mrp) {
      addIssue('mrp', 'review', 'Maximum Retail Price must be declared inclusive of all applicable taxes.', 'Rule 6(1)(e)', 'No MRP value was captured by OCR; inspector confirmation is required.');
    } else {
      addIssue('mrp', 'fail', 'Maximum Retail Price must be declared with a currency marker and value.', 'Rule 6(1)(e)', 'Detected text does not contain a clear MRP currency/value pair.');
    }

    if (data.netQuantity && /\d/.test(data.netQuantity) && /(g|kg|ml|l|litre|liter)\b/i.test(data.netQuantity)) {
      results.netQuantity = 'pass';
    } else if (!data.netQuantity) {
      addIssue('netQuantity', 'review', 'Net quantity must be stated with a recognized unit of measurement.', 'Rule 6(1)(a)', 'No net quantity value was captured by OCR.');
    } else {
      addIssue('netQuantity', 'fail', 'Net quantity must be stated with a recognized unit of measurement.', 'Rule 6(1)(a)', 'Detected text has no recognized quantity unit.');
    }

    for (const field of ['manufacturer', 'packerImporter'] as const) {
      if (data[field] && data[field].trim().length >= 5) {
        results[field] = 'pass';
      } else {
        addIssue(field, 'review', 'The responsible manufacturer, packer, or importer name and address must be declared.', 'Rule 6(1)(a)', 'The declaration is missing or too short to verify against the label.');
      }
    }

    if (data.monthYear && /(?:0?[1-9]|1[0-2])\s*[\/-]\s*(?:20)?\d{2}\b|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d{2}/i.test(data.monthYear)) {
      const explicitYear = /\b20\d{2}\b/.test(data.monthYear) || /[a-z]/i.test(data.monthYear);
      if (explicitYear) {
        results.monthYear = 'pass';
      } else {
        addIssue('monthYear', 'review', 'Month and year of manufacture or packing should be explicit and legible.', 'Rule 6(1)(d)', 'OCR captured a short numeric date without a four-digit year.');
      }
    } else if (!data.monthYear) {
      addIssue('monthYear', 'review', 'Month and year of manufacture or packing should be explicit and legible.', 'Rule 6(1)(d)', 'No manufacture/pack date was captured by OCR.');
    } else {
      addIssue('monthYear', 'fail', 'Month and year of manufacture or packing should be explicit and legible.', 'Rule 6(1)(d)', 'Detected date is not in a recognizable month/year format.');
    }

    if (data.consumerCare && /\d{6,}/.test(data.consumerCare)) {
      results.consumerCare = 'pass';
    } else if (!data.consumerCare) {
      addIssue('consumerCare', 'review', 'Consumer care name, address, telephone number, or email must be available.', 'Rule 6(1)(f)', 'No consumer-care contact was captured by OCR.');
    } else {
      addIssue('consumerCare', 'review', 'Consumer care name, address, telephone number, or email must be available.', 'Rule 6(1)(f)', 'Contact text needs inspector confirmation.');
    }

    if (data.countryOfOrigin && data.countryOfOrigin.trim().length >= 2) {
      results.countryOfOrigin = 'pass';
    } else if (isDemo) {
      addIssue('countryOfOrigin', 'fail', 'Country of origin must be declared where applicable in a clear, visible form.', 'Rule 6(1)(ea)', 'Full package scan is missing a visible “Made in” or country-of-origin declaration.');
    } else {
      addIssue('countryOfOrigin', 'review', 'Country of origin must be declared where applicable in a clear, visible form.', 'Rule 6(1)(ea)', 'No country-of-origin text was captured; inspector confirmation is required.');
    }

    if (data.other && data.other.trim().length >= 3) {
      results.other = 'pass';
    } else {
      addIssue('other', 'review', 'Other mandatory declarations should be visible and legible on the package.', 'Rule 6', 'No additional declaration text was captured by OCR.');
    }

    const status: InspectionStatus = Object.values(results).includes('fail')
      ? 'violations_flagged'
      : Object.values(results).includes('review')
        ? 'needs_review'
        : 'compliant';

    setCurrentInspection({
      ...currentInspection,
      results,
      violations,
      status
    });
  };

  const acknowledgeViolation = (index: number) => {
    if (!currentInspection) return;
    const newViolations = [...currentInspection.violations];
    newViolations[index].acknowledged = true;
    
    setCurrentInspection({
      ...currentInspection,
      violations: newViolations
    });
  };

  const saveCurrentInspection = () => {
    if (!currentInspection) return;
    
    // Calculate final status
    let status = currentInspection.status;
    if (currentInspection.violations.length > 0) {
      const allAck = currentInspection.violations.every(v => v.acknowledged);
      status = allAck ? 'needs_review' : 'violations_flagged';
    } else if (Object.values(currentInspection.results).includes('review')) {
      status = 'needs_review';
    } else if (Object.values(currentInspection.results).includes('fail')) {
      status = 'violations_flagged';
    } else {
      status = 'compliant';
    }

    const inspectionToSave = { ...currentInspection, status };
    
    setHistory(prev => {
      const index = prev.findIndex(h => h.id === inspectionToSave.id);
      if (index >= 0) {
        const newHist = [...prev];
        newHist[index] = inspectionToSave;
        return newHist;
      }
      return [inspectionToSave, ...prev];
    });
    
    setCurrentInspection(inspectionToSave);
  };

  const openInspection = (id: string) => {
    const inspection = history.find(h => h.id === id);
    if (inspection) setCurrentInspection(inspection);
  };

  const clearCurrent = () => setCurrentInspection(null);

  return (
    <StoreContext.Provider value={{
      history,
      currentInspection,
      startNewInspection,
      loadDemoInspection,
      updateExtraction,
      runComplianceCheck,
      acknowledgeViolation,
      saveCurrentInspection,
      openInspection,
      clearCurrent
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
