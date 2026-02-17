const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export type GeocodingResult = {
  lat: number;
  lng: number;
  displayName: string;
};

export type ReverseGeocodingResult = {
  displayName: string;
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
};

/** Forward geocode: address text -> coordinates */
export async function geocodeAddress(query: string): Promise<GeocodingResult[]> {
  const url = new URL("/search", NOMINATIM_BASE);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "HiddenGemsApp/1.0" },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  return data.map((item) => ({
    lat: Number.parseFloat(item.lat),
    lng: Number.parseFloat(item.lon),
    displayName: item.display_name,
  }));
}

/** Reverse geocode: coordinates -> address text */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodingResult | null> {
  const url = new URL("/reverse", NOMINATIM_BASE);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "HiddenGemsApp/1.0" },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    display_name?: string;
    address?: {
      road?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      country?: string;
      postcode?: string;
    };
    error?: string;
  };

  if (data.error) return null;

  return {
    displayName: data.display_name ?? "",
    address: {
      road: data.address?.road,
      city: data.address?.city ?? data.address?.town ?? data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      postcode: data.address?.postcode,
    },
  };
}
