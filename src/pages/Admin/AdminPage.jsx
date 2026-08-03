import React from 'react';
import { ShieldAlert, Users, Filter, CheckCircle2, XCircle, ArrowUpRight, BarChart3, AlertOctagon } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function AdminPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Municipal Administration Control Panel"
        description="Review incoming AI-analyzed reports, assign maintenance teams, and update resolution statuses."
        badge={<Badge variant="indigo">Admin Authority View</Badge>}
      />

      {/* Admin Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="bg-slate-900 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unassigned Reports</p>
              <h3 className="text-3xl font-bold mt-1 text-blue-400">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dispatched Field Crew</p>
              <h3 className="text-3xl font-bold mt-1 text-emerald-400">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Confidence Score Avg</p>
              <h3 className="text-3xl font-bold mt-1 text-amber-400">-- %</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Queue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle>Management Queue</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Filter by severity, category, or status</p>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter Queue
          </Button>
        </CardHeader>

        <CardContent className="py-12 text-center">
          <div className="max-w-xs mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Admin Queue Empty</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No pending reports require municipal action at this moment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
