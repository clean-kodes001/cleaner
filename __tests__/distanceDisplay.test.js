import {
  formatDistance,
  metersBetween,
  originDriftThresholdM,
  selectCleanerOrigin,
  APPROACH_DRIFT_M,
  FINAL_DRIFT_M,
  ORIGIN_DRIFT_M,
  POSITION_TTL_MS,
} from '../src/utils/distanceDisplay';

describe('formatDistance', () => {
  it('renders whole km at highway distances', () => {
    expect(formatDistance(119.66)).toBe('120 km');
  });

  it('renders one decimal between 1 and 10 km', () => {
    expect(formatDistance(4.23)).toBe('4.2 km');
  });

  it('renders metres below 1 km', () => {
    expect(formatDistance(0.45)).toBe('450 m');
  });

  it('promotes 999m to 1.0 km rather than rendering "1000 m"', () => {
    expect(formatDistance(0.999)).toBe('1.0 km');
  });

  it('promotes 9.96 km to whole km rather than rendering "10.0 km"', () => {
    expect(formatDistance(9.96)).toBe('10 km');
  });

  it('returns null for absent or nonsense input', () => {
    expect(formatDistance(null)).toBeNull();
    expect(formatDistance(undefined)).toBeNull();
    expect(formatDistance(NaN)).toBeNull();
    expect(formatDistance(-1)).toBeNull();
  });
});

describe('selectCleanerOrigin', () => {
  const activeCleaner = {
    user_id: 'cleaner-a',
    position: {lat: 50.4452, lng: -104.6189},
    created_at: '2026-07-16T14:25:00.000Z',
  };
  const acceptedMs = Date.parse(activeCleaner.created_at);

  it("uses the live broadcast when it belongs to this clean's cleaner", () => {
    const origin = selectCleanerOrigin({
      cleanersLocation: {
        id: 'cleaner-a',
        current_position: {lat: 50.5, lng: -104.7},
        at: 1000,
      },
      activeCleaner,
      nowMs: 1000,
    });
    expect(origin).toMatchObject({lat: 50.5, source: 'live', isStale: false});
  });

  it('ignores a broadcast from a DIFFERENT cleaner and falls back to the match position', () => {
    const origin = selectCleanerOrigin({
      cleanersLocation: {
        id: 'cleaner-b',
        current_position: {lat: 49.0, lng: -103.0},
        at: acceptedMs,
      },
      activeCleaner,
      nowMs: acceptedMs,
    });
    expect(origin).toMatchObject({lat: 50.4452, source: 'match'});
  });

  it('does not let device-vs-server clock skew mark a live feed stale', () => {
    // `at` is stamped with the device clock; created_at is a server timestamp. Folding
    // serverOffsetMs into the live comparison made an emulator whose clock trailed the
    // server by more than the TTL show "Updating cleaner's location..." permanently.
    const origin = selectCleanerOrigin({
      cleanersLocation: {
        id: 'cleaner-a',
        current_position: {lat: 50.5, lng: -104.7},
        at: 1000,
      },
      activeCleaner,
      nowMs: 2000,
      serverOffsetMs: 10 * POSITION_TTL_MS,
    });
    expect(origin).toMatchObject({source: 'live', isStale: false});
  });

  it('still ages the match fallback against server time', () => {
    // Same device clock, different offsets: a device running behind the server must not be
    // fooled into thinking an old accept is fresh.
    const base = {cleanersLocation: null, activeCleaner, nowMs: acceptedMs};
    expect(selectCleanerOrigin({...base, serverOffsetMs: 0}).isStale).toBe(false);
    expect(
      selectCleanerOrigin({...base, serverOffsetMs: 2 * POSITION_TTL_MS}).isStale,
    ).toBe(true);
  });

  it('flags a live position older than the TTL as stale', () => {
    const origin = selectCleanerOrigin({
      cleanersLocation: {
        id: 'cleaner-a',
        current_position: {lat: 50.5, lng: -104.7},
        at: 0,
      },
      activeCleaner,
      nowMs: POSITION_TTL_MS + 1,
    });
    expect(origin.isStale).toBe(true);
  });

  it('treats an untimestamped (persisted, pre-upgrade) broadcast as stale', () => {
    const origin = selectCleanerOrigin({
      cleanersLocation: {
        id: 'cleaner-a',
        current_position: {lat: 50.5, lng: -104.7},
      },
      activeCleaner,
      nowMs: acceptedMs,
    });
    expect(origin.isStale).toBe(true);
  });

  it('trusts the match position briefly after accept, then ages it off', () => {
    const base = {cleanersLocation: null, activeCleaner};
    expect(selectCleanerOrigin({...base, nowMs: acceptedMs + 1000}).isStale).toBe(
      false,
    );
    expect(
      selectCleanerOrigin({...base, nowMs: acceptedMs + POSITION_TTL_MS + 1}).isStale,
    ).toBe(true);
  });

  it('returns null when there is no usable coordinate at all', () => {
    expect(
      selectCleanerOrigin({cleanersLocation: null, activeCleaner: null, nowMs: 0}),
    ).toBeNull();
  });
});

describe('originDriftThresholdM', () => {
  it('uses the wide threshold on the open road', () => {
    expect(originDriftThresholdM(27)).toBe(ORIGIN_DRIFT_M);
  });

  it('tightens inside the approach range so the last stretch keeps ticking', () => {
    expect(originDriftThresholdM(0.4)).toBe(APPROACH_DRIFT_M);
  });

  it('tightens at exactly the approach boundary', () => {
    expect(originDriftThresholdM(1)).toBe(APPROACH_DRIFT_M);
    expect(originDriftThresholdM(1.001)).toBe(ORIGIN_DRIFT_M);
  });

  it('tightens again on the final stretch so both apps agree at the door', () => {
    expect(originDriftThresholdM(0.1)).toBe(FINAL_DRIFT_M);
    expect(originDriftThresholdM(0.02)).toBe(FINAL_DRIFT_M);
    expect(originDriftThresholdM(0.101)).toBe(APPROACH_DRIFT_M);
  });

  it('keeps every tier under the 50m arrival geofence', () => {
    expect(FINAL_DRIFT_M).toBeLessThan(50);
    expect(APPROACH_DRIFT_M).toBeLessThan(50);
  });

  it('falls back to the wide threshold before the first route resolves', () => {
    expect(originDriftThresholdM(null)).toBe(ORIGIN_DRIFT_M);
    expect(originDriftThresholdM(undefined)).toBe(ORIGIN_DRIFT_M);
    expect(originDriftThresholdM(NaN)).toBe(ORIGIN_DRIFT_M);
  });

  it('is tighter than the 50m arrival geofence, so the number moves before Arrive unlocks', () => {
    expect(APPROACH_DRIFT_M).toBeLessThan(50);
  });
});

describe('metersBetween', () => {
  it('measures the Regina->Weyburn great circle from BUG-1001', () => {
    // ~103 km. This is the number that must NEVER be formatted for display — the row shows
    // the ~119 km road distance. The assertion pins the value so a future refactor that
    // reroutes this helper into the display is caught by the "120 km" test above.
    expect(metersBetween(50.4452, -104.6189, 49.6611, -103.8525) / 1000).toBeCloseTo(
      103,
      0,
    );
  });
});
