// Calculate the duration between two times
export function calculateDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "";
  
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  // Handle overnight shifts
  let diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
  }
  
  // Calculate hours and minutes
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  // Format as HH:MM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Format time from HH:MM to display format
export function formatTime(time: string): string {
  if (!time) return "";
  
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

// Check if a time string is in valid HH:MM format
export function isValidTimeFormat(time: string): boolean {
  // Require two digits for hours with leading zero (00-23)
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
}
