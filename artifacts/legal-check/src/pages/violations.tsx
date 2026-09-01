import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useStore, Violation } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, CheckSquare, Square, Scale, FileSearch, ArrowRight } from 'lucide-react';

export default function ViolationsPage() {
  const [, setLocation] = useLocation();
  const { currentInspection, acknowledgeViolation } = useStore();

  useEffect(() => {
    if (!currentInspection) {
      setLocation('/');
    }
  }, [currentInspection, setLocation]);

  if (!currentInspection) return null;

  const { violations } = currentInspection;

  if (violations.length === 0) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold">No Violations Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">This package appears fully compliant.</p>
        <Link href="/report">
          <Button data-testid="btn-go-report">Go to Report</Button>
        </Link>
      </div>
    );
  }

  const allAcknowledged = violations.every(v => v.acknowledged);

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-300 pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            Violation Review
          </h1>
          <p className="text-muted-foreground mt-1">Review system-flagged issues against legal metrology rules.</p>
        </div>
        <Link href="/report">
          <Button 
            disabled={!allAcknowledged} 
            className="gap-2"
            data-testid="btn-generate-report"
          >
            Generate Final Report <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {violations.map((violation, idx) => (
          <Card key={idx} className={`border-2 transition-colors duration-300 ${violation.acknowledged ? 'border-muted bg-muted/20' : 'border-destructive/30 shadow-md shadow-destructive/5'}`}>
            <CardHeader className={`pb-3 flex flex-row items-start justify-between space-y-0 ${violation.acknowledged ? 'opacity-70' : ''}`}>
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant={violation.acknowledged ? "secondary" : "destructive"}>
                    {violation.field}
                  </Badge>
                  <span className="font-semibold text-foreground">Rule Deviation Detected</span>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded inline-flex">
                  <Scale className="w-3 h-3" />
                  {violation.applicableRule}
                </div>
              </div>
              <Button 
                variant={violation.acknowledged ? "secondary" : "default"}
                size="sm"
                onClick={() => acknowledgeViolation(idx)}
                className={violation.acknowledged ? "" : "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"}
                data-testid={`btn-ack-${idx}`}
              >
                {violation.acknowledged ? (
                  <><CheckSquare className="w-4 h-4 mr-2" /> Acknowledged</>
                ) : (
                  <><Square className="w-4 h-4 mr-2" /> Mark Reviewed</>
                )}
              </Button>
            </CardHeader>
            <CardContent className={`space-y-4 ${violation.acknowledged ? 'opacity-70' : ''}`}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-50/50 dark:bg-red-950/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-400 uppercase tracking-wider mb-2">Detected / Declared</p>
                  <p className="text-sm font-medium text-foreground">{violation.detectedText}</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-2">Expected Requirement</p>
                  <p className="text-sm font-medium text-foreground">{violation.expectedRequirement}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex items-start gap-3 text-sm text-muted-foreground">
                <FileSearch className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground/80">System Evidence: </span>
                  {violation.evidence}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!allAcknowledged && (
        <div className="mt-8 p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground animate-pulse">
          Please review and acknowledge all flagged items to proceed to the final report.
        </div>
      )}
    </div>
  );
}
