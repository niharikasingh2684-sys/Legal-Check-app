import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useStore, ExtractedData } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, AlertCircle, Edit2 } from 'lucide-react';

const FIELD_LABELS: Record<keyof ExtractedData, string> = {
  mrp: 'Maximum Retail Price (MRP)',
  netQuantity: 'Net Quantity',
  manufacturer: 'Manufacturer Details',
  packerImporter: 'Packer / Importer',
  monthYear: 'Month & Year of Manufacture/Pack',
  consumerCare: 'Consumer Care Details',
  countryOfOrigin: 'Country of Origin',
  other: 'Other Notable Declarations'
};

export default function ExtractionPage() {
  const [, setLocation] = useLocation();
  const { currentInspection, updateExtraction, runComplianceCheck } = useStore();

  useEffect(() => {
    if (!currentInspection) {
      setLocation('/');
    }
  }, [currentInspection, setLocation]);

  if (!currentInspection) return null;

  const handleNext = () => {
    runComplianceCheck();
    setLocation('/results');
  };

  const handleChange = (key: keyof ExtractedData, value: string) => {
    updateExtraction({
      ...currentInspection.extractedData,
      [key]: value
    });
  };

  const isDemo = currentInspection.productName.includes('Saffola');

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-300 pb-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Scan</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Extract</span>
            <ArrowRight className="w-3 h-3" />
            <span>Check</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Extracted Declarations</h1>
          <p className="text-muted-foreground mt-1">Review and correct the OCR text before running compliance rules.</p>
        </div>
        <Button onClick={handleNext} size="lg" className="gap-2" data-testid="btn-run-check">
          Run Compliance Check <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          {Object.entries(currentInspection.extractedData).map(([k, v]) => {
            const key = k as keyof ExtractedData;
            const isEmpty = !v || v.trim() === '';
            const isAmbiguous = isDemo && key === 'monthYear';
            const isMissing = isDemo && key === 'countryOfOrigin';

            return (
              <Card key={key} className={`border ${isAmbiguous || isMissing ? 'border-amber-500/50 shadow-sm shadow-amber-500/10' : 'border-border'}`}>
                <CardContent className="p-4 pt-4 flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                        {FIELD_LABELS[key]}
                        {isAmbiguous && <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Review OCR</span>}
                        {isMissing && <span className="text-xs font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Not Detected</span>}
                      </Label>
                    </div>
                    <div className="relative">
                      <Input 
                        id={key}
                        value={v} 
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={`pr-10 bg-background ${isEmpty ? 'border-dashed' : ''} ${isAmbiguous ? 'border-amber-300 focus-visible:ring-amber-500' : ''}`}
                        placeholder={isEmpty ? 'Enter missing value manually...' : ''}
                        data-testid={`input-${key}`}
                      />
                      <Edit2 className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none opacity-50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card className="bg-sidebar text-sidebar-foreground border-sidebar-border shadow-lg sticky top-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sidebar-primary" />
                Image Context
              </h3>
              <div className="aspect-[3/4] bg-sidebar-accent rounded-md border border-sidebar-border overflow-hidden flex items-center justify-center mb-4">
                {currentInspection.imageUrl ? (
                  <img
                    src={currentInspection.imageUrl}
                    alt="Uploaded packaged-product label"
                    className="h-full w-full object-contain"
                    data-testid="img-uploaded-label"
                  />
                ) : isDemo ? (
                  <div className="text-center p-4">
                    <p className="text-xs text-sidebar-foreground/60 mb-2">Simulated Crop:</p>
                    <div className="bg-white text-black p-4 text-left font-serif text-sm leading-tight border-2 border-amber-500 rounded relative">
                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-1 font-sans font-bold">FOCUS</div>
                      <p className="opacity-50">Batch No: L049</p>
                      <p className="font-bold underline decoration-red-500 decoration-wavy">Packed: 10/23</p>
                      <p className="opacity-50 mt-2">MRP ₹ 195.00</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-sidebar-foreground/50">No image available</p>
                )}
              </div>
              <div className="text-sm space-y-3">
                <p className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-sidebar-primary shrink-0 mt-0.5" />
                  <span className="text-sidebar-foreground/80">Check the OCR accuracy against the original image. Editable fields allow you to correct mistakes before evaluation.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
