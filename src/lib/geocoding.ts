/**
 * City search via Open-Meteo's geocoding API (GeoNames data) — free, no API key, no card, and
 * CORS-open so the web app can call it straight from the browser (see CLAUDE.md "Regla de coste
 * cero"). Results come ordered by relevance/population, so the first hit for "Rome" is Rome, Italy.
 */
export interface Place {
  id: number;
  name: string;
  /** Region/state, e.g. "Lazio" — what tells Rome (IT) from Rome (Georgia, US) in a list. */
  region: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number;
  lng: number;
}

interface OpenMeteoResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
}

export async function searchPlaces(query: string, count = 5): Promise<Place[]> {
  const name = query.trim();
  if (name.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=${count}&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = (await res.json()) as { results?: OpenMeteoResult[] };
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1 ?? null,
    country: r.country ?? null,
    countryCode: r.country_code?.toUpperCase() ?? null,
    lat: r.latitude,
    lng: r.longitude,
  }));
}

export function describePlace(place: Place): string {
  return [place.name, place.region, place.country].filter(Boolean).join(', ');
}
