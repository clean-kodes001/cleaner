import {useState, useEffect, useRef, useCallback} from 'react';

/**
 * A reusable countdown timer hook with built-in clock skew handling.
 *
 * @param {Object} options - Configuration options
 * @param {string|Date} options.startTime - The timestamp when the countdown started (from server)
 * @param {number} options.durationMinutes - How long to count down in minutes (default: 5)
 * @param {boolean} options.enabled - Whether the timer should run (default: true)
 * @param {function} options.onExpire - Optional callback when timer reaches 00:00
 *
 * @returns {Object} Timer state
 * @returns {string} minutes - Formatted minutes (with leading zero)
 * @returns {string} seconds - Formatted seconds (with leading zero)
 * @returns {boolean} isExpired - Whether the timer has reached 00:00
 * @returns {boolean} isRunning - Whether the timer is currently running
 * @returns {number} remainingMs - Raw remaining milliseconds
 */
const useCountdownTimer = ({
  startTime,
  durationMinutes = 5,
  enabled = true,
  onExpire,
  timerName = 'Timer', // Optional name for logging
}) => {
  // Calculate remaining time - extracted as a pure function for reuse
  const getRemaining = (start, duration) => {
    if (!start) return duration * 60 * 1000;

    const now = new Date();
    const startDate = new Date(start);
    const limitMs = duration * 60 * 1000;

    // Calculate: How much time is left = Limit - Elapsed
    let remaining = limitMs - (now - startDate);

    // CLOCK SKEW HANDLING: Clamp to max duration
    if (remaining > limitMs) {
      remaining = limitMs;
    }

    // Expired: Don't go below zero
    if (remaining < 0) {
      remaining = 0;
    }

    return remaining;
  };

  // Initialize with calculated remaining time immediately (no delay)
  const [remainingMs, setRemainingMs] = useState(() =>
    getRemaining(startTime, durationMinutes),
  );
  const [isExpired, setIsExpired] = useState(
    () => getRemaining(startTime, durationMinutes) === 0,
  );
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);
  const hasCalledExpireRef = useRef(false);

  // Logging guard - only log when these values change
  const lastLoggedRef = useRef({enabled: null, startTime: null});

  // Keep callback ref updated
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Calculate remaining time with clock skew handling (for interval updates)
  const calculateRemaining = useCallback(() => {
    return getRemaining(startTime, durationMinutes);
  }, [startTime, durationMinutes]);

  // Main timer effect
  useEffect(() => {
    // Guarded logging - only log when key values change
    const shouldLog =
      __DEV__ &&
      (lastLoggedRef.current.enabled !== enabled ||
        lastLoggedRef.current.startTime !== startTime);

    if (shouldLog) {
      console.log(`🕐 [${timerName}] Timer state changed:`, {
        enabled,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        remainingMs: getRemaining(startTime, durationMinutes),
        remainingSec: Math.floor(
          getRemaining(startTime, durationMinutes) / 1000,
        ),
      });
      lastLoggedRef.current = {enabled, startTime};
    }

    // Cleanup existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset expired flag when startTime changes
    hasCalledExpireRef.current = false;

    // Don't run if not enabled or no start time
    if (!enabled || !startTime) {
      if (shouldLog) {
        console.log(
          `🕐 [${timerName}] Timer NOT running - enabled:`,
          enabled,
          'startTime:',
          !!startTime,
        );
      }
      setIsRunning(false);
      setIsExpired(false);
      setRemainingMs(durationMinutes * 60 * 1000);
      return;
    }

    if (shouldLog) {
      console.log(`🕐 [${timerName}] Timer STARTING`);
    }

    // Initial calculation
    const initialRemaining = calculateRemaining();
    setRemainingMs(initialRemaining);
    setIsExpired(initialRemaining === 0);

    // If already expired, don't start interval
    if (initialRemaining === 0) {
      setIsRunning(false);
      if (onExpireRef.current && !hasCalledExpireRef.current) {
        hasCalledExpireRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    setIsRunning(true);

    // Start interval
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingMs(remaining);

      if (remaining === 0) {
        setIsExpired(true);
        setIsRunning(false);
        clearInterval(intervalRef.current);
        intervalRef.current = null;

        if (onExpireRef.current && !hasCalledExpireRef.current) {
          hasCalledExpireRef.current = true;
          onExpireRef.current();
        }
      }
    }, 1000);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTime, durationMinutes, enabled, calculateRemaining, timerName]);

  // Format minutes and seconds with leading zeros
  const minutes = String(Math.floor(remainingMs / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((remainingMs % 60000) / 1000)).padStart(
    2,
    '0',
  );

  return {
    minutes,
    seconds,
    isExpired,
    isRunning,
    remainingMs,
    formatted: `${minutes}:${seconds}`,
  };
};

export default useCountdownTimer;
