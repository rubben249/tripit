import { listCitiesWithoutLocation, setCityLocation } from '@/features/itinerary/api';
import { searchPlaces, type Place } from '@/lib/geocoding';

/** Best-effort lookup for a typed city name: the top search result, or null when offline or when
 * nothing matches. Callers store the city either way — coordinates can be filled in later. */
export async function locateCity(name: string): Promise<Place | null> {
  try {
    const [top] = await searchPlaces(name, 1);
    return top ?? null;
  } catch {
    return null;
  }
}

/** Fills in coordinates for cities that don't have them yet, one request at a time to stay well
 * inside Open-Meteo's free-tier rate limits. Returns how many cities got a location. */
export async function geocodeMissingCities(): Promise<number> {
  const cities = await listCitiesWithoutLocation();
  let located = 0;
  for (const city of cities) {
    const place = await locateCity(city.name);
    if (!place) continue;
    await setCityLocation(city.id, {
      lat: place.lat,
      lng: place.lng,
      countryCode: place.countryCode,
    });
    located++;
  }
  return located;
}
