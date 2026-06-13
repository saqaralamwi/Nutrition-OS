/**
 * Formats a date safely by filtering out missing, invalid, or Unix Epoch (1970) dates.
 * Falls back to today's date formatted in 'ar-YE' Arabic (Yemen) convention.
 *
 * @param dateVal Raw date string, Date object, or numeric timestamp.
 * @returns Formatted date string in 'ar-YE' convention (e.g. DD/MM/YYYY in Arabic numerals).
 */
export const formatSafeDate = (dateVal: any): string => {
  if (!dateVal) {
    return new Date().toLocaleDateString('ar-YE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const d = new Date(dateVal);

  // Check for Invalid Date (NaN), timestamps <= 0, and year === 1970
  if (isNaN(d.getTime()) || d.getTime() <= 0 || d.getFullYear() === 1970) {
    return new Date().toLocaleDateString('ar-YE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return d.toLocaleDateString('ar-YE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
