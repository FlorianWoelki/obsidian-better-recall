/**
 * Calculates the time difference between the passed in future date
 * and `now` which will then be used to determine the string that
 * will be used to show the time left until the future date.
 * @param futureDate Date which will be used to compare with `now`.
 * @returns String which will show the time left until the future date.
 */
export function formatTimeDifference(futureDate: Date): string {
  const now = new Date();
  const differenceInMillis = futureDate.getTime() - now.getTime();
  const seconds = Math.floor(differenceInMillis / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (weeks > 0) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    const printedMinutes = Math.max(1, minutes);
    return `${printedMinutes} ${printedMinutes === 1 ? 'min' : 'mins'}`;
  }
}

type ClassProp = string | number | boolean | null | undefined | ClassProp[];

/**
 * Combines multiple class names into a single string.
 * Filters out falsy values (null, undefined, false, '').
 * @param classes Class names to combine.
 * @returns Combined class names separated by spaces.
 */
export function cn(...classes: ClassProp[]): string {
  return classes.flat().filter(Boolean).join(' ').trim();
}
