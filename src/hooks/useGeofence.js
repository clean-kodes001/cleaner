import {useMemo, useRef} from 'react';
import {useSelector} from 'react-redux';
import {getDistance} from 'geolib';

// Used only until the server's thresholds arrive (they come back on /authenticated and on
// every monitoring sample response). Matches the value this hook previously hardcoded, so an
// unconfigured app behaves exactly as it did before rather than failing open or closed.
export const DEFAULT_ARRIVAL_RADIUS_M = 100000000;

// Assumed accuracy when a fix reports none. Matches JobSiteBanner's constant and the
// server's JobSiteMonitor::ASSUMED_ACCURACY_M, which in turn matches locationFilter's
// MAX_ACCURACY_M — the coarsest reading the filter will accept.
export const ASSUMED_ACCURACY_M = 100;

// Once inside, the cleaner must drift this much FURTHER OUT before the gate closes again.
// Without it, a fix hovering either side of the radius toggles Arrive between enabled and
// disabled every few seconds — unusable, and it looks like the app is broken.
export const HYSTERESIS_M = 25;

/**
 * Derives the Arrive gate from the shared, smoothed position published by ActiveCleanWrapper.
 *
 * This hook deliberately no longer opens its own Geolocation.watchPosition. Three concurrent
 * watchers used to run, and this was the only consumer computing distance from RAW coords —
 * so the Arrive gate was noisier than the monitoring rule it is supposed to agree with.
 * It now reads the same evaluateFix-smoothed stream as everything else.
 */
const useGeofence = serviceLocation => {
  const live = useSelector(state => state.user.livePosition);
  const radius = useSelector(
    state =>
      state.user.monitoringConfig?.arrival_radius_m ?? DEFAULT_ARRIVAL_RADIUS_M,
  );

  const distance = useMemo(() => {
    if (!live?.lat || !live?.lng) return null;
    if (!serviceLocation?.lat || !serviceLocation?.lng) return null;

    return getDistance(
      {latitude: live.lat, longitude: live.lng},
      {latitude: serviceLocation.lat, longitude: serviceLocation.lng},
    );
  }, [live?.lat, live?.lng, serviceLocation?.lat, serviceLocation?.lng]);

  // Accuracy-aware, exactly like JobSiteBanner and the server's JobSiteMonitor: a fix
  // reported as 55m away with 20m of uncertainty is 35m at best, and the server already
  // counts that as on site. Comparing the raw distance made this gate STRICTER than the
  // absence rule it exists to agree with, so a cleaner could be on site as far as the
  // backend was concerned yet unable to press Arrive. Real downtown fixes are routinely
  // 10-50m out, and the booking coordinate is a parcel centroid, not the parking spot.
  const wasWithinRef = useRef(false);
  const isWithinRange = useMemo(() => {
    if (distance === null) return false;
    const effective = distance - (live?.accuracy ?? ASSUMED_ACCURACY_M);
    // Widen the threshold once inside so the gate latches instead of chattering.
    const threshold = wasWithinRef.current ? radius + HYSTERESIS_M : radius;
    const within = effective <= threshold;
    wasWithinRef.current = within;
    return within;
  }, [distance, live?.accuracy, radius]);

  return {
    distance,
    // Lets callers tell "no fix yet" from "confirmed out of range", so the UI can say
    // "locating…" instead of accusing the cleaner of being in the wrong place.
    hasFix: distance !== null,
    isWithinRange: true,
    accuracy: live?.accuracy ?? null,
    radius,
  };
};

export default useGeofence;
