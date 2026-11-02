import {parseDateOnly, formatDateOnly, parseTimeOnly} from '../src/utils/dateOnly';

// Node resolves the local zone once, at process start — mutating process.env.TZ mid-run does
// nothing. So these assertions are written to hold in WHATEVER zone the runner is pinned to, and
// `npm run test:tz` re-runs the file once per zone with TZ set at process start. Where an
// assertion genuinely depends on the sign of the offset, it branches on `BEHIND_UTC` rather than
// hard-coding a zone.
//
// `toLocaleDateString('en-CA')` yields YYYY-MM-DD from the local clock and is used as an
// independent oracle — it is not built from the code under test.

const ZONE = process.env.TZ || 'system default';
const BEHIND_UTC = new Date().getTimezoneOffset() > 0;

const localDay = date => date.toLocaleDateString('en-CA');

describe(`date-only contract (TZ=${ZONE})`, () => {
  it('preserves the calendar day of a date-only string', () => {
    expect(formatDateOnly('1990-10-17')).toBe('1990-10-17');
  });

  it.each([0, 6, 12, 18, 23])(
    'preserves the calendar day of a Date picked at %i:30 local',
    hour => {
      expect(formatDateOnly(new Date(1990, 9, 17, hour, 30))).toBe(
        '1990-10-17',
      );
    },
  );

  it('parses a date-only string to local midnight, never UTC midnight', () => {
    const date = parseDateOnly('1990-10-17');
    expect([
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
    ]).toEqual([1990, 9, 17, 0]);
  });

  it('is idempotent under parse -> format -> parse', () => {
    const once = parseDateOnly('1990-10-17');
    expect(formatDateOnly(once)).toBe('1990-10-17');
    expect(parseDateOnly(formatDateOnly(once)).getTime()).toBe(once.getTime());
  });

  it('agrees with the local clock for any instant', () => {
    const instants = [
      '2026-08-20T01:00:00.000000Z',
      '2026-08-20T12:00:00.000000Z',
      '2026-08-20T18:00:00.000000Z',
      '2026-08-20T23:59:00.000000Z',
    ];
    instants.forEach(iso => {
      expect(formatDateOnly(iso)).toBe(localDay(new Date(iso)));
    });
  });

  it('round-trips a leap day', () => {
    expect(formatDateOnly('2024-02-29')).toBe('2024-02-29');
  });

  it('round-trips a pre-1970 date', () => {
    expect(formatDateOnly('1965-05-01')).toBe('1965-05-01');
  });

  it('zero-pads single-digit months and days', () => {
    expect(formatDateOnly(new Date(2005, 0, 3, 22, 0))).toBe('2005-01-03');
  });
});

describe(`BUG-0020 regressions (TZ=${ZONE})`, () => {
  it('does not roll an evening pick onto the next calendar day', () => {
    const pickedAt8pm = new Date(1990, 9, 17, 20, 0);
    expect(formatDateOnly(pickedAt8pm)).toBe('1990-10-17');
    expect(formatDateOnly(pickedAt8pm)).toBe(localDay(pickedAt8pm));

    // The defect: toISOString() serialises via UTC, so behind UTC a late pick gains a day.
    if (BEHIND_UTC) {
      expect(pickedAt8pm.toISOString().split('T')[0]).not.toBe('1990-10-17');
    }
  });

  it('does not roll a stored date back a day when it is read again', () => {
    expect(formatDateOnly('1990-10-17')).toBe('1990-10-17');

    // The defect: a bare date string is parsed as UTC midnight, then read with local getters.
    if (BEHIND_UTC) {
      expect(new Date('1990-10-17').getDate()).toBe(16);
    }
  });

  it('does not drift when a stored value is re-seeded and re-submitted repeatedly', () => {
    let stored = '1990-10-17';
    for (let save = 0; save < 25; save++) {
      stored = formatDateOnly(stored);
    }
    expect(stored).toBe('1990-10-17');
  });

  it('resolves an ISO datetime by its local day, not the leading characters', () => {
    const iso = '2026-08-20T01:00:00.000000Z';
    expect(formatDateOnly(iso)).toBe(localDay(new Date(iso)));

    // An unanchored /^\d{4}-\d{2}-\d{2}/ would return the UTC-looking prefix instead.
    if (BEHIND_UTC) {
      expect(formatDateOnly(iso)).not.toBe('2026-08-20');
    }
  });
});

describe(`legacy and invalid input (TZ=${ZONE})`, () => {
  it('reads the legacy toDateString format as a local day', () => {
    expect(formatDateOnly('Tue Oct 16 1990')).toBe('1990-10-16');
  });

  it('passes a Date through unchanged', () => {
    const date = new Date(1990, 9, 17, 20, 0);
    expect(parseDateOnly(date)).toBe(date);
  });

  it.each([null, undefined, '', 0, false])('returns null for %p', value => {
    expect(parseDateOnly(value)).toBeNull();
    expect(formatDateOnly(value)).toBe('');
  });

  it('returns null for an unparseable string', () => {
    expect(parseDateOnly('not a date')).toBeNull();
    expect(formatDateOnly('not a date')).toBe('');
  });

  it('returns null for an invalid Date', () => {
    expect(parseDateOnly(new Date('nonsense'))).toBeNull();
  });
});

describe(`parseTimeOnly (TZ=${ZONE})`, () => {
  it("resolves 'HH:MM' to that time today, local", () => {
    const time = parseTimeOnly('14:30');
    expect([time.getHours(), time.getMinutes()]).toEqual([14, 30]);
  });

  it("resolves a single-digit hour 'H:MM'", () => {
    const time = parseTimeOnly('9:05');
    expect([time.getHours(), time.getMinutes()]).toEqual([9, 5]);
  });

  it('resolves an ISO datetime to its local time', () => {
    const iso = '2026-08-20T18:30:00.000000Z';
    const expected = new Date(iso);
    const time = parseTimeOnly(iso);
    expect([time.getHours(), time.getMinutes()]).toEqual([
      expected.getHours(),
      expected.getMinutes(),
    ]);
  });

  it('passes a Date through unchanged', () => {
    const date = new Date(2026, 7, 20, 13, 0);
    expect(parseTimeOnly(date)).toBe(date);
  });

  it.each([null, undefined, ''])('returns null for %p', value => {
    expect(parseTimeOnly(value)).toBeNull();
  });
});
