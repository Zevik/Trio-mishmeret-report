/**
 * Time utility functions for the application
 */

// Constants
export const MAX_REASONABLE_MINUTES = 24 * 60; // 24 hours in minutes

/**
 * Formats minutes into a human-readable 'HH:MM' format
 */
export function formatHoursMinutes(totalMinutes: number): string {
  // Handle negative, NaN, or invalid minutes
  if (isNaN(totalMinutes) || totalMinutes <= 0) return '0:00';
  
  // Cap extremely large values to prevent display issues
  const cappedMinutes = Math.min(totalMinutes, 9999 * 60); // Cap at 9999 hours
  
  // Calculate hours and remaining minutes
  const hours = Math.floor(cappedMinutes / 60);
  const minutes = Math.floor(cappedMinutes % 60);
  
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
  if (!Array.isArray(timeStrings) || timeStrings.length === 0) {
    console.log("sumTimeStrings: Empty or non-array input, returning 0");
    return 0;
  }
  
  let totalMinutes = 0;
  
  // Log the calculation process
  console.log(`sumTimeStrings: Summing ${timeStrings.length} time strings: [${timeStrings.join(', ')}]`);
  
  for (const timeStr of timeStrings) {
    try {
      if (!timeStr || typeof timeStr !== 'string' || timeStr.trim() === '') {
        console.log(`sumTimeStrings: Skipping empty time string`);
        continue;
      }
      
      const minutes = parseTimeToMinutes(timeStr);
      
      // Log each conversion step
      console.log(`sumTimeStrings: "${timeStr}" → ${minutes} minutes`);
      
      // Skip invalid values (negative or excessive)
      if (minutes < 0) {
        console.warn(`sumTimeStrings: Negative minutes value (${minutes}) from "${timeStr}", skipping`);
        continue;
      }
      
      if (minutes > MAX_REASONABLE_MINUTES) {
        console.warn(`sumTimeStrings: Excessive minutes value (${minutes}) from "${timeStr}", skipping`);
        continue;
      }
      
      totalMinutes += minutes;
      console.log(`sumTimeStrings: Running total: ${totalMinutes} minutes (${formatHoursMinutes(totalMinutes)})`);
    } catch (error) {
      console.error(`sumTimeStrings: Error processing time: "${timeStr}":`, error);
    }
  }
  
  console.log(`sumTimeStrings: Final total: ${totalMinutes} minutes (${formatHoursMinutes(totalMinutes)})`);
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

/**
 * Calculates the time difference between two time strings in minutes
 * Supports multiple formats:
 * - HH:MM
 * - Decimal hours (e.g., "1.5")
 */
export const calculateTimeDifference = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  
  try {
    // Try to parse both times as minutes
    let startMinutes = parseTimeToMinutes(startTime);
    let endMinutes = parseTimeToMinutes(endTime);
    
    // Validate parsed times
    if (startMinutes < 0 || startMinutes >= 24 * 60) {
      console.warn(`Invalid start time (outside 0-24h range): ${startTime} -> ${startMinutes} minutes`);
      startMinutes = 0;
    }
    
    if (endMinutes < 0 || endMinutes >= 24 * 60) {
      console.warn(`Invalid end time (outside 0-24h range): ${endTime} -> ${endMinutes} minutes`);
      endMinutes = 0;
    }
    
    // If both times are invalid, return 0
    if (startMinutes === 0 && endMinutes === 0) return 0;
    
    // Handle overnight shifts (when end time is less than start time)
    if (endMinutes < startMinutes) {
      return (24 * 60) - startMinutes + endMinutes;
    }
    
    return endMinutes - startMinutes;
  } catch (error) {
    console.error(`Error calculating time difference between "${startTime}" and "${endTime}":`, error);
    return 0;
  }
};

/**
 * Parses a date string in DD.MM.YYYY or DD/MM/YYYY format
 * Returns a valid Date object or null if invalid
 */
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }
  
  try {
    // Clean the input string
    const cleanDateStr = dateStr.trim();
    
    // Check if contains separators (. or /)
    if (cleanDateStr.includes('.') || cleanDateStr.includes('/')) {
      // Replace any . with / for consistent handling
      const normalizedDateStr = cleanDateStr.replace(/\./g, '/');
      
      // Split the components
      const parts = normalizedDateStr.split('/');
      
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
        const year = parseInt(parts[2], 10);
        
        // Validate ranges
        if (
          isNaN(day) || day < 1 || day > 31 ||
          isNaN(month) || month < 0 || month > 11 ||
          isNaN(year) || year < 1900 || year > 2100
        ) {
          return null;
        }
        
        // Create date object and validate
        const date = new Date(year, month, day);
        
        // Verify the date is valid by checking if values match after construction
        if (
          date.getDate() !== day ||
          date.getMonth() !== month ||
          date.getFullYear() !== year
        ) {
          // Date is invalid (like Feb 30)
          return null;
        }
        
        return date;
      }
    }
    
    // Try standard JS date parsing as fallback
    const date = new Date(cleanDateStr);
    return !isNaN(date.getTime()) ? date : null;
    
  } catch (error) {
    console.error(`Error parsing date "${dateStr}":`, error);
    return null;
  }
};
