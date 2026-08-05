import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, Send, Loader2, X, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LocationPicker } from '../../components/common/LocationPicker';
import { ISSUE_CATEGORIES } from '../../utils/constants';
import { issueService } from '../../services/issueService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function ReportPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [severity, setSeverity] = useState('Medium');
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLocationChange = ({ latitude: newLat, longitude: newLng, address: newAddress }) => {
    setLatitude(newLat);
    setLongitude(newLng);
    setAddress(newAddress);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file size must not exceed 10MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form Validation
    if (!imageFile) {
      toast.error('Please upload a photo of the issue.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter an issue title.');
      return;
    }
    if (!category) {
      toast.error('Please select an issue category.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please describe the civic issue.');
      return;
    }
    if (!address.trim() || latitude === null || longitude === null) {
      toast.error('Please select a valid location for the issue.');
      return;
    }

    if (!user) {
      toast.error('You must be signed in to submit a complaint.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload image to Supabase Storage bucket "complaints"
      const { publicUrl, error: uploadError } = await issueService.uploadComplaintImage(
        imageFile,
        user.id
      );

      if (uploadError || !publicUrl) {
        toast.error(uploadError?.message || 'Upload Failure: Failed to upload issue image.');
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create complaint record & complaint_images record in Supabase
      const { error: createError } = await issueService.createIssue({
        userId: user.id,
        userEmail: user.email || '',
        userName: user.user_metadata?.full_name || '',
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude,
        longitude,
        address: address.trim(),
        priority: 'Medium',
        imageUrl: publicUrl,
      });

      if (createError) {
        toast.error(createError.message || 'Upload Failure: Unable to save complaint.');
        setIsSubmitting(false);
        return;
      }

      // Step 3: Success toast & redirect to Dashboard
      toast.success('Upload Success! Complaint reported successfully.');
      navigate('/dashboard');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Upload Failure: An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Report a Civic Issue"
        description="Submit a report with photo evidence and GIS location for municipal resolution."
      />

      <Card className="shadow-xs border-gray-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. Photo Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Upload Issue Photo <span className="text-rose-500">*</span>
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 flex items-center justify-center max-h-80 group">
                <img
                  src={imagePreview}
                  alt="Issue Preview"
                  className="max-h-80 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 bg-gray-900/80 hover:bg-rose-600 text-white p-2 rounded-full backdrop-blur-xs transition-colors shadow-md"
                  aria-label="Remove image"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Image Selected ({imageFile.name})
                </div>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/30 rounded-2xl p-8 text-center transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
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
                  Supabase Complaints Storage Ready
                </div>
              </label>
            )}
          </div>

          {/* 2. Issue Title */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-800">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. Deep Pothole causing traffic delay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* 3. Issue Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-800">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select issue category</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-800">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="Low">Low - Minor Inconvenience</option>
                <option value="Medium">Medium - Standard Hazard</option>
                <option value="High">High - Urgent Attention Needed</option>
                <option value="Critical">Critical - Immediate Public Risk</option>
              </select>
            </div>
          </div>

          {/* 4. Professional Location Picker Module */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Location Selection <span className="text-rose-500">*</span>
            </label>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              address={address}
              onChange={handleLocationChange}
              disabled={isSubmitting}
            />
          </div>

          {/* 5. Additional Description */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-800">
              Description & Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe specifics such as depth, landmarks, or hazard severity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* 6. Form Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[160px] flex items-center justify-center font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading & Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
