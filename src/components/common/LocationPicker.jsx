import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2, CheckCircle2, Compass, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { issueService } from '../../services/issueService';
import { useToast } from '../../hooks/useToast';

// Fix Leaflet default marker icon paths in bundled applications
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to center map programmatically when position changes
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 15, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Helper component to capture map clicks and drag events
function MapEventsHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
    },
  });
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  address,
  onChange,
  disabled = false,
}) {
  const toast = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [activeTab, setActiveTab] = useState('gps');
  const [permissionBlockedAlert, setPermissionBlockedAlert] = useState(false);

  // Default fallback center (New Delhi) if coordinates not set yet
  const currentLat = latitude !== null && latitude !== undefined ? latitude : 28.6139;
  const currentLng = longitude !== null && longitude !== undefined ? longitude : 77.2090;
  const position = [currentLat, currentLng];

  const markerRef = useRef(null);

  /**
   * Reverse geocode helper to update address and notify parent
   */
  const handleUpdateCoordinates = useCallback(
    async (lat, lng, notifySuccess = true) => {
      setIsGeocoding(true);
      const res = await issueService.reverseGeocode(lat, lng);
      setIsGeocoding(false);

      const newAddress = res.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      if (onChange) {
        onChange({
          latitude: lat,
          longitude: lng,
          address: newAddress,
        });
      }

      if (notifySuccess) {
        toast.success('Address fetched successfully');
      }
    },
    [onChange, toast]
  );

  /**
   * Fallback IP location lookup when browser GPS is blocked or unavailable
   */
  const fallbackToIpLocation = async () => {
    const ipLoc = await issueService.fetchIpLocation();
    if (ipLoc?.latitude && ipLoc?.longitude) {
      await handleUpdateCoordinates(ipLoc.latitude, ipLoc.longitude, false);
      toast.info('Approximate location set via IP. Click map to refine your pin.');
    } else {
      await handleUpdateCoordinates(currentLat, currentLng, false);
      toast.info('Default location set. Please click on the map to pick your exact position.');
    }
    setIsLocating(false);
    setActiveTab('map');
  };

  /**
   * Option A: 📍 Use My Current Location
   */
  const handleUseCurrentLocation = () => {
    setActiveTab('gps');
    setPermissionBlockedAlert(false);

    if (!navigator.geolocation) {
      toast.info('Geolocation not supported. Selected location on map.');
      fallbackToIpLocation();
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setIsLocating(false);
        setPermissionBlockedAlert(false);
        toast.success('Location detected successfully');
        await handleUpdateCoordinates(lat, lng, true);
      },
      async (err) => {
        console.warn('Geolocation access error, switching to IP location fallback:', err);
        setIsLocating(false);

        if (err.code === err.PERMISSION_DENIED) {
          setPermissionBlockedAlert(true);
          toast.error('Location permission denied. Switching to location fallback.');
        } else {
          toast.info('GPS signal unavailable. Using location fallback — click map to refine.');
        }
        await fallbackToIpLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  /**
   * Option B: Marker drag event handler
   */
  const handleMarkerDragEnd = async () => {
    if (markerRef.current) {
      const { lat, lng } = markerRef.current.getLatLng();
      setActiveTab('map');
      await handleUpdateCoordinates(lat, lng, true);
    }
  };

  /**
   * Option B: Map click event handler
   */
  const handleMapClick = async (lat, lng) => {
    setActiveTab('map');
    await handleUpdateCoordinates(lat, lng, true);
  };

  return (
    <div className="space-y-4">
      {/* Option Selection Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant={activeTab === 'gps' ? 'default' : 'outline'}
            onClick={handleUseCurrentLocation}
            disabled={disabled || isLocating}
            className={`flex-1 sm:flex-initial text-xs font-semibold py-2 px-4 ${
              activeTab === 'gps' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-gray-700'
            }`}
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Detecting GPS...
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                📍 Use My Current Location
              </>
            )}
          </Button>

          <Button
            type="button"
            variant={activeTab === 'map' ? 'default' : 'outline'}
            onClick={() => setActiveTab('map')}
            disabled={disabled}
            className={`flex-1 sm:flex-initial text-xs font-semibold py-2 px-4 ${
              activeTab === 'map' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-gray-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            🗺️ Select on Map
          </Button>
        </div>

        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 self-end sm:self-center">
          {isGeocoding ? (
            <span className="flex items-center gap-1 text-blue-600 font-semibold">
              <Loader2 className="w-3 h-3 animate-spin" /> Fetching address...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Location Ready
            </span>
          )}
        </div>
      </div>

      {/* Permission Blocked Guidance Alert */}
      {permissionBlockedAlert && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-800">Browser Location Permission is Blocked</p>
            <p className="text-amber-700 leading-relaxed">
              Your browser has blocked location access for this site. We have automatically estimated your position on the map below.
            </p>
            <p className="text-[11px] text-amber-800/80 pt-0.5">
              💡 <strong>To allow device GPS:</strong> Click the Tune/Lock icon (🎛️ or 🔒) in your browser address bar next to <code>localhost:5173</code> &gt; Site Settings &gt; Location &gt; Allow.
            </p>
          </div>
        </div>
      )}

      {/* Read-Only Formatted Address Input */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-gray-700">
          Selected Location Address <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Input
            value={address || ''}
            readOnly
            placeholder="Address will automatically appear here when location is selected..."
            className="bg-gray-50/80 border-gray-300 text-gray-900 pr-10 cursor-not-allowed font-medium text-xs sm:text-sm"
          />
          <MapPin className="w-4 h-4 text-blue-600 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Responsive Interactive Leaflet Map */}
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0">
        <MapContainer
          center={position}
          zoom={latitude && longitude ? 15 : 12}
          scrollWheelZoom={false}
          style={{ height: '300px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <MapRecenter center={position} zoom={latitude && longitude ? 16 : 12} />
          <MapEventsHandler onLocationChange={handleMapClick} />
          <Marker
            position={position}
            draggable={!disabled}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            ref={markerRef}
          />
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] text-gray-600 border border-gray-200 font-medium">
          💡 Click map or drag marker to select exact position
        </div>
      </div>

      {/* Latitude and Longitude Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span><strong className="text-blue-400">LAT:</strong> {latitude !== null && latitude !== undefined ? latitude.toFixed(6) : 'Not set'}</span>
          <span><strong className="text-blue-400">LNG:</strong> {longitude !== null && longitude !== undefined ? longitude.toFixed(6) : 'Not set'}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-sans">OpenStreetMap GIS Metadata</span>
      </div>
    </div>
  );
}
