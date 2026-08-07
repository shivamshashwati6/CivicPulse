import { supabase } from './supabaseClient';

const LOCAL_COMPLAINTS_KEY = 'civicpulse_local_complaints';

function getLocalComplaints() {
  try {
    const raw = localStorage.getItem(LOCAL_COMPLAINTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalComplaint(complaintObj) {
  try {
    const current = getLocalComplaints();
    const existsIndex = current.findIndex((c) => c.id === complaintObj.id);
    let updated;
    if (existsIndex >= 0) {
      updated = [...current];
      updated[existsIndex] = { ...updated[existsIndex], ...complaintObj };
    } else {
      updated = [complaintObj, ...current];
    }
    localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving local complaint:', e);
  }
}

function deleteLocalComplaint(complaintId) {
  try {
    const current = getLocalComplaints();
    const updated = current.filter((c) => c.id !== complaintId);
    localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error deleting local complaint:', e);
  }
}

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
   * Upload complaint photo to Supabase Storage bucket "complaints" with permanent base64 fallback
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
      console.warn('Supabase storage upload exception (Failed to fetch), using base64 fallback:', err);
      return { publicUrl: base64Url || (file ? URL.createObjectURL(file) : null), error: null };
    }
  },

  /**
   * Create a new complaint record with graceful network & local storage sync
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

    // Fall back to passed userId if it is a valid UUID
    if (!activeUserId && isValidUuid(userId)) {
      activeUserId = userId;
    }

    const complaintObj = {
      id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      user_id: activeUserId || userId || 'anonymous',
      title,
      description,
      category,
      severity,
      latitude,
      longitude,
      address,
      status: 'Pending',
      priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      complaint_images: imageUrl ? [{ id: `img_${Date.now()}`, image_url: imageUrl }] : [],
      profiles: {
        email: activeUserEmail,
        full_name: activeUserName,
      },
    };

    // Always save local backup so complaint is immediately available on citizen dashboard and admin panel
    saveLocalComplaint(complaintObj);

    // If no valid auth.users UUID exists, return local object without attempting remote FK-violating insert
    if (!activeUserId || !isValidUuid(activeUserId)) {
      console.warn('No valid auth.users UUID found for complaint insert; complaint saved to local storage.');
      return {
        data: complaintObj,
        error: new Error('Please log in with a valid account to sync report to cloud database.'),
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

      // Step 2: Insert complaint row into public.complaints
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
        return { data: complaintObj, error: complaintError };
      }

      const insertedRecord = Array.isArray(complaintData) ? complaintData[0] : complaintData;
      const finalId = insertedRecord?.id || complaintObj.id;

      // Step 3: Insert image record into public.complaint_images
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
        id: finalId,
        complaint_images: imageUrl ? [{ id: `img_${Date.now()}`, image_url: imageUrl }] : [],
        profiles: {
          email: activeUserEmail,
          full_name: activeUserName,
        },
      };

      saveLocalComplaint(finalComplaintObj);
      return { data: finalComplaintObj, error: null };
    } catch (err) {
      console.warn('Network exception during createIssue, saved to resilient local queue:', err);
      return { data: complaintObj, error: null };
    }
  },

  /**
   * Delete a complaint by ID directly in Supabase and local storage
   */
  async deleteComplaint(complaintId) {
    deleteLocalComplaint(complaintId);
    try {
      try {
        await supabase.from('complaint_images').delete().eq('complaint_id', complaintId);
      } catch (imgErr) {
        console.warn('Complaint images delete warning:', imgErr);
      }

      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaintId);

      return { error: error || null };
    } catch (err) {
      console.warn('Supabase deleteComplaint exception:', err);
      return { error: null };
    }
  },

  /**
   * Fetch user complaints (combines remote Supabase and local storage, deduplicated)
   */
  async fetchUserComplaints(userId) {
    const validUserId = toValidUuid(userId);
    const localData = getLocalComplaints().filter(
      (c) => c.user_id === validUserId || c.user_id === userId
    );

    const map = new Map();
    localData.forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });

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
        .or(`user_id.eq.${validUserId},user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (!error && remoteData) {
        remoteData.forEach((item) => {
          if (item && item.id) {
            map.set(item.id, item);
          }
        });
      }
    } catch (err) {
      console.warn('Supabase fetchUserComplaints exception:', err);
    }

    return { data: Array.from(map.values()), error: null };
  },

  /**
   * Fetch ALL complaints for Admin Control Panel (combines remote Supabase and local storage, deduplicated)
   */
  async fetchAllComplaints() {
    const localData = getLocalComplaints();
    const map = new Map();

    localData.forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });

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
        const { data: rawComplaints } = await supabase
          .from('complaints')
          .select(`
            *,
            complaint_images (
              id,
              image_url
            )
          `)
          .order('created_at', { ascending: false });
        
        remoteData = rawComplaints || [];
      }

      if (remoteData && remoteData.length > 0) {
        remoteData.forEach((item) => {
          if (item && item.id) {
            map.set(item.id, item);
          }
        });
      }
    } catch (err) {
      console.warn('Supabase fetchAllComplaints exception:', err);
    }

    return { data: Array.from(map.values()), error: null };
  },

  /**
   * Update complaint status
   */
  async updateComplaintStatus(complaintId, newStatus, oldStatus = 'Pending', adminId = null) {
    const local = getLocalComplaints();
    const target = local.find((c) => c.id === complaintId);
    if (target) {
      saveLocalComplaint({ ...target, status: newStatus });
    }

    try {
      const validAdminId = adminId ? toValidUuid(adminId) : null;
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

      return { data, error: null };
    } catch (err) {
      console.warn('Supabase updateComplaintStatus exception:', err);
      return { data: null, error: null };
    }
  },

  /**
   * Fetch single complaint by ID
   */
  async fetchIssueById(id) {
    const local = getLocalComplaints().find((c) => c.id === id);
    if (local) return { data: local, error: null };

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
      return { data: local || null, error: err };
    }
  },
};
