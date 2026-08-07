import { supabase } from './supabaseClient';

/**
 * Helper to validate if a string is a standard UUID format
 */
function isValidUuid(idStr) {
  if (!idStr || typeof idStr !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
}

export const issueService = {
  /**
   * Reverse geocode latitude and longitude with fallback APIs
   */
  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          return {
            address: data.display_name,
            error: null,
          };
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocoding warning:', err);
    }

    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (response.ok) {
        const data = await response.json();
        const parts = [
          data.locality || data.city || data.localityInfo?.administrative?.[2]?.name,
          data.principalSubdivision || data.region,
          data.countryName,
        ].filter(Boolean);

        if (parts.length > 0) {
          return {
            address: parts.join(', '),
            error: null,
          };
        }
      }
    } catch (err) {
      console.warn('BigDataCloud reverse geocoding warning:', err);
    }

    return {
      address: `Location (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
      error: null,
    };
  },

  /**
   * Geocode a text search query string into latitude, longitude, and formatted address
   */
  async geocodeAddress(searchQuery) {
    if (!searchQuery || !searchQuery.trim()) return null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const item = data[0];
          return {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            address: item.display_name || searchQuery.trim(),
          };
        }
      }
    } catch (err) {
      console.warn('Nominatim geocode query error:', err);
    }
    return null;
  },

  /**
   * Fast IP-based Location Fetcher (Fallback for PCs without GPS hardware or blocked permissions)
   */
  async fetchIpLocation() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const parts = [data.city, data.region, data.country_name].filter(Boolean);
          return {
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            address: parts.length > 0 ? parts.join(', ') : `${data.latitude}, ${data.longitude}`,
          };
        }
      }
    } catch (e) {
      console.warn('IP-API location fallback failed:', e);
    }

    try {
      const res = await fetch('https://ipwho.is/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const parts = [data.city, data.region, data.country].filter(Boolean);
          return {
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            address: parts.length > 0 ? parts.join(', ') : `${data.latitude}, ${data.longitude}`,
          };
        }
      }
    } catch (e) {
      console.warn('ipwho.is location fallback failed:', e);
    }

    return null;
  },

  /**
   * Upload complaint photo directly to Supabase Storage bucket "complaints"
   */
  async uploadComplaintImage(file, userId) {
    if (!file) return { publicUrl: null, error: null };

    let base64Url = null;
    try {
      base64Url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    } catch (e) {
      console.warn('FileReader error:', e);
    }

    try {
      const folderId = isValidUuid(userId) ? userId : 'anonymous';
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
      const fileName = `${folderId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('complaints')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error || !data) {
        console.warn('Supabase storage upload returned error, using base64 fallback:', error);
        return { publicUrl: base64Url || (file ? URL.createObjectURL(file) : null), error: null };
      }

      const { data: publicUrlData } = supabase.storage
        .from('complaints')
        .getPublicUrl(data.path);

      return { publicUrl: publicUrlData?.publicUrl || base64Url, error: null };
    } catch (err) {
      console.warn('Supabase storage upload exception, using base64 fallback:', err);
      return { publicUrl: base64Url || (file ? URL.createObjectURL(file) : null), error: null };
    }
  },

  /**
   * Create a new complaint record directly in Supabase database complaints table
   */
  async createIssue({
    userId,
    userEmail = '',
    userName = '',
    title,
    description,
    category,
    severity = 'Medium',
    latitude = null,
    longitude = null,
    address = '',
    priority = 'Medium',
    imageUrl = null,
  }) {
    let activeUserId = null;
    let activeUserEmail = userEmail;
    let activeUserName = userName;

    // Dynamically retrieve authenticated user from supabase.auth.getUser()
    try {
      const { data: authUserData } = await supabase.auth.getUser();
      if (authUserData?.user?.id) {
        activeUserId = authUserData.user.id;
        if (authUserData.user.email) activeUserEmail = authUserData.user.email;
        const metaName =
          authUserData.user.user_metadata?.full_name ||
          authUserData.user.user_metadata?.name;
        if (metaName) activeUserName = metaName;
      }
    } catch (authErr) {
      console.warn('Could not fetch active user from supabase.auth.getUser():', authErr);
    }

    if (!activeUserId && isValidUuid(userId)) {
      activeUserId = userId;
    }

    if (!activeUserId || !isValidUuid(activeUserId)) {
      return {
        data: null,
        error: new Error('Please log in with an authenticated account to submit a report.'),
      };
    }

    try {
      // Step 1: Ensure user profile row exists in public.profiles table
      try {
        await supabase.from('profiles').upsert(
          [
            {
              id: activeUserId,
              email: activeUserEmail,
              full_name: activeUserName,
            },
          ],
          { onConflict: 'id' }
        );
      } catch (profileErr) {
        console.warn('Profile upsert warning (non-fatal):', profileErr);
      }

      // Step 2: Insert complaint row directly into public.complaints
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .insert([
          {
            user_id: activeUserId,
            title,
            description,
            category,
            severity,
            latitude,
            longitude,
            address,
            status: 'Pending',
            priority,
          },
        ])
        .select();

      if (complaintError) {
        console.error('Supabase DB complaint insert failed:', complaintError);
        return { data: null, error: complaintError };
      }

      const insertedRecord = Array.isArray(complaintData) ? complaintData[0] : complaintData;
      const finalId = insertedRecord?.id;

      // Step 3: Insert image record into public.complaint_images if image provided
      if (imageUrl && finalId) {
        try {
          await supabase.from('complaint_images').insert([
            {
              complaint_id: finalId,
              image_url: imageUrl,
            },
          ]);
        } catch (imgErr) {
          console.warn('Image record insert warning:', imgErr);
        }
      }

      const finalComplaintObj = {
        ...insertedRecord,
        complaint_images: imageUrl ? [{ id: `img_${Date.now()}`, image_url: imageUrl }] : [],
        profiles: {
          email: activeUserEmail,
          full_name: activeUserName,
        },
      };

      return { data: finalComplaintObj, error: null };
    } catch (err) {
      console.error('Exception during createIssue DB insert:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Delete a complaint directly by ID in Supabase
   */
  async deleteComplaint(complaintId) {
    if (!complaintId) return { error: null };

    try {
      try {
        await supabase.from('complaint_images').delete().eq('complaint_id', complaintId);
      } catch (imgErr) {
        console.warn('Complaint images delete notice:', imgErr);
      }

      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaintId);

      if (error) {
        console.error('Supabase deleteComplaint error:', error);
      }

      return { error: error || null };
    } catch (err) {
      console.error('Supabase deleteComplaint exception:', err);
      return { error: err };
    }
  },

  /**
   * Fetch user complaints directly from Supabase complaints table
   */
  async fetchUserComplaints(userId) {
    if (!userId || !isValidUuid(userId)) {
      return { data: [], error: null };
    }

    try {
      const { data: remoteData, error } = await supabase
        .from('complaints')
        .select(`
          *,
          complaint_images (
            id,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchUserComplaints query error:', error);
        return { data: [], error };
      }

      return { data: remoteData || [], error: null };
    } catch (err) {
      console.error('Supabase fetchUserComplaints exception:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Fetch ALL complaints directly from Supabase complaints table for Admin Control Panel
   */
  async fetchAllComplaints() {
    try {
      let { data: remoteData, error } = await supabase
        .from('complaints')
        .select(`
          *,
          complaint_images (
            id,
            image_url
          ),
          profiles (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        const { data: rawComplaints, error: rawError } = await supabase
          .from('complaints')
          .select(`
            *,
            complaint_images (
              id,
              image_url
            )
          `)
          .order('created_at', { ascending: false });

        if (!rawError && rawComplaints) {
          return { data: rawComplaints, error: null };
        }
      }

      return { data: remoteData || [], error: error || null };
    } catch (err) {
      console.error('Supabase fetchAllComplaints exception:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Update complaint status directly in Supabase
   */
  async updateComplaintStatus(complaintId, newStatus, oldStatus = 'Pending', adminId = null) {
    try {
      const validAdminId = adminId && isValidUuid(adminId) ? adminId : null;
      const { data, error } = await supabase
        .from('complaints')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', complaintId)
        .select();

      if (!error) {
        try {
          await supabase.from('status_history').insert([
            {
              complaint_id: complaintId,
              old_status: oldStatus,
              new_status: newStatus,
              updated_by: validAdminId,
            },
          ]);
        } catch (historyErr) {
          console.warn('Status history insert warning:', historyErr);
        }
      }

      return { data, error: error || null };
    } catch (err) {
      console.error('Supabase updateComplaintStatus exception:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Fetch single complaint by ID directly from Supabase
   */
  async fetchIssueById(id) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          complaint_images (
            id,
            image_url
          ),
          status_history (
            id,
            old_status,
            new_status,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('fetchIssueById error:', err);
      return { data: null, error: err };
    }
  },
};
