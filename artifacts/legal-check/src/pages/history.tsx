import React from 'react';
import { Link } from 'wouter';
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, FileText, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function HistoryPage() {
  const { history } = useStore();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return <Badge variant="success">Compliant</Badge>;
      case 'violations_flagged': return <Badge variant="destructive">Violations</Badge>;
      case 'needs_review': return <Badge variant="warning">Needs Review</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inspection History</h1>
          <p className="text-muted-foreground mt-1">Past reports and audit trails.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input placeholder="Search by product name or ID..." className="pl-9 bg-background" />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-[100px_1fr_150px_150px_100px] gap-4 p-4 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div>ID</div>
          <div>Product Name</div>
          <div>Date</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-border overflow-y-auto flex-1">
          {history.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No past inspections found.</p>
            </div>
          ) : (
            history.map((record) => (
              <div key={record.id} className="grid grid-cols-[100px_1fr_150px_150px_100px] gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                <div className="font-mono text-sm text-muted-foreground">{record.id.toUpperCase()}</div>
                <div className="font-medium truncate pr-4">{record.productName}</div>
                <div className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString()}</div>
                <div>{getStatusBadge(record.status)}</div>
                <div className="text-right">
                  <Link href={`/report?id=${record.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 h-8 px-2" data-testid={`btn-open-${record.id}`}>
                      Open <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
