import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapControls, Map as MapGL, MapMarker, MarkerContent } from "@/components/ui/map";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoding";
import { MapPin, Search } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type LocationPickerProps = {
  pickerId?: string;
  latFieldName?: string;
  lngFieldName?: string;
  locationTextFieldName?: string;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationChange?: (location: {
    lat: number;
    lng: number;
    locationText: string;
  }) => void;
};

export function LocationPicker({
  pickerId,
  latFieldName = "lat",
  lngFieldName = "lng",
  locationTextFieldName = "locationText",
  initialLat,
  initialLng,
  initialAddress,
  onLocationChange,
}: LocationPickerProps) {
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [address, setAddress] = useState(initialAddress ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ lat: number; lng: number; displayName: string }>
  >([]);
  const fieldIdPrefix = pickerId ?? useId().replace(/:/g, "");
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  useEffect(() => {
    if (lat != null && lng != null && address) {
      onLocationChangeRef.current?.({ lat, lng, locationText: address });
    }
  }, [lat, lng, address]);

  useEffect(() => {
    if (!pickerId) {
      return;
    }

    const eventName = `location-picker:set:${pickerId}`;
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        lat?: number;
        lng?: number;
        locationText?: string;
      }>;
      const nextLat = Number(customEvent.detail?.lat);
      const nextLng = Number(customEvent.detail?.lng);
      if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
        setLat(nextLat);
        setLng(nextLng);
        mapRef.current?.flyTo({ center: [nextLng, nextLat], zoom: 14, duration: 700 });
      }

      if (typeof customEvent.detail?.locationText === "string") {
        setAddress(customEvent.detail.locationText);
      }
    };

    window.addEventListener(eventName, handler as EventListener);
    return () => window.removeEventListener(eventName, handler as EventListener);
  }, [pickerId]);

  const handleMapClick = useCallback(async (e: maplibregl.MapMouseEvent) => {
    const { lng: clickLng, lat: clickLat } = e.lngLat;
    setLat(clickLat);
    setLng(clickLng);
    setSuggestions([]);

    const result = await reverseGeocode(clickLat, clickLng);
    if (result) {
      setAddress(result.displayName);
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [handleMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) {
      return;
    }

    const center = map.getCenter();
    const lngDelta = Math.abs(center.lng - lng);
    const latDelta = Math.abs(center.lat - lat);
    if (lngDelta < 1e-6 && latDelta < 1e-6) {
      return;
    }

    map.flyTo({ center: [lng, lat], duration: 500, essential: true });
  }, [lat, lng]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await geocodeAddress(searchQuery);
      setSuggestions(results);
      if (results.length > 0) {
        const first = results[0];
        setLat(first.lat);
        setLng(first.lng);
        setAddress(first.displayName);
        mapRef.current?.flyTo({
          center: [first.lng, first.lat],
          zoom: 15,
          duration: 1200,
        });
      }
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSuggestionClick = useCallback(
    (suggestion: { lat: number; lng: number; displayName: string }) => {
      setLat(suggestion.lat);
      setLng(suggestion.lng);
      setAddress(suggestion.displayName);
      setSuggestions([]);
      mapRef.current?.flyTo({
        center: [suggestion.lng, suggestion.lat],
        zoom: 15,
        duration: 1200,
      });
    },
    [],
  );

  const handleDragEnd = useCallback(async (lngLat: { lng: number; lat: number }) => {
    setLat(lngLat.lat);
    setLng(lngLat.lng);
    const result = await reverseGeocode(lngLat.lat, lngLat.lng);
    if (result) {
      setAddress(result.displayName);
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          {suggestions.length > 1 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
              {suggestions.map((s, i) => (
                <button
                  type="button"
                  key={`${s.lat}-${s.lng}-${i}`}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s.displayName}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="button" variant="secondary" onClick={handleSearch} disabled={searching}>
          <Search className="mr-1 h-4 w-4" />
          {searching ? "..." : "Search"}
        </Button>
      </div>

      <div className="relative h-[300px] w-full overflow-hidden rounded-md border">
        <MapGL
          ref={mapRef}
          center={lat != null && lng != null ? [lng, lat] : [-98.5795, 39.8283]}
          zoom={lat != null ? 14 : 4}
        >
          {lat != null && lng != null && (
            <MapMarker longitude={lng} latitude={lat} draggable onDragEnd={handleDragEnd}>
              <MarkerContent>
                <MapPin className="h-6 w-6 -translate-y-1/2 text-primary drop-shadow-md" />
              </MarkerContent>
            </MapMarker>
          )}
          <MapControls position="bottom-right" showZoom showLocate />
        </MapGL>
      </div>

      {address && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Address:</span> {address}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${fieldIdPrefix}-lat`}>Latitude</Label>
          <Input
            id={`${fieldIdPrefix}-lat`}
            type="number"
            step="any"
            value={lat ?? ""}
            onChange={(e) => {
              if (e.target.value.trim() === "") {
                setLat(null);
                return;
              }
              const v = Number.parseFloat(e.target.value);
              if (Number.isFinite(v)) setLat(v);
            }}
            placeholder="Latitude"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${fieldIdPrefix}-lng`}>Longitude</Label>
          <Input
            id={`${fieldIdPrefix}-lng`}
            type="number"
            step="any"
            value={lng ?? ""}
            onChange={(e) => {
              if (e.target.value.trim() === "") {
                setLng(null);
                return;
              }
              const v = Number.parseFloat(e.target.value);
              if (Number.isFinite(v)) setLng(v);
            }}
            placeholder="Longitude"
          />
        </div>
      </div>

      <input type="hidden" name={latFieldName} value={lat ?? ""} />
      <input type="hidden" name={lngFieldName} value={lng ?? ""} />
      <input type="hidden" name={locationTextFieldName} value={address} />
    </div>
  );
}
