/**
 * Formats a date relatively ('اليوم', 'غداً', 'بعد غد') if within a 3-day window,
 * otherwise falls back to a clean absolute calendar date format (DD/MM/YYYY).
 *
 * @param dateVal Raw date string, Date object, or numeric timestamp.
 * @returns Formatted relative or absolute date string.
 */
export const formatRelativeDate = (dateVal: any): string => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime()) || d.getTime() <= 0 || d.getFullYear() === 1970) {
    return '';
  }

  const today = new Date();
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = dDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'اليوم';
  } else if (diffDays === 1) {
    return 'غداً';
  } else if (diffDays === 2) {
    return 'بعد غد';
  }

  return d.toLocaleDateString('ar-YE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formats a date safely by filtering out missing, invalid, or Unix Epoch (1970) dates.
 * If the date is within a 3-day relative window (Today, Tomorrow, Day after tomorrow),
 * it returns the relative Arabic label. Otherwise, it falls back to absolute date.
 *
 * @param dateVal Raw date string, Date object, or numeric timestamp.
 * @returns Formatted date string in 'ar-YE' convention.
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

  const today = new Date();
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = dDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'اليوم';
  } else if (diffDays === 1) {
    return 'غداً';
  } else if (diffDays === 2) {
    return 'بعد غد';
  }

  return d.toLocaleDateString('ar-YE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
