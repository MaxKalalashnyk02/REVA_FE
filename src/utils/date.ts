// Format as "26 Nov 2025"
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Format as "26 November 2025"
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Get today's date formatted as "26 Nov 2025"
export function getTodayFormatted(): string {
  return formatDate(new Date());
}
