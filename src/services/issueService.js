import { supabase } from './supabaseClient';

const LOCAL_STORAGE_KEY = 'civicpulse_user_complaints';

function getLocalComplaints(userId = null) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (userId) {
      return parsed.filter((c) => c.user_id === userId);
    }
    return parsed;
  } catch (e) {
    console.warn('Error reading local complaints:', e);
    return [];
  }
}

function saveLocalComplaint(complaint) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [complaint, ...existing.filter((c) => c.id !== complaint.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving local complaint:', e);
  }
}

function removeLocalComplaint(complaintId) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const existing = JSON.parse(raw);
    const updated = existing.filter((c) => c.id !== complaintId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error removing local complaint:', e);
  }
}

function updateLocalComplaintStatus(complaintId, newStatus) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const existing = JSON.parse(raw);
    const updated = existing.map((c) =>
      c.id === complaintId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error updating local complaint status:', e);
  }
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
   * Upload complaint photo to Supabase Storage bucket "complaints"
   */
  async uploadComplaintImage(file, userId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId || 'anonymous'}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('complaints')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.warn('Supabase storage upload failed, using local object URL fallback:', error);
        return { publicUrl: URL.createObjectURL(file), error: null };
      }

      const { data: publicUrlData } = supabase.storage
        .from('complaints')
        .getPublicUrl(data.path);

      return { publicUrl: publicUrlData.publicUrl, error: null };
    } catch (err) {
      console.warn('Failed to upload image to Supabase storage, using fallback:', err);
      return { publicUrl: URL.createObjectURL(file), error: null };
    }
  },

  /**
   * Create a new complaint record with Supabase + localStorage persistence
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
    const complaintId = crypto.randomUUID ? crypto.randomUUID() : `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newComplaintObject = {
      id: complaintId,
      user_id: userId,
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
      complaint_images: imageUrl ? [{ id: `img_${Date.now()}`, image_url: imageUrl }] : [],
    };

    saveLocalComplaint(newComplaintObject);

    try {
      if (userId) {
        try {
          await supabase.from('profiles').upsert(
            [
              {
                id: userId,
                email: userEmail,
                full_name: userName,
              },
            ],
            { onConflict: 'id' }
          );
        } catch (profileErr) {
          console.warn('Profile upsert warning:', profileErr);
        }
      }

      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .insert([
          {
            id: complaintId,
            user_id: userId,
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
        .select()
        .single();

      if (complaintError) {
        console.warn('Supabase DB insert warning (saved locally):', complaintError);
      }

      if (imageUrl && (complaintData?.id || complaintId)) {
        try {
          await supabase.from('complaint_images').insert([
            {
              complaint_id: complaintData?.id || complaintId,
              image_url: imageUrl,
            },
          ]);
        } catch (imgErr) {
          console.warn('Image record insert warning:', imgErr);
        }
      }

      return { data: complaintData || newComplaintObject, error: null };
    } catch (err) {
      console.warn('Supabase createIssue network warning (saved locally):', err);
      return { data: newComplaintObject, error: null };
    }
  },

  /**
   * Delete a complaint by ID (Removes from Supabase DB + Local Storage)
   */
  async deleteComplaint(complaintId, userId) {
    // 1. Remove from local storage cache immediately
    removeLocalComplaint(complaintId);

    try {
      // 2. Delete complaint images if any
      try {
        await supabase.from('complaint_images').delete().eq('complaint_id', complaintId);
      } catch (imgErr) {
        console.warn('Complaint images delete warning:', imgErr);
      }

      // 3. Delete complaint record from Supabase complaints table
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaintId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase delete complaint error (removed locally):', error);
      }

      return { error: null };
    } catch (err) {
      console.warn('Supabase deleteComplaint network warning (removed locally):', err);
      return { error: null };
    }
  },

  /**
   * Fetch user complaints (Combines Supabase DB + Local Storage)
   */
  async fetchUserComplaints(userId) {
    const localComplaints = getLocalComplaints(userId);

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

      if (!error && remoteData) {
        const map = new Map();
        [...remoteData, ...localComplaints].forEach((item) => {
          map.set(item.id, item);
        });
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        return { data: combined, error: null };
      }

      const { data: rawComplaints } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (rawComplaints && rawComplaints.length > 0) {
        const complaintIds = rawComplaints.map((c) => c.id);
        const { data: images } = await supabase
          .from('complaint_images')
          .select('*')
          .in('complaint_id', complaintIds);

        const complaintsWithImages = rawComplaints.map((c) => ({
          ...c,
          complaint_images: images?.filter((img) => img.complaint_id === c.id) || [],
        }));

        const map = new Map();
        [...complaintsWithImages, ...localComplaints].forEach((item) => {
          map.set(item.id, item);
        });
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        return { data: combined, error: null };
      }
    } catch (err) {
      console.warn('Supabase fetch error, returning local complaints:', err);
    }

    return { data: localComplaints, error: null };
  },

  /**
   * Fetch ALL system complaints for Admin Control Panel Dashboard
   */
  async fetchAllComplaints() {
    const localComplaints = getLocalComplaints(null);

    try {
      const { data: remoteData, error } = await supabase
        .from('complaints')
        .select(`
          *,
          complaint_images (
            id,
            image_url
          ),
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && remoteData) {
        const map = new Map();
        [...remoteData, ...localComplaints].forEach((item) => {
          map.set(item.id, item);
        });
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        return { data: combined, error: null };
      }

      const { data: rawComplaints } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (rawComplaints && rawComplaints.length > 0) {
        const complaintIds = rawComplaints.map((c) => c.id);
        const { data: images } = await supabase
          .from('complaint_images')
          .select('*')
          .in('complaint_id', complaintIds);

        const complaintsWithImages = rawComplaints.map((c) => ({
          ...c,
          complaint_images: images?.filter((img) => img.complaint_id === c.id) || [],
        }));

        const map = new Map();
        [...complaintsWithImages, ...localComplaints].forEach((item) => {
          map.set(item.id, item);
        });
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        return { data: combined, error: null };
      }
    } catch (err) {
      console.warn('Supabase fetchAllComplaints error, using local fallback:', err);
    }

    return { data: localComplaints, error: null };
  },

  /**
   * Update complaint status from Admin Control Panel
   */
  async updateComplaintStatus(complaintId, newStatus, oldStatus = 'Pending', adminId = null) {
    updateLocalComplaintStatus(complaintId, newStatus);

    try {
      const { data } = await supabase
        .from('complaints')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', complaintId)
        .select()
        .single();

      try {
        await supabase.from('status_history').insert([
          {
            complaint_id: complaintId,
            old_status: oldStatus,
            new_status: newStatus,
            updated_by: adminId || null,
          },
        ]);
      } catch (historyErr) {
        console.warn('Status history insert warning:', historyErr);
      }

      return { data: data || { id: complaintId, status: newStatus }, error: null };
    } catch (err) {
      console.warn('Supabase updateComplaintStatus network warning (updated locally):', err);
      return { data: { id: complaintId, status: newStatus }, error: null };
    }
  },

  /**
   * Fetch single complaint by ID
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
      return { data: null, error: err };
    }
  },
};
