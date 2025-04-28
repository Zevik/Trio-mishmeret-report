/**
 * Time utility functions for the application
 */

// Maximum reasonable minutes for validation (24 hours)
const MAX_REASONABLE_MINUTES = 24 * 60;

/**
 * Formats minutes into a human-readable 'HH:MM' format
 */
export function formatHoursMinutes(totalMinutes: number): string {
  // Handle negative or zero minutes
  if (totalMinutes <= 0) return '0:00';
  
  // Calculate hours and remaining minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  
  // Format with leading zeros for minutes when needed
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Converts a time string in HH:MM format to minutes
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  const trimmed = timeStr.trim();
  
  // Handle empty strings
  if (!trimmed) return 0;
  
  try {
    // Format: HH:MM
    if (trimmed.includes(':')) {
      const [hours, minutes] = trimmed.split(':').map(part => parseInt(part, 10));
      if (isNaN(hours) || isNaN(minutes)) return 0;
      return (hours * 60) + minutes;
    }
    
    // Format: decimal hours (e.g., 1.5)
    const hourDecimal = parseFloat(trimmed);
    if (!isNaN(hourDecimal)) {
      const hours = Math.floor(hourDecimal);
      const minutes = Math.round((hourDecimal - hours) * 60);
      return (hours * 60) + minutes;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error parsing time string: ${timeStr}`, error);
    return 0;
  }
}

/**
 * Parses a Google Sheets date string (with 1899 epoch) to extract hours and minutes
 * Google Sheets uses 1899-12-30 as its epoch date
 */
export function googleSheetsDateToMinutes(dateStr: string): number {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  
  try {
    // Check if this is likely a Google Sheets date (contains 1899 or starts with 18)
    if (!dateStr.includes('1899') && !dateStr.startsWith('18')) {
      return 0;
    }
    
    const date = new Date(dateStr);
    
    // Validate date parsing worked
    if (isNaN(date.getTime())) {
      console.warn(`Invalid Google Sheets date format: ${dateStr}`);
      return 0;
    }
    
    // Extract hours and minutes in UTC to avoid timezone issues
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    return (hours * 60) + minutes;
  } catch (error) {
    console.error(`Error parsing Google Sheets date: ${dateStr}`, error);
    return 0;
  }
}

/**
 * Smart function to convert any time format to minutes
 * Handles:
 * - HH:MM format
 * - Google Sheets dates (1899 epoch)
 * - Decimal hours
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  try {
    // First check if it's a Google Sheets date (with 1899)
    if (timeStr.includes('1899') || timeStr.startsWith('18')) {
      const minutes = googleSheetsDateToMinutes(timeStr);
      // If we got reasonable minutes, return them
      if (minutes > 0 && minutes <= MAX_REASONABLE_MINUTES) {
        return minutes;
      }
    }
    
    // Next try standard HH:MM or decimal format
    const minutes = timeStringToMinutes(timeStr);
    
    // Validate the result is reasonable
    if (minutes > MAX_REASONABLE_MINUTES) {
      console.warn(`Suspicious time value (over ${MAX_REASONABLE_MINUTES} minutes): ${timeStr} → ${minutes} minutes`);
    }
    
    return minutes;
  } catch (error) {
    console.error(`Failed to parse time: ${timeStr}`, error);
    return 0;
  }
}

/**
 * Sum multiple time strings to get total minutes
 */
export function sumTimeStrings(timeStrings: string[]): number {
  if (!Array.isArray(timeStrings) || timeStrings.length === 0) return 0;
  
  let totalMinutes = 0;
  
  // Log the calculation process
  console.log(`Summing ${timeStrings.length} time strings:`);
  
  for (const timeStr of timeStrings) {
    try {
      const minutes = parseTimeToMinutes(timeStr);
      
      // Log each conversion step
      console.log(`  "${timeStr}" → ${minutes} minutes`);
      
      totalMinutes += minutes;
      console.log(`  Running total: ${totalMinutes} minutes (${formatHoursMinutes(totalMinutes)})`);
    } catch (error) {
      console.error(`Error processing time: ${timeStr}`, error);
    }
  }
  
  console.log(`Final total: ${totalMinutes} minutes (${formatHoursMinutes(totalMinutes)})`);
  return totalMinutes;
}

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

/**
 * ממיר שעות:דקות למספר דקות
 */
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  try {
    // בדיקה לפורמט HH:MM
    const match = timeStr.match(/(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return (hours * 60) + minutes;
    }
    
    // אם זה מספר, נניח שזה שעות
    const directValue = parseFloat(timeStr);
    if (!isNaN(directValue)) {
      return Math.round(directValue * 60); // המרת שעות לדקות
    }
    
    return 0;
  } catch (error) {
    console.error('Error converting time to minutes:', error);
    return 0;
  }
};

/**
 * מחשב את משך הזמן בדקות בין שתי שעות בפורמט HH:MM
 */
export const calculateDurationMinutes = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  
  try {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // טיפול במקרה של יום חדש (כאשר שעת הסיום קטנה משעת ההתחלה)
    if (endMinutes < startMinutes) {
      return (24 * 60) - startMinutes + endMinutes;
    }
    
    return endMinutes - startMinutes;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

// Calculate the difference between two dates in minutes
export const calculateTimeDifference = (startTime: string, endTime: string): number => {
  // Parse the time strings and create Date objects
  const start = new Date(startTime);
  const end = new Date(endTime);

  // If either date is invalid, return 0
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  // Calculate the difference in milliseconds
  const diffMs = end.getTime() - start.getTime();
  
  // Convert to minutes
  return Math.round(diffMs / (1000 * 60));
};

// Parse date string in multiple formats
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  try {
    const trimmedDateStr = dateStr.trim();
    
    // Try DD.MM.YYYY format (dots)
    if (trimmedDateStr.includes('.')) {
      const parts = trimmedDateStr.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          // Create date object (month is 0-based in JavaScript)
          const date = new Date(year, month - 1, day);
          // Validate the date
          if (!isNaN(date.getTime())) return date;
        }
      }
    }
    
    // Try DD/MM/YYYY format (slashes)
    if (trimmedDateStr.includes('/')) {
      const parts = trimmedDateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          // Create date object (month is 0-based in JavaScript)
          const date = new Date(year, month - 1, day);
          // Validate the date
          if (!isNaN(date.getTime())) return date;
        }
      }
    }
    
    // Try ISO format (YYYY-MM-DD)
    if (trimmedDateStr.includes('-')) {
      const date = new Date(trimmedDateStr);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try direct JS date parsing as a last resort
    const date = new Date(trimmedDateStr);
    if (!isNaN(date.getTime())) return date;
    
    return null;
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return null;
  }
};
