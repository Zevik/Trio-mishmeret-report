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
 * מעצב דקות לפורמט של שעות:דקות
 * מתקן גם מקרים של מספרים גדולים
 */
export const formatHoursMinutes = (minutes: number): string => {
  if (minutes < 0) {
    return '0:00';
  }
  
  // בדיקה האם מדובר במחרוזת מוכנה של HH:MM
  if (typeof minutes === 'string' && minutes.includes(':')) {
    console.log(`formatHoursMinutes: received already formatted string: ${minutes}`);
    return minutes;
  }
  
  // המרה למספר דקות
  const totalMinutes = Number(minutes);
  if (isNaN(totalMinutes)) {
    console.error(`formatHoursMinutes: Invalid input: ${minutes}`);
    return '0:00';
  }
  
  console.log(`formatHoursMinutes: formatting ${totalMinutes} minutes`);
  
  // חישוב שעות ודקות מסך הכל דקות
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = Math.floor(totalMinutes % 60);
  
  // פורמט עם אפסים מובילים לדקות
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
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

// Parse date string in format DD.MM.YYYY
export const parseDate = (dateStr: string): Date | null => {
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  // Create date object (month is 0-based in JavaScript)
  const date = new Date(year, month - 1, day);
  
  // Validate the date
  if (isNaN(date.getTime())) return null;
  
  return date;
};
