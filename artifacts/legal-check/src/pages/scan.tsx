import React, { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { runPackageOcr } from "@/lib/ocr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  ScanLine,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function ScanPage() {
  const [, setLocation] = useLocation();

  const {
    startNewInspection,
    loadDemoInspection,
    updateExtraction,
  } = useStore();

  const [state, setState] =
    useState<"idle" | "scanning" | "processing">("idle");

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDemo = () => {
    setError("");
    setState("scanning");

    setTimeout(() => {
      setState("processing");

      setTimeout(() => {
        loadDemoInspection();
        setLocation("/extraction");
      }, 800);
    }, 700);
  };

  const handleRealUpload = () => {
    setError("");
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setProgress(0);
    setState("scanning");

    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Could not read image."));
          }
        };

        reader.onerror = () => reject(new Error("Could not read image."));
        reader.readAsDataURL(file);
      });

      /*
       * Create the inspection BEFORE OCR.
       * This stores the actual package image in the inspection.
       */
      startNewInspection(imageDataUrl);

      setState("processing");

      /*
       * Real OCR happens here.
       * Tesseract reads the uploaded package label.
       */
      const ocrResult = await runPackageOcr(
        imageDataUrl,
        (ocrProgress) => {
          setProgress(ocrProgress);
        }
      );

      /*
       * Automatically populate:
       * MRP
       * Net Quantity
       * Manufacturer
       * Packer / Importer
       * Manufacturing Date
       * Consumer Care
       * Country of Origin
       * Other declarations
       */
      updateExtraction(ocrResult.extractedData);

      setLocation("/extraction");
    } catch (err) {
      console.error("OCR failed:", err);

      setError(
        "We could not automatically read this label. Try a clearer, well-lit image."
      );

      setState("idle");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Scan Package Label
        </h1>

        <p className="text-muted-foreground mt-2">
          Upload or capture a clear image of the package declarations.
        </p>
      </div>

      <Card className="flex-1 border-dashed border-2 border-muted-foreground/20 bg-muted/10 relative overflow-hidden flex flex-col items-center justify-center p-12">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={handleFileSelected}
          data-testid="input-package-image"
        />

        {state === "idle" && (
          <div className="text-center space-y-6">
            <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm border border-border text-primary">
              <Camera className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-medium">
                Capture or Upload
              </h3>

              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Make sure declarations such as MRP, net quantity,
                manufacturer details and manufacturing date are clearly
                visible.
              </p>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <Button
                size="lg"
                onClick={handleRealUpload}
                data-testid="btn-upload-real"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </Button>

              <Button
                size="lg"
                variant="secondary"
                onClick={handleDemo}
                data-testid="btn-use-demo"
                className="gap-2 bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground border border-secondary/20 shadow-none"
              >
                <Sparkles className="w-4 h-4 text-secondary" />
                Use Demo Sample
              </Button>
            </div>

            {error && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-8 bg-background inline-block px-3 py-1 rounded-full border border-border">
              Supported formats: JPEG, PNG, WEBP
            </p>
          </div>
        )}

        {state === "scanning" && (
          <div className="text-center space-y-6">
            <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-primary relative">
              <ScanLine className="w-12 h-12" />

              <div className="absolute inset-0 border-4 border-primary/20 rounded-full border-t-primary animate-spin" />
            </div>

            <h3 className="text-xl font-medium">
              Preparing Image...
            </h3>

            <p className="text-sm text-muted-foreground">
              Preparing the package label for OCR
            </p>
          </div>
        )}

        {state === "processing" && (
          <div className="text-center space-y-6">
            <div className="bg-primary w-24 h-24 rounded-full flex items-center justify-center mx-auto text-primary-foreground shadow-lg shadow-primary/20">
              <Loader2 className="w-12 h-12 animate-spin" />
            </div>

            <h3 className="text-xl font-medium">
              Reading Package Label...
            </h3>

            <p className="text-sm text-muted-foreground">
              OCR is detecting and extracting declarations
            </p>

            <div className="w-64 mx-auto">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${Math.max(progress, 5)}%`,
                  }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                {progress > 0
                  ? `${progress}% complete`
                  : "Starting OCR..."}
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-6 flex items-start gap-3 bg-blue-50 text-blue-900 p-4 rounded-lg border border-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50">
        <ScanLine className="w-5 h-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />

        <div className="text-sm">
          <strong>Tip for best results:</strong> Keep the label flat,
          well-lit and in focus. Avoid glare over printed declarations.
        </div>
      </div>
    </div>
  );
}
