import { buildGASUrl } from './environment';

/**
 * פונקציה לשליפת נתוני דוח חודשי מהשרת
 * הפונקציה מבצעת שאילתה ל-Google Apps Script ומחזירה את הנתונים מגיליון Shift_card
 */
export const fetchMonthlyReport = async (): Promise<any[]> => {
  try {
    // בניית כתובת URL לבקשה
    const url = buildGASUrl('getShiftReport');
    console.log('Fetching monthly report data from:', url);
    
    // שליחת בקשה לשרת
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch report data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch report data');
    }
    
    // בדיקה שהנתונים שהתקבלו תקינים
    if (!data.shifts || !Array.isArray(data.shifts)) {
      console.error('Invalid data format received:', data);
      return [];
    }
    
    return data.shifts;
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    throw error;
  }
};

/**
 * מתרגם תאריך לפורמט העברי הרצוי
 */
export const formatDateHebrew = (dateStr: string): string => {
  try {
    // תומך במגוון פורמטים של תאריך
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // אם הפורמט לא הובן אוטומטית, ננסה לפרסר פורמטים ידועים
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // פורמט DD/MM/YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // חודשים בג'אווהסקריפט מתחילים מ-0
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day).toLocaleDateString('he-IL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      return dateStr; // אם לא הצלחנו לפרסר, נחזיר כמו שהוא
    }
    
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

/**
 * מחלץ חודש ושנה מתאריך בפורמט עברי
 */
export const extractMonthYearHebrew = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // אם הפורמט לא הובן אוטומטית, ננסה לפרסר פורמטים ידועים
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // פורמט DD/MM/YYYY
        const month = parseInt(parts[1], 10) - 1; // חודשים בג'אווהסקריפט מתחילים מ-0
        const year = parseInt(parts[2], 10);
        return new Date(year, month, 1).toLocaleDateString('he-IL', {
          month: 'long',
          year: 'numeric'
        });
      }
      return ''; // אם לא הצלחנו לפרסר, נחזיר ריק
    }
    
    return date.toLocaleDateString('he-IL', {
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error extracting month/year:', error);
    return '';
  }
};

/**
 * פרסור תאריך מפורמט DD/MM/YYYY או DD/MM/YYYY HH:mm:ss
 * מחזיר אובייקט Date
 */
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  try {
    // ניקוי התאריך מרווחים מיותרים
    const cleanedDateStr = dateStr.trim();
    
    // פרסור תאריך בפורמט DD/MM/YYYY
    if (cleanedDateStr.includes('/')) {
      const dateParts = cleanedDateStr.split(' ')[0].split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // חודשים בJS מתחילים מ-0
        const year = parseInt(dateParts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
    }
    
    // ניסיון פרסור רגיל של JS
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return null;
  }
}; 