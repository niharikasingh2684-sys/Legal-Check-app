import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, Save, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ReportPage() {
  const [location, setLocation] = useLocation();
  const { currentInspection, saveCurrentInspection, openInspection, history, clearCurrent } = useStore();

  useEffect(() => {
    // Check if we arrived via history ID
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    if (id) {
      openInspection(id);
    } else if (!currentInspection) {
      setLocation('/');
    }
  }, [location]);

  if (!currentInspection) return null;

  const isSaved = history.some(h => h.id === currentInspection.id);

  const handleSave = () => {
    saveCurrentInspection();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFinish = () => {
    clearCurrent();
    setLocation('/');
  };

  const isPass = currentInspection.status === 'compliant';
  const isReview = currentInspection.status === 'needs_review';

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col pb-12 animate-in fade-in duration-500">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <div className="flex gap-2">
          {isSaved && (
            <Link href="/history">
              <Button variant="outline" size="sm" className="gap-1"><ArrowLeft className="w-4 h-4" /> History</Button>
            </Link>
          )}
        </div>
        <div className="flex gap-3">
          {!isSaved && (
            <Button onClick={handleSave} variant="secondary" className="gap-2" data-testid="btn-save-report">
              <Save className="w-4 h-4" /> Save Record
            </Button>
          )}
          <Button onClick={handlePrint} variant="outline" className="gap-2" data-testid="btn-print">
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
          {isSaved && (
            <Button onClick={handleFinish} className="gap-2" data-testid="btn-finish">
              Finish <CheckCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Printable Area */}
      <Card className="border border-border shadow-md bg-card print:border-none print:shadow-none">
        <div className="bg-sidebar text-sidebar-foreground p-8 rounded-t-xl print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-serif font-bold mb-1">Legal Metrology Inspection Report</h1>
              <p className="text-sidebar-foreground/70 print:text-gray-600 font-mono text-sm">ID: {currentInspection.id.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">{new Date(currentInspection.date).toLocaleDateString()}</p>
              <p className="text-sidebar-foreground/70 print:text-gray-600 text-sm">{new Date(currentInspection.date).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 border-b pb-1">Product Details</h3>
              <p className="font-medium text-lg text-foreground">{currentInspection.productName}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 border-b pb-1">Overall Status</h3>
              <div className="flex items-center gap-2 mt-1">
                {isPass ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wide">Compliant</span>
                  </div>
                ) : isReview ? (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wide">Needs Review</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-3 py-1 rounded-md border border-destructive/20">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wide">Violations Found</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-1">Extracted Declarations</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {Object.entries(currentInspection.extractedData).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-muted-foreground mb-0.5">{k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <span className="font-medium text-foreground">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {currentInspection.violations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-4 border-b border-destructive/20 pb-1">Detailed Violations</h3>
              <div className="space-y-4">
                {currentInspection.violations.map((v, i) => (
                  <div key={i} className="bg-red-50/50 dark:bg-red-950/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-red-800 dark:text-red-400">Rule: {v.applicableRule}</span>
                      <span className={`text-xs px-2 py-0.5 rounded uppercase font-semibold ${v.acknowledged ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {v.acknowledged ? 'Acknowledged' : 'Pending review'}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <span className="block text-xs text-muted-foreground mb-1">Detected Issue</span>
                        <span className="font-medium">{v.detectedText}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground mb-1">Requirement</span>
                        <span className="font-medium">{v.expectedRequirement}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-border mt-12 text-sm text-muted-foreground text-center print:text-xs">
            <p className="font-semibold mb-1">Disclaimer of Decision</p>
            <p className="max-w-2xl mx-auto">This report is generated by Legal Check software as an assistive tool. The final legal interpretation and enforcement decision remains solely the responsibility of the designated Legal Metrology Officer.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
