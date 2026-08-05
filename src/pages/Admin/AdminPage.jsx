import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, AlertOctagon, RefreshCw, CheckCircle2, Clock, MapPin, Tag, Calendar, User, Search, Layers, Loader2, LogOut } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { ISSUE_CATEGORIES } from '../../utils/constants';
import { issueService } from '../../services/issueService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function AdminPage() {
  const { user, adminLogout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadAdminQueue = useCallback(async () => {
    setLoading(true);
    const { data } = await issueService.fetchAllComplaints();
    setComplaints(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAdminQueue();
  }, [loadAdminQueue]);

  const handleAdminLogout = () => {
    adminLogout();
    toast.info('Admin session ended.');
    navigate('/admin/login');
  };

  // System-wide metric calculations
  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'pending'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'in progress'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'resolved'
  ).length;
  const criticalCount = complaints.filter(
    (c) => (c.severity || '').toLowerCase() === 'critical' || (c.severity || '').toLowerCase() === 'high'
  ).length;

  const handleStatusChange = async (complaintId, oldStatus, newStatus) => {
    if (oldStatus === newStatus) return;
    setUpdatingId(complaintId);

    const { error } = await issueService.updateComplaintStatus(
      complaintId,
      newStatus,
      oldStatus,
      user?.id
    );

    if (error) {
      toast.error('Failed to update complaint status.');
    } else {
      toast.success(`Complaint status updated to "${newStatus}"`);
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
      );
    }
    setUpdatingId(null);
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      statusFilter === 'all' || (c.status || '').toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === 'all' || (c.category || '').toLowerCase() === categoryFilter.toLowerCase();

    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusBadgeVariant = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved':
        return 'success';
      case 'in progress':
        return 'info';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getSeverityBadgeVariant = (severity) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'secondary';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Municipal Administration Control Panel"
        description="Review incoming AI-analyzed reports across all districts, dispatch field teams, and manage resolution statuses."
        badge={<Badge variant="indigo">Admin Authority View</Badge>}
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={loadAdminQueue}
              disabled={loading}
              variant="outline"
              className="text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </Button>

            <Button
              onClick={handleAdminLogout}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Admin Logout
            </Button>
          </div>
        }
      />

      {/* Admin Executive Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Reports</p>
              <h3 className="text-2xl font-extrabold text-blue-400 mt-1">{totalComplaints}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unassigned Triage</p>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dispatched Crew</p>
              <h3 className="text-2xl font-extrabold text-indigo-400 mt-1">{inProgressCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolved</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{resolvedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical Hazards</p>
              <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{criticalCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Filters & Search Panel */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All Queue' },
              { id: 'pending', label: 'Pending' },
              { id: 'in progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Input
                placeholder="Search by title, email, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* Admin Queue Management List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <CardTitle>Municipal Triage & Dispatch Queue</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {filteredComplaints.length} of {complaints.length} total municipal reports
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="py-16 text-center">
              <div className="max-w-xs mx-auto space-y-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Admin Queue Empty</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery
                    ? 'No municipal complaints match your active status or category filters.'
                    : 'No pending reports require municipal action at this moment.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((item) => {
                const imageUrl = item.complaint_images?.[0]?.image_url;
                const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                const isUpdatingThis = updatingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-5 bg-white border border-gray-200 rounded-2xl shadow-2xs hover:shadow-md transition-all"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-gray-200/60">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Layers className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900 leading-snug">{item.title}</h3>
                          <Badge variant={getSeverityBadgeVariant(item.severity)} className="text-[10px] uppercase font-bold">
                            {item.severity || 'Medium'} Severity
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                          <div className="flex items-center gap-1 text-blue-600 font-medium">
                            <Tag className="w-3.5 h-3.5" />
                            <span className="capitalize">{item.category}</span>
                          </div>

                          <div className="flex items-center gap-1 text-rose-600">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[220px]">{item.address || 'Location Tagged'}</span>
                          </div>

                          <div className="flex items-center gap-1 text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                          </div>

                          {item.profiles?.email && (
                            <div className="flex items-center gap-1 text-gray-500 font-mono text-[11px]">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>{item.profiles.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Interactive Status Control */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 shrink-0">
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Status</div>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="font-semibold text-xs px-3 py-1">
                          {item.status || 'Pending'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUpdatingThis ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            Updating...
                          </div>
                        ) : (
                          <select
                            value={item.status || 'Pending'}
                            onChange={(e) => handleStatusChange(item.id, item.status, e.target.value)}
                            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                          >
                            <option value="Pending">⚡ Set to Pending</option>
                            <option value="In Progress">🛠️ Set to In Progress</option>
                            <option value="Resolved">✅ Set to Resolved</option>
                          </select>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
