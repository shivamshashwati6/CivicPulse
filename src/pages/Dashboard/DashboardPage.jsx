import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, CheckCircle2, Clock, AlertTriangle, FileText, ArrowUpRight, MapPin, Calendar, Tag, Layers, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { issueService } from '../../services/issueService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await issueService.fetchUserComplaints(user.id);
    setComplaints(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadDashboardData();

    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadDashboardData]);

  const handleDeleteComplaint = async (complaintId) => {
    if (!user?.id) return;
    setDeletingId(complaintId);

    const { error } = await issueService.deleteComplaint(complaintId, user.id);

    if (error) {
      toast.error('Failed to delete complaint report.');
    } else {
      toast.success('Report deleted successfully.');
      setComplaints((prev) => prev.filter((c) => c.id !== complaintId));
    }

    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  // Compute metric totals from real Supabase user complaints
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Citizen Overview Dashboard"
        description="Monitor your submitted reports, municipal updates, and resolution status."
        action={
          <Link to="/report">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </Link>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/4"></div>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="border-l-4 border-l-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Reports</p>
                  <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{totalReports}</h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Review</p>
                  <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{pendingCount}</h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-indigo-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Progress</p>
                  <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{inProgressCount}</h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolved</p>
                  <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{resolvedCount}</h3>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Recent Submissions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <CardTitle>Recent Issue Reports</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Your live complaints ordered by newest first</p>
          </div>
          {complaints.length > 0 && (
            <Link to="/track" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
              View All Reports <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            /* Loading Skeleton */
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center">
              <div className="max-w-xs mx-auto space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">No Reports Submitted Yet</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  When you submit a civic issue report, it will appear here with live status and municipal resolution tracking.
                </p>
                <Link to="/report">
                  <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Submit Your First Report
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Real User Complaints List (Newest First) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaints.map((item) => {
                const imageUrl = item.complaint_images?.[0]?.image_url;
                const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                const isConfirming = confirmDeleteId === item.id;
                const isDeleting = deletingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group"
                  >
                    {/* Confirmation Overlay when Delete is Clicked */}
                    {isConfirming && (
                      <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-xs p-6 flex flex-col items-center justify-center text-center space-y-3 text-white transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold">Delete Report?</p>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            This action cannot be undone. Are you sure you want to remove this complaint?
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleting}
                            className="bg-transparent text-slate-200 border-slate-700 hover:bg-slate-800 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteComplaint(item.id)}
                            disabled={isDeleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Deleting...
                              </>
                            ) : (
                              'Confirm Delete'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Complaint Image Header */}
                    <div className="h-44 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-1">
                          <Layers className="w-8 h-8" />
                          <span className="text-[11px] font-medium">No Image Uploaded</span>
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(item.status)} className="font-semibold shadow-xs">
                          {item.status || 'Pending'}
                        </Badge>

                        {/* Delete Button (Trash Icon) */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-1.5 rounded-lg bg-gray-900/70 hover:bg-rose-600 text-white backdrop-blur-xs transition-colors shadow-xs"
                          title="Delete Complaint"
                          aria-label="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Complaint Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                            <span className="capitalize font-medium text-gray-700">{item.category}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Footer Details */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{item.address || 'Location Tagged'}</span>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-gray-700">
                          {item.priority || 'Medium'}
                        </span>
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
