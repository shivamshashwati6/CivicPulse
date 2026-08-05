import { supabase } from './supabaseClient';

/**
 * Deterministically convert any user ID or string into a valid PostgreSQL UUID v4 format
 */
function toValidUuid(idStr) {
  if (!idStr) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idStr)) {
    return idStr;
  }
  let hex = '';
  for (let i = 0; i < idStr.length; i++) {
    hex += idStr.charCodeAt(i).toString(16);
  }
  hex = (hex + '00000000000000000000000000000000').substring(0, 32);
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-4${hex.substring(13, 16)}-a${hex.substring(17, 20)}-${hex.substring(20, 32)}`;
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
   * Upload complaint photo to Supabase Storage bucket "complaints" with permanent base64 fallback
   */
  async uploadComplaintImage(file, userId) {
    if (!file) return { publicUrl: null, error: null };

    try {
      const validUserId = toValidUuid(userId);
      const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
      const fileName = `${validUserId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('complaints')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload warning, encoding photo to base64 fallback:', error);
        const base64Url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
        return { publicUrl: base64Url || URL.createObjectURL(file), error: null };
      }

      const { data: publicUrlData } = supabase.storage
        .from('complaints')
        .getPublicUrl(data.path);

      return { publicUrl: publicUrlData.publicUrl, error: null };
    } catch (err) {
      console.warn('Failed to upload image to Supabase storage, encoding base64:', err);
      const base64Url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      return { publicUrl: base64Url || URL.createObjectURL(file), error: null };
    }
  },

  /**
   * Create a new complaint record directly in Supabase PostgreSQL DB
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
    try {
      const validUserId = toValidUuid(userId);

      // Step 1: Ensure user profile row exists in public.profiles table (catch non-fatal errors)
      try {
        await supabase.from('profiles').upsert(
          [
            {
              id: validUserId,
              email: userEmail,
              full_name: userName,
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
            user_id: validUserId,
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
        console.error('Supabase DB complaint insert error:', complaintError);
        return { data: null, error: complaintError };
      }

      const insertedRecord = Array.isArray(complaintData) ? complaintData[0] : complaintData;

      // Step 3: Insert image record into public.complaint_images
      if (imageUrl && insertedRecord?.id) {
        try {
          await supabase.from('complaint_images').insert([
            {
              complaint_id: insertedRecord.id,
              image_url: imageUrl,
            },
          ]);
        } catch (imgErr) {
          console.warn('Image record insert warning:', imgErr);
        }
      }

      return { data: insertedRecord, error: null };
    } catch (err) {
      console.error('Error creating complaint in Supabase:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Delete a complaint by ID directly in Supabase
   */
  async deleteComplaint(complaintId) {
    try {
      // 1. Delete complaint images
      try {
        await supabase.from('complaint_images').delete().eq('complaint_id', complaintId);
      } catch (imgErr) {
        console.warn('Complaint images delete warning:', imgErr);
      }

      // 2. Delete complaint record from Supabase complaints table
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaintId);

      if (error) {
        console.error('Supabase delete complaint error:', error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('Supabase deleteComplaint exception:', err);
      return { error: err };
    }
  },

  /**
   * Fetch user complaints directly from Supabase DB
   */
  async fetchUserComplaints(userId) {
    try {
      const validUserId = toValidUuid(userId);

      // Primary Attempt: Embedded join query
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
        return { data: remoteData, error: null };
      }

      // Fallback Attempt: Direct query without join
      const { data: rawComplaints, error: rawError } = await supabase
        .from('complaints')
        .select('*')
        .or(`user_id.eq.${validUserId},user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (rawError) throw rawError;

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

        return { data: complaintsWithImages, error: null };
      }

      return { data: rawComplaints || [], error: null };
    } catch (err) {
      console.error('Error fetching user complaints from Supabase:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Fetch ALL system complaints directly from Supabase DB for Admin Control Panel
   */
  async fetchAllComplaints() {
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
        return { data: remoteData, error: null };
      }

      // Fallback query without embedded profiles join
      const { data: rawComplaints, error: rawError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (rawError) throw rawError;

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

        return { data: complaintsWithImages, error: null };
      }

      return { data: rawComplaints || [], error: null };
    } catch (err) {
      console.error('Error fetching all complaints from Supabase:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Update complaint status directly in Supabase DB
   */
  async updateComplaintStatus(complaintId, newStatus, oldStatus = 'Pending', adminId = null) {
    try {
      const validAdminId = adminId ? toValidUuid(adminId) : null;
      const { data, error } = await supabase
        .from('complaints')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', complaintId)
        .select();

      if (error) {
        console.error('Supabase updateComplaintStatus error:', error);
        return { data: null, error };
      }

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

      return { data, error: null };
    } catch (err) {
      console.error('Supabase updateComplaintStatus exception:', err);
      return { data: null, error: err };
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
