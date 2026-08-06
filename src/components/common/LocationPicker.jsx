import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2, CheckCircle2, Compass, AlertCircle, Search } from 'lucide-react';
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
  initialAddress,
  onChange,
  onLocationSelect,
  disabled = false,
}) {
  const toast = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [activeTab, setActiveTab] = useState('gps');
  const [permissionBlockedAlert, setPermissionBlockedAlert] = useState(false);

  // Address search query state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Unified callback handler for parent component compatibility (onChange or onLocationSelect)
  const notifyParentLocationChange = useCallback(
    (locData) => {
      if (onChange) {
        onChange(locData);
      }
      if (onLocationSelect) {
        onLocationSelect(locData);
      }
    },
    [onChange, onLocationSelect]
  );

  // Current display coordinates
  const currentLat = latitude !== null && latitude !== undefined ? latitude : 28.6139;
  const currentLng = longitude !== null && longitude !== undefined ? longitude : 77.2090;
  const displayAddress = address || initialAddress || 'New Delhi, India';
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

      notifyParentLocationChange({
        latitude: lat,
        longitude: lng,
        address: newAddress,
      });

      if (notifySuccess) {
        toast.success('Location address updated');
      }
    },
    [notifyParentLocationChange, toast]
  );

  /**
   * Fallback IP location lookup when browser GPS is blocked or unavailable
   */
  const fallbackToIpLocation = useCallback(async () => {
    const ipLoc = await issueService.fetchIpLocation();
    if (ipLoc?.latitude && ipLoc?.longitude) {
      await handleUpdateCoordinates(ipLoc.latitude, ipLoc.longitude, false);
      toast.info('Approximate location detected via network IP. Click map to refine.');
    } else {
      await handleUpdateCoordinates(currentLat, currentLng, false);
      toast.info('Default city location set. Click map or search place name.');
    }
    setIsLocating(false);
  }, [currentLat, currentLng, handleUpdateCoordinates, toast]);

  /**
   * 📍 Core GPS Detection Handler
   */
  const handleUseCurrentLocation = useCallback(
    (showToastOnSuccess = true) => {
      setActiveTab('gps');
      setPermissionBlockedAlert(false);

      if (!navigator.geolocation) {
        toast.info('Geolocation not supported by browser. Selected fallback location.');
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
          if (showToastOnSuccess) {
            toast.success('GPS location detected successfully!');
          }
          await handleUpdateCoordinates(lat, lng, false);
        },
        async (err) => {
          console.warn('Geolocation access error, switching to IP location fallback:', err);
          setIsLocating(false);

          if (err.code === err.PERMISSION_DENIED) {
            setPermissionBlockedAlert(true);
            toast.error('Location permission denied. Using estimated location fallback.');
          } else {
            toast.info('GPS signal weak. Using estimated location fallback — click map to refine.');
          }
          await fallbackToIpLocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    },
    [fallbackToIpLocation, handleUpdateCoordinates, toast]
  );

  // Auto-detect location on initial mount if latitude/longitude not passed
  useEffect(() => {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      handleUseCurrentLocation(false);
    }
  }, [latitude, longitude, handleUseCurrentLocation]);

  /**
   * Search place name / address text geocoding
   */
  const handleSearchPlace = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingAddress(true);
    const geocoded = await issueService.geocodeAddress(searchQuery.trim());
    setIsSearchingAddress(false);

    if (geocoded && geocoded.latitude && geocoded.longitude) {
      setActiveTab('map');
      notifyParentLocationChange({
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        address: geocoded.address,
      });
      toast.success(`Found location for "${searchQuery.trim()}"`);
    } else {
      toast.error(`Could not find coordinates for "${searchQuery.trim()}". Try a different landmark.`);
    }
  };

  /**
   * Marker drag event handler
   */
  const handleMarkerDragEnd = async () => {
    if (markerRef.current) {
      const { lat, lng } = markerRef.current.getLatLng();
      setActiveTab('map');
      await handleUpdateCoordinates(lat, lng, true);
    }
  };

  /**
   * Map click event handler
   */
  const handleMapClick = async (lat, lng) => {
    setActiveTab('map');
    await handleUpdateCoordinates(lat, lng, true);
  };

  return (
    <div className="space-y-4 text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Option Selection Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/70 transition-colors">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant={activeTab === 'gps' ? 'default' : 'outline'}
            onClick={() => handleUseCurrentLocation(true)}
            disabled={disabled || isLocating}
            className={`flex-1 sm:flex-initial text-xs font-semibold py-2 px-4 ${
              activeTab === 'gps'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
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
                📍 Auto-Detect GPS Location
              </>
            )}
          </Button>

          <Button
            type="button"
            variant={activeTab === 'map' ? 'default' : 'outline'}
            onClick={() => setActiveTab('map')}
            disabled={disabled}
            className={`flex-1 sm:flex-initial text-xs font-semibold py-2 px-4 ${
              activeTab === 'map'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            🗺️ Select on Map
          </Button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 self-end sm:self-center">
          {isGeocoding || isSearchingAddress ? (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
              <Loader2 className="w-3 h-3 animate-spin" /> Fetching location...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Location Tagged
            </span>
          )}
        </div>
      </div>

      {/* Place Search Bar */}
      <form onSubmit={handleSearchPlace} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Type city, street, or landmark name (e.g. Connaught Place)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>
        <Button
          type="submit"
          disabled={disabled || isSearchingAddress || !searchQuery.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 font-semibold shrink-0"
        >
          {isSearchingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search Place'}
        </Button>
      </form>

      {/* Permission Blocked Guidance Alert */}
      {permissionBlockedAlert && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Browser Location Permission Needed</p>
            <p className="text-amber-700 dark:text-amber-200/80 leading-relaxed">
              GPS location permission is blocked in your browser. We have estimated your location on the map. You can also search any place name above or click directly on the map.
            </p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 pt-0.5 font-mono">
              To enable GPS: Click lock icon in browser bar &gt; Site Settings &gt; Location &gt; Allow.
            </p>
          </div>
        </div>
      )}

      {/* Formatted Address Input */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Selected Location Address <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Input
            value={displayAddress}
            readOnly
            placeholder="Address will automatically appear here when location is selected..."
            className="bg-slate-50 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pr-10 cursor-not-allowed font-medium text-xs sm:text-sm"
          />
          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Responsive Interactive Leaflet Map */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs z-0">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '300px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <MapRecenter center={position} zoom={15} />
          <MapEventsHandler onLocationChange={handleMapClick} />
          <Marker
            position={position}
            draggable={!disabled}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            ref={markerRef}
          />
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] border border-slate-200 dark:border-slate-700 font-medium shadow-xs">
          💡 Click map or drag marker to select exact position
        </div>
      </div>

      {/* Latitude and Longitude Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 dark:bg-slate-950 dark:border dark:border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span><strong className="text-blue-400">LAT:</strong> {currentLat.toFixed(6)}</span>
          <span><strong className="text-blue-400">LNG:</strong> {currentLng.toFixed(6)}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-sans">OpenStreetMap GIS Metadata</span>
      </div>
    </div>
  );
}
