import { vi, it, beforeEach, afterEach, expect } from 'vitest';
import { formatTimeDifference } from './util';

const mockNow = new Date();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockNow);
});

afterEach(() => {
  vi.useRealTimers();
});

it('should return "1 min" for exactly one minute or less than that', () => {
  const exactlyOneDate = new Date(mockNow.getTime() + 60 * 1000);
  expect(formatTimeDifference(exactlyOneDate)).toBe('1 min');

  const lessThanOneDate = new Date(mockNow.getTime() + 30 * 1000);
  expect(formatTimeDifference(lessThanOneDate)).toBe('1 min');
});

it.each([
  [5 * 60 * 1000, '5 mins', 'multiple minutes'],
  [60 * 60 * 1000, '1 hour', 'exactly one hour'],
  [3 * 60 * 60 * 1000, '3 hours', 'multiple hours'],
  [25 * 60 * 60 * 1000, '1 day', 'exactly one day'],
  [4 * 25 * 60 * 60 * 1000, '4 days', 'multiple days'],
  [7 * 25 * 60 * 60 * 1000, '1 week', 'exactly one week'],
  [3 * 7 * 25 * 60 * 60 * 1000, '3 weeks', 'multiple weeks'],
  [30 * 25 * 60 * 60 * 1000, '1 month', 'approximately one month'],
  [3 * 30 * 25 * 60 * 60 * 1000, '3 months', 'multiple months'],
  [365 * 25 * 60 * 60 * 1000, '1 year', 'approximately one year'],
  [2 * 365 * 25 * 60 * 60 * 1000, '2 years', 'multiple years'],
])('should return "%s" for %s (%i ms)', (milliseconds, expected) => {
  const futureDate = new Date(mockNow.getTime() + milliseconds);
  expect(formatTimeDifference(futureDate)).toBe(expected);
});
