import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

// Format date to specific format
export const formatDateString = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Format date with time
export const formatDateTimeString = (date) => {
  return formatDateString(date, 'MMM dd, yyyy HH:mm');
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (date) => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
};

// Check if date is today
export const checkIsToday = (date) => {
  if (!date) return false;
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isToday(parsedDate);
  } catch (error) {
    return false;
  }
};

// Check if date is yesterday
export const checkIsYesterday = (date) => {
  if (!date) return false;
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isYesterday(parsedDate);
  } catch (error) {
    return false;
  }
};

// Format date for input field (YYYY-MM-DD)
export const formatDateForInput = (date) => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};