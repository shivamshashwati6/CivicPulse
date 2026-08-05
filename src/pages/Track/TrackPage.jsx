import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, PlusCircle, Calendar, Tag, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ISSUE_CATEGORIES } from '../../utils/constants';
import { issueService } from '../../services/issueService';
import { useAuth } from '../../hooks/useAuth';

export function TrackPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (user?.id) {
      loadComplaints();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadComplaints = async () => {
    setLoading(true);
    const { data } = await issueService.fetchUserComplaints(user.id);
    setComplaints(data || []);
    setLoading(false);
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
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
        title="My Complaints & Issue Tracking"
        description="Track the status, municipal progress, and updates for your submitted civic reports."
        action={
          <Link to="/report">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20">
              <PlusCircle className="w-4 h-4 mr-2" />
              Report New Issue
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Input
            placeholder="Search your reports by title, location, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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

      {loading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-gray-500">Loading your reported issues...</p>
          </div>
        </Card>
      ) : filteredComplaints.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Complaints Found</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No complaints match your current search or category filter.'
                  : 'You have not submitted any civic issue reports yet.'}
              </p>
              <Link to="/report">
                <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Submit Your First Report
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredComplaints.map((item) => {
            const firstImage = item.complaint_images?.[0]?.image_url;
            return (
              <Card key={item.id} className="overflow-hidden border border-gray-200/90 hover:shadow-md transition-all">
                {firstImage && (
                  <div className="h-48 w-full bg-gray-100 overflow-hidden relative">
                    <img
                      src={firstImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant={getStatusBadgeVariant(item.status)} className="shadow-xs font-semibold">
                        {item.status || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-medium capitalize">{item.category}</span>
                        <span>•</span>
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!firstImage && (
                      <Badge variant={getStatusBadgeVariant(item.status)} className="font-semibold">
                        {item.status || 'Pending'}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[260px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{item.address || 'Location Tagged'}</span>
                    </div>
                    <div className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      Priority: {item.priority || 'Medium'}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
