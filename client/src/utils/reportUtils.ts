import { buildGASUrl } from './environment';

/**
 * פונקציה לשליפת נתוני דוח חודשי מהשרת
 * הפונקציה מבצעת שאילתה ל-Google Apps Script ומחזירה את הנתונים מגיליון Shift_card
 */
export const fetchMonthlyReport = async (): Promise<any[]> => {
  try {
    // בניית כתובת URL לבקשה
    const url = buildGASUrl('getShiftReport');
    console.log('fetchMonthlyReport: Fetching data from URL:', url);
    
    // שליחת בקשה לשרת
    console.log('fetchMonthlyReport: Sending request...');
    const response = await fetch(url);
    console.log(`fetchMonthlyReport: Response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`fetchMonthlyReport: Request failed with status ${response.status}`);
      throw new Error(`Failed to fetch report data: ${response.status}`);
    }
    
    console.log('fetchMonthlyReport: Parsing JSON response...');
    const data = await response.json();
    console.log('fetchMonthlyReport: Data structure:', Object.keys(data));
    
    if (!data.success) {
      console.error('fetchMonthlyReport: API returned error:', data.error);
      throw new Error(data.error || 'Failed to fetch report data');
    }
    
    // בדיקה שהנתונים שהתקבלו תקינים
    if (!data.shifts || !Array.isArray(data.shifts)) {
      console.error('fetchMonthlyReport: Invalid data format received:', data);
      return [];
    }
    
    console.log(`fetchMonthlyReport: Received ${data.shifts.length} records`);
    if (data.shifts.length > 0) {
      console.log('fetchMonthlyReport: Sample record structure:', 
        data.shifts[0].map ? 'Array (expecting row data)' : typeof data.shifts[0]);
      console.log('fetchMonthlyReport: First record sample:', data.shifts[0]);
      
      // יצירת מפת עמודות לפי האינדקסים
      const columnMap = {
        'A: Timestamp': 0,
        'B: MedicName': 1,
        'C: ShiftType': 2,
        'D: DoctorName': 3,
        'E: Date': 4,
        'F: StartTime': 5,
        'G: EndTime': 6,
        'H: CalculatedHours': 7,
        'I: ReportedHours': 8
      };
      
      console.log('fetchMonthlyReport: Expected column mapping:', columnMap);
      
      // בדיקת דוגמת תאריך
      if (data.shifts[0] && data.shifts[0][4]) {
        console.log(`fetchMonthlyReport: Date sample from column E (index 4): "${data.shifts[0][4]}"`);
        console.log(`fetchMonthlyReport: Sample date format check: ${data.shifts[0][4].includes('/') ? 'Contains /' : 'Does not contain /'}`);
      }
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
  if (!dateStr) {
    console.log('parseDate: dateStr is empty or null');
    return null;
  }
  
  try {
    console.log(`parseDate: attempting to parse date: "${dateStr}" (type: ${typeof dateStr})`);
    
    // ניקוי התאריך מרווחים מיותרים
    const cleanedDateStr = typeof dateStr === 'string' ? dateStr.trim() : String(dateStr).trim();
    console.log(`parseDate: cleaned date string: "${cleanedDateStr}"`);
    
    // בדיקה אם יש תווים מיוחדים בתאריך
    const specialChars = cleanedDateStr.match(/[^a-zA-Z0-9\/\s:\-\.]/g);
    if (specialChars) {
      console.warn(`parseDate: found special characters in date: ${JSON.stringify(specialChars)}`);
    }
    
    // פרסור תאריך בפורמט DD/MM/YYYY
    if (cleanedDateStr.includes('/')) {
      const parts = cleanedDateStr.split(' ');
      console.log(`parseDate: split parts:`, parts);
      
      const dateParts = parts[0].split('/');
      console.log(`parseDate: date parts:`, dateParts);
      
      if (dateParts.length === 3) {
        // וודא שכל החלקים הם מספרים (אחרת ייכשל בהמרה)
        const dayStr = dateParts[0].trim();
        const monthStr = dateParts[1].trim();
        const yearStr = dateParts[2].trim();
        
        console.log(`parseDate: extracted components - day: "${dayStr}", month: "${monthStr}", year: "${yearStr}"`);
        
        // בדיקה אם כל התווים הם ספרות
        if (!/^\d+$/.test(dayStr) || !/^\d+$/.test(monthStr) || !/^\d+$/.test(yearStr)) {
          console.warn(`parseDate: non-numeric characters in date parts - day: ${dayStr}, month: ${monthStr}, year: ${yearStr}`);
        }
        
        const day = parseInt(dayStr, 10);
        const month = parseInt(monthStr, 10) - 1; // חודשים בJS מתחילים מ-0
        const year = parseInt(yearStr, 10);
        
        console.log(`parseDate: parsed day=${day}, month=${month+1}/${month} (0-indexed), year=${year}`);
        
        // בדיקה שתאריך הגיוני
        const isValidDay = day >= 1 && day <= 31;
        const isValidMonth = month >= 0 && month <= 11;
        const isValidYear = year >= 1900 && year <= 2100;
        
        console.log(`parseDate: validation - valid day: ${isValidDay}, valid month: ${isValidMonth}, valid year: ${isValidYear}`);
        
        if (isValidDay && isValidMonth && isValidYear) {
          const dateObj = new Date(year, month, day);
          
          // בדיקה שה-Date תקין
          const isValidDate = !isNaN(dateObj.getTime());
          console.log(`parseDate: created date object valid: ${isValidDate}`, isValidDate ? dateObj.toISOString() : 'Invalid date');
          
          if (isValidDate) {
            // בדיקת התוצאה הסופית בפורמט עברי
            const hebrewFormat = dateObj.toLocaleDateString('he-IL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            console.log(`parseDate: hebrew formatted result: "${hebrewFormat}"`);
            
            const monthYearFormat = dateObj.toLocaleDateString('he-IL', {
              month: 'long',
              year: 'numeric'
            });
            console.log(`parseDate: month-year format: "${monthYearFormat}"`);
            
            return dateObj;
          }
        } else {
          console.warn(`parseDate: invalid date components detected`);
        }
      } else {
        console.log(`parseDate: incorrect number of date parts: ${dateParts.length}`);
      }
    } else {
      console.log(`parseDate: date string does not contain '/'`);
      
      // בדיקה אם יש חיבור -
      if (cleanedDateStr.includes('-')) {
        console.log(`parseDate: date string contains '-', trying ISO format parsing`);
        // תאריך בפורמט ISO כמו YYYY-MM-DD
        const isoDate = new Date(cleanedDateStr);
        if (!isNaN(isoDate.getTime())) {
          console.log(`parseDate: ISO date parsing successful:`, isoDate.toISOString());
          return isoDate;
        }
      }
    }
    
    // ניסיון פרסור רגיל של JS
    console.log(`parseDate: attempting standard JS Date parsing`);
    const date = new Date(cleanedDateStr);
    const isValidStandardDate = !isNaN(date.getTime());
    
    if (isValidStandardDate) {
      console.log(`parseDate: standard JS parsing successful:`, date.toISOString());
      
      // בדיקת התוצאה הסופית בפורמט עברי
      const hebrewFormat = date.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      console.log(`parseDate: hebrew formatted result (standard): "${hebrewFormat}"`);
      
      return date;
    } else {
      console.log(`parseDate: standard JS parsing failed, result is invalid date`);
    }
    
    console.log(`parseDate: all parsing methods failed for "${dateStr}"`);
    return null;
  } catch (e) {
    console.error(`parseDate: Error parsing date "${dateStr}":`, e);
    return null;
  }
};

/**
 * פונקציה לעיבוד נתוני דוח ממסד הנתונים לפורמט מובנה
 */
export const formatReportData = (data: any[]): ShiftRecord[] => {
  console.log(`formatReportData: Starting to format ${data?.length || 0} records`);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('formatReportData: No data received or empty array');
    return [];
  }

  try {
    console.log('formatReportData: Sample raw record:', data[0]);
    
    const formattedData: ShiftRecord[] = data
      .filter(row => {
        if (!Array.isArray(row) || row.length < 9) {
          console.warn(`formatReportData: Skipping invalid row. Expected 9+ elements, got ${row?.length || 0}:`, row);
          return false;
        }
        return true;
      })
      .map((row, index) => {
        try {
          const dateRaw = row[4] || ''; // Date is at index 4
          const startTimeRaw = row[5] || ''; // StartTime is at index 5
          const endTimeRaw = row[6] || ''; // EndTime is at index 6
          
          if (index < 3 || index % 20 === 0) {
            console.log(`formatReportData: Processing record #${index}:`, {
              medicName: row[1],
              date: dateRaw,
              startTime: startTimeRaw,
              endTime: endTimeRaw
            });
          }
          
          // פרסור התאריך
          const parsedDate = parseDate(dateRaw);
          
          if (!parsedDate) {
            console.warn(`formatReportData: Failed to parse date for record #${index}:`, dateRaw);
            // ממשיכים גם ללא תאריך, יתכן שאין צורך בזה לצורך הדוח
          } else if (index < 3) {
            console.log(`formatReportData: Successfully parsed date for record #${index}:`, parsedDate);
          }
          
          // פרסור שעת התחלה וסיום
          const startTime = startTimeRaw || '';
          const endTime = endTimeRaw || '';
          
          return {
            medicName: row[1] || '',  // MedicName is at index 1
            shiftType: row[2] || '',  // ShiftType is at index 2
            doctorName: row[3] || '', // DoctorName is at index 3
            date: parsedDate ? parsedDate.toISOString() : '',
            rawDate: dateRaw,
            startTime,
            endTime,
            calculatedHours: parseFloat(row[7]) || 0, // CalculatedHours is at index 7
            reportedHours: parseFloat(row[8]) || 0   // ReportedHours is at index 8
          } as ShiftRecord;
        } catch (error) {
          console.error(`formatReportData: Error formatting record #${index}:`, error, row);
          return null;
        }
      })
      .filter((record): record is ShiftRecord => record !== null);

    console.log(`formatReportData: Successfully formatted ${formattedData.length} records out of ${data.length} raw records`);
    if (formattedData.length > 0) {
      console.log('formatReportData: Sample formatted record:', formattedData[0]);
    }
    
    return formattedData;
  } catch (error) {
    console.error('formatReportData: Error formatting report data:', error);
    return [];
  }
}; 