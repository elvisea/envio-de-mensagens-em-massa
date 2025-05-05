import env from "../env";
import { MessageCounters } from "../interfaces";

export const counters: MessageCounters = {
  hourly: 0,
  daily: 0,
  lastHourReset: Date.now(),
  lastDayReset: Date.now()
};

export const LIMITS = {
  DAILY: env.limits.daily,
  HOURLY: env.limits.hourly,
  BATCH_SIZE: env.limits.batchSize,
  PAUSE_DURATION: env.limits.pauseDuration,
  ERROR_RETRY_DELAY: env.limits.errorRetryDelay,
  MIN_SECONDS: env.limits.minSeconds,
  MAX_SECONDS: env.limits.maxSeconds
} as const;