# BUG-1005 validation walkthrough

## Root cause (one line)
"Amount Earned" in the Cleaner app's History used the *parent Clean's* status to decide whether to zero out earnings, not the individual cleaner's own assignment status — so a cleaner whose own assignment was cancelled/reassigned still saw the full quoted amount if the booking was later completed by someone else.

## The fix
New file `src/utils/cleanerEarnings.js`:
```js
export const CLEANER_PAYOUT_ELIGIBLE_STATUSES = [7, 10];

export const getCleanerAmountEarned = (cleanerStatus, cleanAmountEarned) => {
  const eligible = CLEANER_PAYOUT_ELIGIBLE_STATUSES.includes(cleanerStatus);
  if (!eligible) return 0;
  const amount = Number(cleanAmountEarned);
  return Number.isFinite(amount) ? amount : 0;
};
```

`src/components/History/HistoryItem.jsx`:
```diff
-            <DetailsItem
-              title={t('history.amount_earned')}
-              value={`${user.site_country.currency} ${Number(
-                clean?.clean?.amount_earned,
-              ).toFixed(2)}`}
-            />
+            <DetailsItem
+              title={t('history.amount_earned')}
+              value={formatMoney(amountEarned)}
+            />
```
where `amountEarned = getCleanerAmountEarned(clean?.status, item?.amount_earned)` is computed once near the top of the component (`clean.status` = this row's own Cleaner-assignment status; `item.amount_earned` = the parent Clean's already-status-gated amount).

Applies to both surfaces from the bug screenshot — the History list row and the History Details panel — since both render through this same component/block.

## Expected behavior by scenario

| Scenario | This row's `clean.status` (Cleaner.status) | Amount Earned shown |
|---|---|---|
| Cancelled before arrival, job reassigned & completed by another cleaner (the bug) | 5 | **$0.00** (was: full quoted amount) |
| Cancelled after walk-through | 6 | **$0.00** |
| User requested cancel while assigned | 9 | **$0.00** |
| Request taken by another cleaner (dispatch loser) | 12 | **$0.00** |
| Declined / ignored | 2 / 8 | $0.00 (unchanged — was already correct) |
| Cleaner completed the job | 7 | full amount (unchanged — was already correct) |
| User marked complete | 10 | full amount (unchanged — was already correct) |

## Re-checking the original two bookings
Local dev DB doesn't contain 966 Elphinstone / 909 Argyle (only 21 seeded `Clean` rows, no match by address) — those are presumably on staging/prod. To re-check on an environment that has them:

```php
// php artisan tinker, read-only
$clean = \App\Models\Clean::where('location', 'like', '%Elphinstone%')->first();
$cleaner = $clean->clean_cleaners()->latest()->first(); // or the specific reporter's row
[$clean->status, $cleaner->status, $clean->amount_earned];
```
Expect `$cleaner->status` in `[5,6,9,12]`. After the fix, the app should show $0.00 for that cleaner's history row regardless of `$clean->status`.

## Automated coverage
`__tests__/cleanerEarnings.test.js` — 9 tests, covers every status above plus non-finite-amount safety. Run: `npx jest cleanerEarnings` (from `SwipeKlin_Cleaner_v2/`, uses npm/npx per that app's package manager, not yarn).
