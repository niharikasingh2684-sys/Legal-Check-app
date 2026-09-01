import React, { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, ScanLine, Loader2, Sparkles } from 'lucide-react';

export default function ScanPage() {
  const [, setLocation] = useLocation();
  const { startNewInspection, loadDemoInspection } = useStore();
  const [state, setState] = useState<'idle' | 'scanning' | 'processing'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDemo = () => {
    setState('scanning');
    setTimeout(() => {
      setState('processing');
      setTimeout(() => {
        loadDemoInspection();
        setLocation('/extraction');
      }, 1500);
    }, 1200);
  };

  const handleRealUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setState('scanning');
    setTimeout(() => {
      setState('processing');
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = () => {
          startNewInspection(typeof reader.result === 'string' ? reader.result : undefined);
          setLocation('/extraction');
        };
        reader.readAsDataURL(file);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Scan Package Label</h1>
        <p className="text-muted-foreground mt-2">Upload or capture high-resolution images of the package declarations.</p>
      </div>

      <Card className="flex-1 border-dashed border-2 border-muted-foreground/20 bg-muted/10 relative overflow-hidden flex flex-col items-center justify-center p-12">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/webp"
          capture="environment"
          className="sr-only"
          onChange={handleFileSelected}
          data-testid="input-package-image"
        />
        {state === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm border border-border text-primary">
              <Camera className="w-10 h-10" />
            </div>
            
            <div>
              <h3 className="text-xl font-medium">Capture or Upload</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Ensure all mandatory declarations (MRP, Net Qty, Mfg Date, Address) are clearly visible and well-lit.
              </p>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <Button size="lg" onClick={handleRealUpload} data-testid="btn-upload-real" className="gap-2">
                <Upload className="w-4 h-4" /> Upload Image
              </Button>
              <Button size="lg" variant="secondary" onClick={handleDemo} data-testid="btn-use-demo" className="gap-2 bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground border border-secondary/20 shadow-none">
                <Sparkles className="w-4 h-4 text-secondary" /> Use Demo Sample
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-8 bg-background inline-block px-3 py-1 rounded-full border border-border">
              Supported formats: JPEG, PNG, HEIC
            </p>
          </div>
        )}

        {state === 'scanning' && (
          <div className="text-center space-y-6 animate-pulse">
            <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-primary relative">
              <ScanLine className="w-12 h-12" />
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full border-t-primary animate-spin" />
            </div>
            <h3 className="text-xl font-medium">Reading Document...</h3>
            <p className="text-sm text-muted-foreground">Isolating label regions</p>
          </div>
        )}

        {state === 'processing' && (
          <div className="text-center space-y-6">
            <div className="bg-primary w-24 h-24 rounded-full flex items-center justify-center mx-auto text-primary-foreground shadow-lg shadow-primary/20">
              <Loader2 className="w-12 h-12 animate-spin" />
            </div>
            <h3 className="text-xl font-medium">Extracting Declarations...</h3>
            <p className="text-sm text-muted-foreground">Running OCR and identifying fields</p>
          </div>
        )}
      </Card>
      
      <div className="mt-6 flex items-start gap-3 bg-blue-50 text-blue-900 p-4 rounded-lg border border-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50">
        <ScanLine className="w-5 h-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm">
          <strong>Tip for best results:</strong> Lay the package flat and avoid glare over printed text. The system will automatically detect the bounding boxes of text regions.
        </div>
      </div>
    </div>
  );
}
