import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  Calendar,
  User,
  Search,
  Layers,
  Loader2,
  LogOut,
  Radio,
  FileText,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { ISSUE_CATEGORIES } from '../../utils/constants';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function AdminPage() {
  const { adminLogout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Fetch ALL complaints directly from Supabase complaints table (order created_at DESC)
  const fetchComplaintsDirectly = useCallback(async () => {
    setLoading(true);
    try {
      // Primary query: Attempt join with complaint_images and profiles
      let { data: complaintsData, error } = await supabase
        .from('complaints')
        .select(`
          *,
          complaint_images (
            id,
            image_url
          ),
          profiles (
            id,
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      // Fallback query if profiles foreign key relation is not defined in PostgREST
      if (error) {
        console.warn('Supabase relational join notice:', error.message);
        const { data: rawComplaints, error: complaintsErr } = await supabase
          .from('complaints')
          .select(`
            *,
            complaint_images (
              id,
              image_url
            )
          `)
          .order('created_at', { ascending: false });

        if (complaintsErr) {
          toast.error(`Error reading from Supabase: ${complaintsErr.message}`);
          setComplaints([]);
          setLoading(false);
          return;
        }

        complaintsData = rawComplaints || [];

        // Join profiles manually by matching user_id with profile id
        try {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, email, full_name');

          if (profilesData && profilesData.length > 0) {
            const profileMap = new Map(profilesData.map((p) => [p.id, p]));
            complaintsData = complaintsData.map((item) => ({
              ...item,
              profiles: profileMap.get(item.user_id) || null,
            }));
          }
        } catch (profileFetchErr) {
          console.warn('Could not fetch profiles table:', profileFetchErr);
        }
      }

      // Requirement 3: Deduplicate complaints by unique ID before setting state
      const uniqueMap = new Map();
      (complaintsData || []).forEach((item) => {
        if (item && item.id && !uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });

      setComplaints(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Direct Supabase fetch exception:', err);
      toast.error('Failed to fetch complaints directly from Supabase');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Subscribe to real-time updates for live automatic refresh across sessions
  useEffect(() => {
    fetchComplaintsDirectly();

    const channel = supabase
      .channel('admin-complaints-live-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints' },
        () => {
          fetchComplaintsDirectly();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComplaintsDirectly]);

  const handleAdminLogout = () => {
    adminLogout();
    toast.info('Admin session ended.');
    navigate('/admin/login');
  };

  // Immediate Supabase status update function
  const handleStatusChange = async (complaintId, newStatus) => {
    setUpdatingId(complaintId);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', complaintId);

      if (error) {
        toast.error(`Supabase update error: ${error.message}`);
      } else {
        toast.success(`Status updated to "${newStatus}"`);
        // Refresh automatically after status update
        await fetchComplaintsDirectly();
      }
    } catch (err) {
      console.error('Status change error:', err);
      toast.error('Failed to update status in Supabase');
    } finally {
      setUpdatingId(null);
    }
  };

  // Summary Metrics calculated directly from Supabase data
  const totalReports = complaints.length;
  const pendingCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'pending'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'in progress'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'resolved'
  ).length;

  // Filter complaints list based on active search / category / status tabs
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      statusFilter === 'all' || (c.status || '').toLowerCase() === statusFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === 'all' || (c.category || '').toLowerCase() === categoryFilter.toLowerCase();

    const matchesSearch =
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.profiles?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchQuery.toLowerCase());

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
      {/* Page Header */}
      <PageHeader
        title="Admin Control Center"
        description="Comprehensive management portal for all community reports. Realtime connection to Supabase database."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="indigo">Municipal Admin Authority</Badge>
            {realtimeConnected && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide border border-emerald-200">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" /> Live Supabase Sync
              </span>
            )}
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchComplaintsDirectly}
              disabled={loading}
              variant="outline"
              className="text-gray-700 bg-white border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              onClick={handleAdminLogout}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </Button>
          </div>
        }
      />

      {/* Requirement 7: Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reports */}
        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Reports</p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded mt-1"></div>
              ) : (
                <h3 className="text-2xl font-extrabold text-blue-400 mt-1">{totalReports}</h3>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Pending */}
        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending</p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded mt-1"></div>
              ) : (
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{pendingCount}</h3>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* In Progress */}
        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">In Progress</p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded mt-1"></div>
              ) : (
                <h3 className="text-2xl font-extrabold text-indigo-400 mt-1">{inProgressCount}</h3>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Resolved */}
        <Card className="bg-slate-900 text-white border-0 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolved</p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-800 animate-pulse rounded mt-1"></div>
              ) : (
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{resolvedCount}</h3>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: `All (${totalReports})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'in progress', label: `In Progress (${inProgressCount})` },
              { id: 'resolved', label: `Resolved (${resolvedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input & Category Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Input
                placeholder="Search complaints, email, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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

      {/* Main Content Area */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <CardTitle>All User Complaints (Supabase Database)</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {filteredComplaints.length} of {complaints.length} complaints submitted across all users
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Requirement 10: Show loading skeleton while fetching */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse flex flex-col md:flex-row items-start md:items-center gap-4 p-5 border border-gray-200 rounded-2xl bg-white">
                  <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0"></div>
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center gap-3">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                    <div className="flex gap-4 pt-2">
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-28"></div>
                    </div>
                  </div>
                  <div className="w-32 h-10 bg-gray-200 rounded-xl shrink-0"></div>
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            /* Requirement 11: Show empty state only if the complaints table is actually empty */
            <div className="py-16 text-center">
              <div className="max-w-xs mx-auto space-y-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Complaints Table Empty</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  No complaints have been submitted yet. The Supabase database contains zero records.
                </p>
              </div>
            </div>
          ) : filteredComplaints.length === 0 ? (
            /* Empty state for search/filter mismatch when complaints table is NOT empty */
            <div className="py-16 text-center">
              <div className="max-w-xs mx-auto space-y-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-800">No Matching Complaints</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  No complaints match your active filter criteria or search query.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            /* Complaint Items List */
            <div className="space-y-4">
              {filteredComplaints.map((item) => {
                // Image URL resolution
                const imageUrl = item.complaint_images?.[0]?.image_url || null;

                // Reporter Email (from joined profile or profile email fallback)
                const reporterEmail = item.profiles?.email || 'N/A';

                // Formatted Created Date
                const formattedDate = item.created_at
                  ? new Date(item.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Unknown Date';

                const isUpdatingThis = updatingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-5 bg-white border border-gray-200 rounded-2xl shadow-2xs hover:shadow-md transition-all"
                  >
                    {/* Left Section: Image and Details (Requirement 6) */}
                    <div className="flex items-start gap-4 flex-1 w-full">
                      {/* Complaint Image */}
                      <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-gray-200/80 shadow-2xs">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.title || 'Complaint Image'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Layers className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Details: Title, Category, Severity, Priority, Status, Address, Email, Created Date */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900 leading-snug break-words">
                            {item.title || 'Untitled Complaint'}
                          </h3>
                          <Badge variant={getSeverityBadgeVariant(item.severity)} className="text-[10px] uppercase font-bold">
                            {item.severity || 'Medium'} Severity
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold text-slate-700 bg-slate-100">
                            {item.priority || 'Medium'} Priority
                          </Badge>
                        </div>

                        {item.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 pt-1">
                          {/* Category */}
                          <div className="flex items-center gap-1 text-blue-600 font-medium">
                            <Tag className="w-3.5 h-3.5" />
                            <span className="capitalize">{item.category || 'General'}</span>
                          </div>

                          {/* Address */}
                          <div className="flex items-center gap-1 text-rose-600">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[220px]">{item.address || 'Address Not Provided'}</span>
                          </div>

                          {/* Reporter Email */}
                          <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{reporterEmail}</span>
                          </div>

                          {/* Created Date */}
                          <div className="flex items-center gap-1 text-gray-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>

                        {/* Requirement 10: Gemini 2.5 Vision AI Analysis Display */}
                        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100/80 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Gemini 2.5 Vision AI Analysis</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="font-semibold text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded-md">
                                AI Category: {item.ai_category || 'Pending'}
                              </span>
                              <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                                AI Severity: {item.ai_severity || 'N/A'}
                              </span>
                              <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                                AI Priority: {item.ai_priority || 'N/A'}
                              </span>
                              {item.ai_confidence !== undefined && item.ai_confidence !== null && (
                                <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                                  Confidence: {item.ai_confidence}%
                                </span>
                              )}
                            </div>
                          </div>
                          {item.ai_summary && (
                            <p className="text-xs text-indigo-950/80 leading-relaxed font-medium pt-0.5">
                              <span className="font-semibold text-indigo-900">AI Summary: </span>
                              {item.ai_summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Requirement 8 (Dropdown to change complaint status) */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 shrink-0">
                      <div className="text-left lg:text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</div>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="font-semibold text-xs px-3 py-1">
                          {item.status || 'Pending'}
                        </Badge>
                      </div>

                      {/* Dropdown Options: Pending, In Progress, Resolved */}
                      <div className="flex items-center gap-2">
                        {isUpdatingThis ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-xs font-semibold text-gray-600">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            Updating...
                          </div>
                        ) : (
                          <select
                            value={item.status || 'Pending'}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs transition-all"
                          >
                            <option value="Pending">⚡ Pending</option>
                            <option value="In Progress">🛠️ In Progress</option>
                            <option value="Resolved">✅ Resolved</option>
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

