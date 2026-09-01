import { ArrowRight, CheckCircle2, ClipboardList, FileWarning, History, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const workflow = [
  { label: 'Scan', detail: 'Capture package label', icon: ClipboardList },
  { label: 'Extract', detail: 'Review declarations', icon: Sparkles },
  { label: 'Validate', detail: 'Apply legal rules', icon: ShieldAlert },
  { label: 'Result', detail: 'Record evidence', icon: CheckCircle2 },
];

export default function Dashboard() {
  const { history } = useStore();
  const total = history.length;
  const compliant = history.filter((item) => item.status === 'compliant').length;
  const violations = history.filter((item) => item.status === 'violations_flagged').length;
  const review = history.filter((item) => item.status === 'needs_review').length;

  return (
    <div className="space-y-8 pb-10" data-testid="page-dashboard">
      <header className="flex flex-col gap-6 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between" data-testid="header-dashboard">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9b33f]" />
            Inspector workspace
          </div>
          <h1 className="text-4xl font-bold tracking-[-0.045em] text-foreground">Dashboard</h1>
          <p className="mt-2 max-w-xl text-base leading-6 text-muted-foreground">
            Smart Compliance for Packaged Products
            <span className="mx-2 text-[#c6a131]">•</span>
            Scan <span className="mx-2 text-muted-foreground/40">•</span> Check <span className="mx-2 text-muted-foreground/40">•</span> Comply
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/history">
            <Button variant="outline" className="w-full gap-2 sm:w-auto" data-testid="btn-view-history">
              <History className="h-4 w-4" /> View History
            </Button>
          </Link>
          <Link href="/scan">
            <Button className="w-full gap-2 bg-[#101b35] text-white hover:bg-[#1c2a4b] sm:w-auto" data-testid="btn-new-compliance-scan">
              New Compliance Scan <ArrowRight className="h-4 w-4 text-[#e3c45d]" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="section-summary">
        <SummaryCard label="Total scans" value={total} detail="Saved inspections" icon={ClipboardList} tone="navy" testId="summary-total" />
        <SummaryCard label="Compliant" value={compliant} detail="Passed all checked rules" icon={CheckCircle2} tone="green" testId="summary-compliant" />
        <SummaryCard label="Violations flagged" value={violations} detail="Requires inspector action" icon={ShieldAlert} tone="red" testId="summary-violations" />
        <SummaryCard label="Needs review" value={review} detail="Ambiguous or incomplete" icon={FileWarning} tone="gold" testId="summary-review" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="overflow-hidden border-border shadow-sm" data-testid="card-recent-scans">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold tracking-[-0.02em] text-foreground">Recent scans</h2>
              <p className="mt-1 text-xs text-muted-foreground">Your latest saved inspection records</p>
            </div>
            <Link href="/history" className="text-xs font-bold text-[#9a7516] hover:text-[#73570c]" data-testid="link-all-history">
              View all
            </Link>
          </div>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2f4f7] text-[#101b35]">
                  <ClipboardList className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">No inspections yet</h3>
                <p className="mt-1 max-w-xs text-sm leading-5 text-muted-foreground">Start with a demo sample to see the full verification flow in action.</p>
                <Link href="/scan" className="mt-5">
                  <Button variant="secondary" className="gap-2 border border-[#e4cf80] bg-[#fffaf0] text-[#73570c] hover:bg-[#fff3ce]" data-testid="btn-start-first-scan">
                    Start first scan <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30 sm:px-6" data-testid={`row-recent-scan-${item.id}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.productName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(item.date).toLocaleString()} <span className="mx-1 text-muted-foreground/50">·</span> ID {item.id.toUpperCase()}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={item.status} />
                      <Link href={`/report?id=${item.id}`}>
                        <Button variant="ghost" size="sm" className="hidden gap-1 sm:flex" data-testid={`btn-view-recent-${item.id}`}>
                          Open <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-[#101b35] text-white shadow-sm" data-testid="card-how-it-works">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e3c45d]">The workflow</div>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">How Legal Check works</h2>
              </div>
              <Sparkles className="h-5 w-5 text-[#e3c45d]" strokeWidth={1.5} />
            </div>
            <div className="mt-7 space-y-3">
              {workflow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex items-center gap-3" data-testid={`workflow-step-${step.label.toLowerCase()}`}>
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                      <Icon className="h-4 w-4 text-[#e3c45d]" strokeWidth={1.7} />
                      {index < workflow.length - 1 && <span className="absolute -bottom-4 left-1/2 h-4 w-px bg-white/15" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{step.label}</div>
                      <div className="mt-0.5 text-xs text-[#abb4c5]">{step.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-7 border-t border-white/10 pt-4 text-xs leading-5 text-[#aab3c4]">
              Deterministic checks surface the rule and evidence. The inspector makes the final legal judgment.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-3 border-t border-border pt-6 text-xs leading-5 text-muted-foreground" data-testid="text-dashboard-disclaimer">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#b28a24]" />
        <p>Legal Check assists inspectors. Final legal judgment remains with the inspector. Dashboard counts reflect only saved inspections in this workspace; they are not government statistics.</p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  testId,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof ClipboardList;
  tone: 'navy' | 'green' | 'red' | 'gold';
  testId: string;
}) {
  const toneClasses = {
    navy: 'bg-[#eef1f6] text-[#101b35]',
    green: 'bg-[#eaf7f1] text-[#148255]',
    red: 'bg-[#fff0f0] text-[#c44e55]',
    gold: 'bg-[#fff8e7] text-[#a77b12]',
  };

  return (
    <Card className="border-border shadow-sm" data-testid={`card-${testId}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="text-sm font-semibold text-muted-foreground">{label}</span>
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-5 text-3xl font-bold tracking-[-0.04em] text-foreground" data-testid={`value-${testId}`}>{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'compliant') {
    return <span className="rounded-full bg-[#eaf7f1] px-2.5 py-1 text-[11px] font-bold text-[#148255]">Compliant</span>;
  }
  if (status === 'violations_flagged') {
    return <span className="rounded-full bg-[#fff0f0] px-2.5 py-1 text-[11px] font-bold text-[#c44e55]">Violations</span>;
  }
  if (status === 'needs_review') {
    return <span className="rounded-full bg-[#fff8e7] px-2.5 py-1 text-[11px] font-bold text-[#a77b12]">Needs review</span>;
  }
  return <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">Draft</span>;
}