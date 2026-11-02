import {
  getCleanerAmountEarned,
  CLEANER_PAYOUT_ELIGIBLE_STATUSES,
} from '../src/utils/cleanerEarnings';

describe('getCleanerAmountEarned', () => {
  it('returns 0 when the cleaner cancelled before arrival (status 5), even if the clean was later completed by someone else', () => {
    expect(getCleanerAmountEarned(5, 33.33)).toBe(0);
  });

  it('returns 0 for a cleaner cancelled after walk-through (status 6)', () => {
    expect(getCleanerAmountEarned(6, 173.33)).toBe(0);
  });

  it('returns 0 for a user-requested-cancel assignment (status 9)', () => {
    expect(getCleanerAmountEarned(9, 50)).toBe(0);
  });

  it('returns 0 for a request-taken-by-another-cleaner row (status 12)', () => {
    expect(getCleanerAmountEarned(12, 50)).toBe(0);
  });

  it('returns 0 for declined/ignored rows (status 2, 8)', () => {
    expect(getCleanerAmountEarned(2, 50)).toBe(0);
    expect(getCleanerAmountEarned(8, 50)).toBe(0);
  });

  it('returns the amount unchanged when the cleaner completed the job (status 7)', () => {
    expect(getCleanerAmountEarned(7, 33.33)).toBe(33.33);
  });

  it('returns the amount unchanged for user-completed (status 10)', () => {
    expect(getCleanerAmountEarned(10, 173.33)).toBe(173.33);
  });

  it('treats missing/non-finite amounts as 0 even when eligible', () => {
    expect(getCleanerAmountEarned(7, undefined)).toBe(0);
    expect(getCleanerAmountEarned(7, null)).toBe(0);
    expect(getCleanerAmountEarned(10, NaN)).toBe(0);
  });

  it('exposes the eligible-status allowlist as [7, 10]', () => {
    expect(CLEANER_PAYOUT_ELIGIBLE_STATUSES).toEqual([7, 10]);
  });
});
