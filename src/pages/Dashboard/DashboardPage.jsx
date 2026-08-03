import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, CheckCircle2, Clock, AlertTriangle, FileText, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Citizen Overview Dashboard"
        description="Monitor your submitted reports, municipal updates, and community activity."
        action={
          <Link to="/report">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </Link>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Reports</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Progress</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolved</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">0</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Submissions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <CardTitle>Recent Issue Reports</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Your most recent civic contributions</p>
          </div>
          <Link to="/track" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
            View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </CardHeader>

        <CardContent className="py-8 text-center">
          <div className="max-w-xs mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-gray-800">No Reports Submitted Yet</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              When you submit a civic issue report, it will appear here along with live status updates.
            </p>
            <Link to="/report">
              <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                Submit Your First Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
