import { Button } from "@/components/ui/button";
import { MapClusterLayer, MapControls, Map as MapGL, MapPopup } from "@/components/ui/map";
import { useCallback, useEffect, useRef, useState } from "react";

type MapListing = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  locationText: string | null;
  status: string;
};

type SelectedListing = MapListing & { coordinates: [number, number] };

type DiscoveryMapProps = {
  apiBase: string;
};

function listingsToGeoJSON(listings: MapListing[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: listings
      .filter((l) => l.lat != null && l.lng != null)
      .map((l) => ({
        type: "Feature" as const,
        properties: {
          id: l.id,
          title: l.title,
          locationText: l.locationText,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [l.lng, l.lat],
        },
      })),
  };
}

export function DiscoveryMap({ apiBase }: DiscoveryMapProps) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    listingsToGeoJSON([]),
  );
  const [selected, setSelected] = useState<SelectedListing | null>(null);
  const [userCoords, setUserCoords] = useState<{ longitude: number; latitude: number } | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const pendingUserFocusRef = useRef<{ longitude: number; latitude: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;

    const syncMapRef = () => {
      if (cancelled) return;
      if (mapRef.current) {
        setMapInstance(mapRef.current);
        return;
      }
      rafId = window.requestAnimationFrame(syncMapRef);
    };

    syncMapRef();

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const focusMapOnUser = useCallback(
    (coords: { longitude: number; latitude: number }) => {
      const map = mapInstance;
      if (!map) {
        pendingUserFocusRef.current = coords;
        return;
      }

      pendingUserFocusRef.current = null;
      map.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: Math.max(map.getZoom(), 11),
        duration: 700,
      });
    },
    [mapInstance],
  );

  const fetchListings = useCallback(
    async (bounds?: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => {
      const url = new URL(`${apiBase}/listings/map`);
      if (bounds) {
        url.searchParams.set(
          "bbox",
          `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`,
        );
      }
      try {
        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { listings: MapListing[] };
        setGeojson(listingsToGeoJSON(data.listings));
      } catch {
        // silently fail
      }
    },
    [apiBase],
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        };
        setUserCoords(coords);
        focusMapOnUser(coords);
      },
      () => {
        // keep national default view when permission is denied
      },
      { timeout: 7000 },
    );
  }, [focusMapOnUser]);

  useEffect(() => {
    const pending = pendingUserFocusRef.current;
    if (!pending || !mapInstance) return;
    focusMapOnUser(pending);
  }, [mapInstance, focusMapOnUser]);

  const handleViewportChange = useCallback(() => {
    const map = mapInstance;
    if (!map) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const bounds = map.getBounds();
      fetchListings({
        minLng: bounds.getWest(),
        minLat: bounds.getSouth(),
        maxLng: bounds.getEast(),
        maxLat: bounds.getNorth(),
      });
    }, 400);
  }, [fetchListings, mapInstance]);

  useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    map.on("moveend", handleViewportChange);
    return () => {
      map.off("moveend", handleViewportChange);
    };
  }, [mapInstance, handleViewportChange]);

  useEffect(() => {
    const focusHandler = (event: Event) => {
      const map = mapInstance;
      if (!map) return;

      const customEvent = event as CustomEvent<{
        id: string;
        title: string;
        locationText: string | null;
        lat: number;
        lng: number;
      }>;
      const detail = customEvent.detail;
      if (!detail) return;

      map.flyTo({
        center: [detail.lng, detail.lat],
        zoom: Math.max(map.getZoom(), 14),
        duration: 700,
      });

      window.dispatchEvent(
        new CustomEvent("listing-selected-on-map", {
          detail: { id: detail.id },
        }),
      );

      setSelected({
        id: detail.id,
        title: detail.title,
        locationText: detail.locationText,
        lat: detail.lat,
        lng: detail.lng,
        status: "published",
        coordinates: [detail.lng, detail.lat],
      });
    };

    window.addEventListener("focus-listing-on-map", focusHandler as EventListener);
    return () => {
      window.removeEventListener("focus-listing-on-map", focusHandler as EventListener);
    };
  }, [mapInstance]);

  useEffect(() => {
    const userFocusHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ lat: number; lng: number }>;
      const detail = customEvent.detail;
      if (!detail) return;

      const coords = {
        latitude: detail.lat,
        longitude: detail.lng,
      };
      setUserCoords(coords);
      focusMapOnUser(coords);
    };

    window.addEventListener("focus-user-location", userFocusHandler as EventListener);
    return () => {
      window.removeEventListener("focus-user-location", userFocusHandler as EventListener);
    };
  }, [focusMapOnUser]);

  const handlePointClick = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point>, coordinates: [number, number]) => {
      const props = feature.properties as {
        id: string;
        title: string;
        locationText: string | null;
      };
      setSelected({
        id: props.id,
        title: props.title,
        lat: coordinates[1],
        lng: coordinates[0],
        locationText: props.locationText,
        status: "published",
        coordinates,
      });
      window.dispatchEvent(
        new CustomEvent("listing-selected-on-map", {
          detail: { id: props.id },
        }),
      );
    },
    [],
  );

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-lg border">
      <MapGL
        ref={mapRef}
        center={userCoords ? [userCoords.longitude, userCoords.latitude] : [-98.5795, 39.8283]}
        zoom={userCoords ? 12 : 4}
      >
        <MapClusterLayer
          data={geojson}
          clusterRadius={60}
          clusterMaxZoom={14}
          clusterThresholds={[10, 50]}
          onPointClick={handlePointClick}
        />

        {selected && (
          <MapPopup
            longitude={selected.coordinates[0]}
            latitude={selected.coordinates[1]}
            onClose={() => setSelected(null)}
            closeButton
          >
            <div className="min-w-[180px] space-y-2">
              <h3 className="text-sm font-semibold">{selected.title}</h3>
              {selected.locationText && (
                <p className="text-xs text-muted-foreground">{selected.locationText}</p>
              )}
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href={`/listings/${selected.id}`}>View Details</a>
              </Button>
            </div>
          </MapPopup>
        )}

        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          showFullscreen
          onLocate={(coords) => setUserCoords(coords)}
        />
      </MapGL>
    </div>
  );
}
