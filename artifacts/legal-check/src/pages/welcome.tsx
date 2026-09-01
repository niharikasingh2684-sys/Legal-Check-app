import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, CheckCircle2, FileSearch, ScanLine, ShieldCheck } from 'lucide-react';

function LogoMark() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#d9b33f] text-[#101b35] shadow-[0_8px_20px_rgba(217,179,63,0.2)]">
      <div className="absolute inset-[8px] rounded-[7px] border-[1.5px] border-[#101b35]" />
      <div className="absolute left-[5px] top-[5px] h-2 w-2 border-l-2 border-t-2 border-[#101b35]" />
      <div className="absolute bottom-[5px] right-[5px] h-2 w-2 border-b-2 border-r-2 border-[#101b35]" />
      <ShieldCheck className="relative h-5 w-5" strokeWidth={1.8} />
    </div>
  );
}

const workflow = [
  { label: 'Scan', detail: 'Capture label', icon: ScanLine },
  { label: 'Extract', detail: 'Read declarations', icon: FileSearch },
  { label: 'Validate', detail: 'Apply rules', icon: ShieldCheck },
  { label: 'Result', detail: 'Review evidence', icon: CheckCircle2 },
];

export default function Welcome() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-[100dvh] bg-[#f7f8fa] text-[#101b35]" data-testid="page-welcome">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1500px] flex-col px-6 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between" data-testid="header-welcome">
          <Link href="/" className="flex items-center gap-3" data-testid="link-welcome-brand">
            <LogoMark />
            <div>
              <div className="text-[17px] font-bold tracking-[-0.02em]">Legal Check</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697184]">Smart compliance</div>
            </div>
          </Link>
          <div className="hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#697184] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d9b33f]" />
            SIH 2026 MVP
          </div>
        </header>

        <main className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-20 lg:py-20">
          <section className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d8dde6] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.17em] text-[#576176] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d9b33f]" />
              Inspector workspace
            </div>
            <h1 className="max-w-xl text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[#101b35] sm:text-7xl">
              Compliance you can see, explain, and act on.
            </h1>
            <p className="mt-7 text-xl font-medium tracking-[-0.02em] text-[#b28a24] sm:text-2xl" data-testid="text-welcome-tagline">
              Scan <span className="mx-2 text-[#c8cdd6]">•</span> Check <span className="mx-2 text-[#c8cdd6]">•</span> Comply
            </p>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#697184] sm:text-lg">
              Legal Check assists Legal Metrology inspectors in verifying packaged-commodity declarations with structured extraction, explainable rules, and evidence ready for review.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-[#101b35] px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,27,53,0.16)] transition-transform hover:-translate-y-0.5"
                data-testid="link-enter-dashboard"
              >
                Enter Dashboard <ArrowRight className="h-4 w-4 text-[#e3c45d]" />
              </Link>
              <Link
                href="/scan"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#cfd5df] bg-white px-6 text-sm font-bold text-[#101b35] transition-colors hover:border-[#b28a24] hover:bg-[#fffdf5]"
                data-testid="link-get-started"
              >
                Get Started
              </Link>
            </div>
            <p className="mt-8 max-w-md text-xs leading-5 text-[#8b93a2]" data-testid="text-welcome-disclaimer">
              Legal Check assists inspectors. Final legal judgment remains with the inspector.
            </p>
          </section>

          <section className="relative lg:pl-8">
            <div className="absolute -left-1 top-12 hidden h-48 w-px bg-[#d9b33f] lg:block" />
            <div className="rounded-2xl border border-[#d6dce5] bg-[#101b35] p-6 text-white shadow-[0_24px_60px_rgba(16,27,53,0.15)] sm:p-8" data-testid="card-welcome-workflow">
              <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e3c45d]">
                    <span className="gold-pulse h-1.5 w-1.5 rounded-full bg-[#e3c45d]" />
                    Smart compliance
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">From package image to defensible result.</h2>
                </div>
                <div className="soft-float relative hidden h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] sm:flex">
                  <div className="absolute inset-3 border border-[#e3c45d]/40" />
                  <div className="absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-[#e3c45d]" />
                  <div className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[#e3c45d]" />
                  <ShieldCheck className="h-7 w-7 text-[#e3c45d]" strokeWidth={1.4} />
                </div>
              </div>
              <div className="scan-grid relative mt-7 grid grid-cols-2 gap-3 rounded-xl border border-white/10 p-2 sm:grid-cols-4">
                <div className="scan-sweep pointer-events-none absolute left-3 right-3 top-3 h-px bg-gradient-to-r from-transparent via-[#e3c45d] to-transparent" />
                {workflow.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      aria-pressed={activeStep === index}
                      className={`pressable relative rounded-xl border p-3 text-left ${activeStep === index ? 'border-[#e3c45d]/70 bg-[#e3c45d]/10 shadow-[0_0_0_1px_rgba(227,196,93,0.08)]' : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]'}`}
                      data-testid={`button-welcome-step-${step.label.toLowerCase()}`}
                    >
                      {index < workflow.length - 1 && <span className="absolute -right-2 top-7 z-10 hidden h-px w-3 bg-[#d9b33f]/70 sm:block" />}
                      <Icon className={`h-5 w-5 ${activeStep === index ? 'text-[#fff1a9]' : 'text-[#e3c45d]'}`} strokeWidth={1.6} />
                      <div className="mt-5 text-sm font-bold">{step.label}</div>
                      <div className="mt-1 text-[11px] leading-4 text-[#aab3c4]">{step.detail}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs">
                <span className="text-[#aab3c4]">
                  Now viewing <strong className="text-white">{workflow[activeStep].label}</strong>
                </span>
                <span className="font-semibold text-[#e3c45d]">{workflow[activeStep].detail}</span>
              </div>
              <div className="mt-7 flex items-center justify-between rounded-xl border border-[#e3c45d]/25 bg-[#e3c45d]/10 px-4 py-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#e3c45d]">Built for review</div>
                  <div className="mt-1 text-sm text-[#d5dbe5]">Every finding includes its rule and evidence.</div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#e3c45d]" />
              </div>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-3 border-t border-[#dfe3e9] pt-5 text-xs text-[#8b93a2] sm:flex-row sm:items-center sm:justify-between">
          <span>Legal Check · Smart Compliance for Packaged Products</span>
          <span>Designed for inspectors, grounded in explainable rules.</span>
        </footer>
      </div>
    </div>
  );
}