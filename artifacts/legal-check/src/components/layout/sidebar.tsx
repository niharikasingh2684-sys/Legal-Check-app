import React from 'react';
import { Link, useLocation } from 'wouter';
import { Shield, Home, Camera, FileText, CheckCircle, AlertTriangle, History, Menu, FileCheck, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';

export function Sidebar() {
  const [location] = useLocation();
  const { currentInspection } = useStore();
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/scan', label: 'Scan Package', icon: Camera },
    { href: '/history', label: 'Inspection History', icon: History },
  ];

  const currentNav = currentInspection ? [
    { href: '/extraction', label: 'Extracted Data', icon: FileText },
    { href: '/results', label: 'Compliance Check', icon: CheckCircle },
    { href: '/violations', label: 'Violations', icon: AlertTriangle },
    { href: '/report', label: 'Final Report', icon: FileCheck },
  ] : [];

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-[100dvh] flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-lg">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-white">Legal Check</h1>
          <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/70 font-semibold">Inspector Tool</p>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-8">
        <div>
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-2">Main Menu</p>
          <nav className="space-y-1">
            {navItems.map(item => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80'}`} data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                  <item.icon className={`w-4 h-4 ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {currentInspection && (
          <div>
            <div className="flex items-center justify-between px-2 mb-4">
              <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Current Inspection</p>
            </div>
            <nav className="space-y-1 relative before:absolute before:inset-y-2 before:left-[21px] before:w-[1px] before:bg-sidebar-border">
              {currentNav.map((item, idx) => {
                const active = location === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium relative ${active ? 'text-white' : 'hover:text-white text-sidebar-foreground/70'}`} data-testid={`nav-current-${item.label.toLowerCase().replace(' ', '-')}`}>
                    <div className={`w-3 h-3 rounded-full border-[3px] border-sidebar z-10 ${active ? 'bg-sidebar-primary' : 'bg-sidebar-border'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center font-bold text-xs text-sidebar-primary">
            IN
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Inspector Name</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Region: MH-01</p>
          </div>
        </div>
      </div>
    </div>
  );
}
