/**
 * פרסור תאריך מפורמט סטרינג לאובייקט Date
 */
export const parseDate = (dateString: string): Date | null => {
  console.log(`parseDate: Attempting to parse date string: "${dateString}"`);
  
  if (!dateString) {
    console.warn('parseDate: Empty date string provided');
    return null;
  }

  try {
    // ניסיון לפרסר פורמט "DD/MM/YYYY"
    if (dateString.includes('/')) {
      console.log('parseDate: Trying DD/MM/YYYY format');
      const [day, month, year] = dateString.split('/').map(part => part.trim());
      
      if (day && month && year) {
        // המרת חודש לאינדקס מבוסס-0 (ינואר=0)
        const monthIndex = parseInt(month, 10) - 1;
        const dayNum = parseInt(day, 10);
        const yearNum = parseInt(year, 10);
        
        if (!isNaN(dayNum) && !isNaN(monthIndex) && !isNaN(yearNum) && 
            monthIndex >= 0 && monthIndex <= 11 && 
            dayNum >= 1 && dayNum <= 31) {
          const parsedDate = new Date(yearNum, monthIndex, dayNum);
          console.log(`parseDate: Successfully parsed DD/MM/YYYY format: ${parsedDate.toISOString()}`);
          return parsedDate;
        } else {
          console.warn(`parseDate: Invalid date components: day=${day}, month=${month}, year=${year}`);
        }
      } else {
        console.warn(`parseDate: Missing date components in DD/MM/YYYY format: ${dateString}`);
      }
    }
    
    // ניסיון לפרסר פורמט ISO
    console.log('parseDate: Trying ISO format');
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      console.log(`parseDate: Successfully parsed ISO format: ${isoDate.toISOString()}`);
      return isoDate;
    } else {
      console.warn(`parseDate: Failed to parse as ISO date: ${dateString}`);
    }
    
    // ניסיון לפרסר פורמטים נוספים עם Day.js
    console.log('parseDate: All parsing attempts failed');
    return null;
  } catch (error) {
    console.error(`parseDate: Error parsing date "${dateString}":`, error);
    return null;
  }
}; 