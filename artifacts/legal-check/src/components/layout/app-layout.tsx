import React from 'react';
import { Sidebar } from './sidebar';
import { useLocation } from 'wouter';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  if (location === '/') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground font-sans w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col h-[100dvh] overflow-y-auto w-full relative">
        <div className="max-w-6xl w-full mx-auto p-8 flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
