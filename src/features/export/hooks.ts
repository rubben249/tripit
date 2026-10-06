import { useState } from 'react';
import { Platform } from 'react-native';

import { useBookings, useCities, useItineraryDays } from '@/features/itinerary/hooks';
import { useTrip } from '@/features/trips/hooks';

import { buildDocxBlob } from './docx';
import { buildTripDocument, documentFileName } from './tripDocument';

/** Hands the finished file to the browser as a download. Native builds have no file picker here —
 * the app is used as a web app/PWA for now, same as the map. */
function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function useExportTripDocument(tripId: string) {
  const { data: trip } = useTrip(tripId);
  const { data: days } = useItineraryDays(tripId);
  const { data: cities } = useCities(tripId);
  const { data: bookings } = useBookings(tripId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const supported = Platform.OS === 'web';

  const exportDocument = async () => {
    if (!trip || !supported) return;
    setBusy(true);
    setError('');
    try {
      const doc = buildTripDocument(trip, days ?? [], cities ?? [], bookings ?? []);
      download(await buildDocxBlob(doc), documentFileName(trip.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The document could not be created.');
    } finally {
      setBusy(false);
    }
  };

  return { exportDocument, busy, error, supported };
}
