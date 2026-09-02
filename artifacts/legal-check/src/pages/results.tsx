import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useStore, ExtractedData, FieldResult } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, ArrowRightCircle } from 'lucide-react';

const FIELD_LABELS: Record<keyof ExtractedData, string> = {
  mrp: 'Maximum Retail Price (MRP)',
  netQuantity: 'Net Quantity',
  manufacturer: 'Manufacturer Details',
  packerImporter: 'Packer / Importer',
  monthYear: 'Month & Year of Mfd/Pack',
  consumerCare: 'Consumer Care Details',
  countryOfOrigin: 'Country of Origin',
  other: 'Other Declarations'
};

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const { currentInspection } = useStore();

  useEffect(() => {
    if (!currentInspection || currentInspection.status === 'draft') {
      setLocation('/');
    }
  }, [currentInspection, setLocation]);

  if (!currentInspection) return null;

  const { results, extractedData, violations } = currentInspection;

  const getResultIcon = (result: FieldResult) => {
    switch (result) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'fail': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'review': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  const getResultBadge = (result: FieldResult) => {
    switch (result) {
      case 'pass': return <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">Pass</Badge>;
      case 'fail': return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Fail</Badge>;
      case 'review': return <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">Needs Review</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const hasIssues = violations.length > 0 || Object.values(results).includes('review');

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-300 pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="text-muted-foreground/50">Scan</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-muted-foreground/50">Extract</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-foreground font-medium">Check</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Compliance Results</h1>
          <p className="text-muted-foreground mt-1">Rule-based evaluation of declared information.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/extraction">
            <Button variant="outline" data-testid="btn-back-edit">Back to Edit</Button>
          </Link>
          {hasIssues ? (
            <Link href="/violations">
              <Button className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="btn-view-violations">
                Review Issues <ArrowRightCircle className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/report">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="btn-finalize-pass">
                Finalize Compliant Report <CheckCircle2 className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_2fr_120px] gap-4 p-4 border-b border-border bg-muted/30 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <div>Requirement</div>
          <div>Declared Value</div>
          <div className="text-center">Status</div>
        </div>
        <div className="divide-y divide-border">
          {Object.entries(results).map(([k, result]) => {
            const key = k as keyof ExtractedData;
            const value = extractedData[key];
            const isIssue = result === 'fail' || result === 'review';
            
            return (
              <div key={key} className={`grid grid-cols-[1fr_2fr_120px] gap-4 p-4 items-center transition-colors ${isIssue ? 'bg-amber-50/30 dark:bg-amber-950/10' : 'hover:bg-muted/30'}`}>
                <div className="font-medium text-foreground flex items-start gap-2">
                  <div className="mt-0.5">{getResultIcon(result)}</div>
                  {FIELD_LABELS[key]}
                </div>
                <div className={`text-sm ${!value ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                  {value || (key === 'countryOfOrigin' ? 'Not applicable / Domestic product' : '(Not declared)')}
                </div>
                <div className="text-center">
                  {getResultBadge(result)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {hasIssues && (
        <div className="mt-8 bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-xl dark:bg-amber-950/20 dark:text-amber-200 dark:border-amber-900/50 flex gap-4 items-start shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Attention Required</h3>
            <p className="text-sm opacity-90 mb-4 max-w-3xl">The rule engine flagged potential violations or ambiguous declarations that require your professional judgment. Please review the specific rules and evidence.</p>
            <Link href="/violations">
              <Button variant="secondary" className="bg-amber-600 hover:bg-amber-700 text-white border-transparent">
                Proceed to Violations Detail
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
