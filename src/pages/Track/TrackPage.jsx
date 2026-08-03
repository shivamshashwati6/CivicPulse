import React, { useState } from 'react';
import { Search, Filter, MapPin, Calendar, Activity, CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ISSUE_CATEGORIES } from '../../utils/constants';

export function TrackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Public Issue Tracking"
        description="Browse and track active community reports, municipal updates, and resolution timelines."
      />

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Input
            placeholder="Search reports by location, category, or report ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Categories</option>
            {ISSUE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Track List Container */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Active Public Reports</CardTitle>
          <span className="text-xs text-slate-500 font-medium">Map View Integration Ready</span>
        </CardHeader>

        <CardContent className="py-12 text-center">
          <div className="max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Reports Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              When reports are logged in Supabase, they will be listed here with OpenStreetMap geolocation tags and status timelines.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
