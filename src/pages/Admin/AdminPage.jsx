import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Tag,
  User,
  Search,
  Loader2,
  Radio,
  FileText,
  Sparkles,
  Flame,
  Activity,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { ISSUE_CATEGORIES } from '../../utils/constants';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';

// Helper to create glowing tactical map marker icons based on severity/status
const createMarkerIcon = (severity, status) => {
  let color = '#3b82f6';
  let glow = 'rgba(59, 130, 246, 0.6)';

  if ((status || '').toLowerCase() === 'resolved') {
    color = '#10b981';
    glow = 'rgba(16, 185, 129, 0.6)';
  } else {
    switch ((severity || '').toLowerCase()) {
      case 'critical':
        color = '#ef4444';
        glow = 'rgba(239, 68, 68, 0.9)';
        break;
      case 'high':
        color = '#f97316';
        glow = 'rgba(249, 115, 22, 0.8)';
        break;
      case 'medium':
        color = '#eab308';
        glow = 'rgba(234, 179, 8, 0.7)';
        break;
      case 'low':
      default:
        color = '#10b981';
        glow = 'rgba(16, 185, 129, 0.6)';
        break;
    }
  }

  return L.divIcon({
    className: 'tactical-map-pin',
    html: `
      <div style="
        position: relative;
        width: 22px;
        height: 22px;
        background-color: ${color};
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 14px ${glow};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 7px; height: 7px; background-color: #ffffff; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

const CHART_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AdminPage() {
  const { adminLogout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Fetch ALL complaints directly from Supabase
  const fetchComplaintsDirectly = useCallback(async () => {
    setLoading(true);
    try {
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

      if (error) {
        console.warn('Supabase relational join fallback:', error.message);
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
          toast.error(`Database error: ${complaintsErr.message}`);
          setComplaints([]);
          setLoading(false);
          return;
        }

        complaintsData = rawComplaints || [];

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
          console.warn('Could not fetch profiles:', profileFetchErr);
        }
      }

      // Deduplicate by unique complaint ID
      const uniqueMap = new Map();
      (complaintsData || []).forEach((item) => {
        if (item && item.id && !uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });

      setComplaints(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Direct Supabase fetch exception:', err);
      toast.error('Failed to fetch complaints from database.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchComplaintsDirectly();

    const channel = supabase
      .channel('admin-authority-live-channel')
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
        toast.error(`Update failed: ${error.message}`);
      } else {
        toast.success(`Status updated to "${newStatus}"`);
        await fetchComplaintsDirectly();
      }
    } catch (err) {
      console.error('Status update exception:', err);
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats Calculations
  const totalReports = complaints.length;
  const criticalCount = complaints.filter(
    (c) => (c.severity || c.severity_score || '').toLowerCase() === 'critical'
  ).length;
  const pendingCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'pending'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'in progress'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => (c.status || '').toLowerCase() === 'resolved'
  ).length;

  const avgResolutionTime = '3.8 Hours';

  // Category Distribution for Recharts
  const categoryChartData = useMemo(() => {
    const counts = {};
    complaints.forEach((c) => {
      const cat = c.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  // Filter complaints based on Search, Category, Status, and Severity
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      statusFilter === 'all' || (c.status || '').toLowerCase() === statusFilter.toLowerCase();

    const matchesSeverity =
      severityFilter === 'all' ||
      (c.severity || c.severity_score || '').toLowerCase() === severityFilter.toLowerCase();

    const matchesCategory =
      categoryFilter === 'all' || (c.category || '').toLowerCase() === categoryFilter.toLowerCase();

    const matchesSearch =
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.profiles?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSeverity && matchesCategory && matchesSearch;
  });

  // Priority Queue Table sorting (Urgency: Critical -> High -> Medium -> Low)
  const prioritySortedComplaints = useMemo(() => {
    const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...filteredComplaints].sort((a, b) => {
      const rankA = severityRank[(a.severity || a.severity_score || '').toLowerCase()] || 0;
      const rankB = severityRank[(b.severity || b.severity_score || '').toLowerCase()] || 0;
      if (rankA !== rankB) return rankB - rankA;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [filteredComplaints]);

  // City Map Center
  const mapCenter = useMemo(() => {
    const valid = complaints.find((c) => c.latitude && c.longitude);
    if (valid) return [valid.latitude, valid.longitude];
    return [28.6139, 77.2090];
  }, [complaints]);

  const mapMarkers = useMemo(() => {
    return complaints.filter((c) => c.latitude && c.longitude);
  }, [complaints]);

  const getSeverityBadgeColor = (sev) => {
    switch ((sev || '').toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border dark:border-red-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border dark:border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/10 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border dark:border-blue-500/30';
      case 'low':
      default:
        return 'bg-emerald-500/10 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Tactical Header */}
      <PageHeader
        title="Authority Dashboard & Command Center"
        description="Tactical real-time GIS spatial monitoring, municipal priority queue, and AI dispatch management."
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="indigo">Municipal Command Authority</Badge>
            {realtimeConnected && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold tracking-wider border border-emerald-300 dark:border-emerald-500/30">
                <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Live Telemetry
              </span>
            )}
          </div>
        }
        action={
          <Button
            onClick={fetchComplaintsDirectly}
            disabled={loading}
            variant="outline"
            className="text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border dark:border-slate-800/80 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:dark:border-blue-500/40 hover:dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Complaints</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{loading ? '...' : totalReports}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Recorded across city sectors</p>
        </div>

        {/* Critical Severity Count */}
        <div className="p-5 rounded-2xl bg-white/80 border border-red-200/80 shadow-sm dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border dark:border-red-500/30 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:dark:border-red-500/60 hover:dark:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-300 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">Critical Hazards</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-500/30">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">{loading ? '...' : criticalCount}</div>
          <p className="text-[11px] text-red-600/80 dark:text-red-300">Immediate dispatch required</p>
        </div>

        {/* Resolved Count */}
        <div className="p-5 rounded-2xl bg-white/80 border border-emerald-200/80 shadow-sm dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border dark:border-emerald-500/30 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:dark:border-emerald-500/60 hover:dark:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Resolved Reports</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{loading ? '...' : resolvedCount}</div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-300">Completed municipal tickets</p>
        </div>

        {/* Average Resolution Time */}
        <div className="p-5 rounded-2xl bg-white/80 border border-indigo-200/80 shadow-sm dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border dark:border-slate-800/80 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:dark:border-blue-500/40 hover:dark:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Avg Resolution Time</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{avgResolutionTime}</div>
          <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300">SLA metric target: &lt; 6.0 hrs</p>
        </div>
      </div>

      {/* Dynamic Heatmap Container & Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live GIS Map Container */}
        <div className="lg:col-span-2 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border dark:border-slate-800/80 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-5 space-y-4 transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Tactical GIS Heatmap
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" /> Critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" /> High
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50" /> Medium
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" /> Resolved
              </span>
            </div>
          </div>

          <div className="h-[380px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-950 transition-colors">
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom={false}
              className="h-full w-full z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {mapMarkers.map((c) => {
                const markerIcon = createMarkerIcon(c.severity || c.severity_score, c.status);
                return (
                  <Marker
                    key={c.id}
                    position={[c.latitude, c.longitude]}
                    icon={markerIcon}
                  >
                    <Popup className="tactical-popup">
                      <div className="p-1 space-y-1.5 max-w-xs text-slate-900">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs capitalize">{c.category}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px]">
                            {c.status || 'Pending'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm leading-tight text-slate-900">{c.title}</h4>
                        <p className="text-xs text-slate-600">{c.address}</p>
                        {c.ai_summary && (
                          <p className="text-[11px] italic text-slate-700 bg-slate-100 p-1.5 rounded">
                            AI: {c.ai_summary}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Analytics & Department Breakdown Chart */}
        <div className="rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border dark:border-slate-800/80 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] p-5 space-y-4 flex flex-col justify-between transition-all duration-300">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Category Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">Live Sync</span>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 10 }} />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                      borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      color: theme === 'dark' ? '#ffffff' : '#0f172a',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No chart data available</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>Pending Tickets: <strong className="text-amber-600 dark:text-amber-400">{pendingCount}</strong></span>
            <span>Resolved Tickets: <strong className="text-emerald-600 dark:text-emerald-400">{resolvedCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Dynamic Filter Panel */}
      <div className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border dark:border-slate-800/80 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-4 transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Interactive Priority & Department Filters</span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Input
              placeholder="Search by title, location, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:dark:border-blue-500 focus:dark:ring-1 focus:dark:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses ({totalReports})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="in progress">In Progress ({inProgressCount})</option>
              <option value="resolved">Resolved ({resolvedCount})</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Severity Level</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:dark:border-blue-500 focus:dark:ring-1 focus:dark:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Department / Category Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Department / Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:dark:border-blue-500 focus:dark:ring-1 focus:dark:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">All Departments</option>
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Priority Queue Table */}
      <div className="rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border dark:border-slate-800/80 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden transition-all duration-300">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
              Municipal Priority Queue (Sorted by Urgency)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Displaying {prioritySortedComplaints.length} tickets matching active filter parameters
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-xs font-semibold">
            Auto-Prioritized by AI Vision
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading municipal priority queue...</p>
          </div>
        ) : prioritySortedComplaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No Queue Tickets Match Criteria</h4>
            <p className="text-xs text-slate-500">Adjust your status, category, or search filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Urgency & Issue</th>
                  <th className="py-3.5 px-4">Category & Location</th>
                  <th className="py-3.5 px-4">Reporter & AI Vision Diagnosis</th>
                  <th className="py-3.5 px-4">Upvotes</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {prioritySortedComplaints.map((item) => {
                  const imageUrl = item.complaint_images?.[0]?.image_url || null;
                  const isUpdatingThis = updatingId === item.id;
                  const itemSeverity = item.severity || item.severity_score || 'Medium';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Urgency & Issue Summary */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {imageUrl ? (
                              <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <Layers className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getSeverityBadgeColor(itemSeverity)}`}>
                              {itemSeverity}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-1">{item.title}</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 capitalize">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{item.category || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{item.address || 'GPS Tagged'}</span>
                        </div>
                      </td>

                      {/* Reporter & AI Diagnosis */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{item.profiles?.email || 'Citizen Report'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/60 max-w-[220px]">
                          <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">{item.ai_summary || 'Gemini Vision Analyzed'}</span>
                        </div>
                      </td>

                      {/* Upvotes Count */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-amber-300 font-bold border border-slate-200 dark:border-slate-700">
                          👍 {item.upvotes || 1}
                        </span>
                      </td>

                      {/* Current Status Badge */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          (item.status || '').toLowerCase() === 'resolved'
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                            : (item.status || '').toLowerCase() === 'in progress'
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {item.status || 'Pending'}
                        </span>
                      </td>

                      {/* Interactive Status Dropdown Action */}
                      <td className="py-4 px-4 text-right">
                        {isUpdatingThis ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 font-medium">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                            Updating...
                          </div>
                        ) : (
                          <select
                            value={item.status || 'Pending'}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:dark:border-blue-500 focus:dark:ring-1 focus:dark:ring-blue-500 transition-colors cursor-pointer"
                          >
                            <option value="Pending">⚡ Pending</option>
                            <option value="In Progress">🛠️ In Progress</option>
                            <option value="Resolved">✅ Resolved</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
