import React, { useState } from 'react';
import { Camera, MapPin, Sparkles, Send } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ISSUE_CATEGORIES } from '../../utils/constants';

export function ReportPage() {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Report a Civic Issue"
        description="Upload an image of the problem. AI will assist with classification and location tagging."
      />

      <Card className="shadow-xs border-gray-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload Issue Photo <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/30 rounded-2xl p-8 text-center transition-colors cursor-pointer group">
              <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Click or drag & drop photo here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports JPG, PNG, WEBP up to 10MB
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/60 text-blue-700 rounded-full text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Gemini AI Vision Ready
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select category (or let AI detect)</option>
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Location / Address
              </label>
              <button type="button" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5" /> Detect My Location
              </button>
            </div>
            <Input
              placeholder="e.g. Main Street, Sector 4, near Central Park"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Additional Details (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Describe any specifics such as hazard urgency or landmarks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="w-4 h-4 mr-2" />
              Submit Report
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
