/**
 * סקריפט פשוט להצגת נתוני משמרות
 */

// קבוע של ה-ID של הגיליון
const SPREADSHEET_ID = '1UxQn7mAinamXXZ6WuK0Zp8aRdfYqXCQ6mf-n4fYVZ8c';
const SHIFT_CARD_SHEET_NAME = 'Shift_card';

/**
 * פונקציה ראשית לטיפול בבקשות HTTP
 */
function doGet(e) {
  console.log('Starting doGet function');
  
  try {
    // הוספת CORS headers
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // בדיקה אם זו בקשת OPTIONS (preflight)
    if (e && e.parameter && e.parameter.method === 'OPTIONS') {
      return output.setContent(JSON.stringify({ status: 'ok' }));
    }
    
    // נתב את הבקשה לפי הפעולה המבוקשת
    const action = e && e.parameter ? e.parameter.action : 'getShiftReport';
    
    console.log(`Processing GET request with action: ${action}`);
    
    // במקרה שלנו תמיד נשלוף את נתוני המשמרות
    const shiftData = getShiftReportData();
    
    console.log(`Got data with success=${shiftData.success}, count=${shiftData.shifts.length}`);
    
    return output.setContent(JSON.stringify(shiftData));
    
  } catch (error) {
    console.error(`Error in doGet: ${error.toString()}`);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'שגיאה: ' + error.toString(),
      shifts: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * פונקציה לשליפת נתוני דוח משמרות
 */
function getShiftReportData() {
  try {
    console.log('Fetching shift report data from Shift_card');
    
    // פתיחת הגיליון
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHIFT_CARD_SHEET_NAME);
    
    if (!sheet) {
      console.error(`Sheet ${SHIFT_CARD_SHEET_NAME} not found`);
      return { 
        success: false,
        error: `גיליון ${SHIFT_CARD_SHEET_NAME} לא נמצא`,
        shifts: []
      };
    }
    
    // קריאת כל הנתונים מהגיליון
    const data = sheet.getDataRange().getValues();
    
    console.log(`Retrieved ${data.length} total rows from ${SHIFT_CARD_SHEET_NAME}`);
    
    // אם יש פחות משתי שורות (כותרת + תוכן), הגיליון למעשה ריק
    if (data.length < 2) {
      console.log(`Sheet ${SHIFT_CARD_SHEET_NAME} has only header row, no data`);
      return {
        success: true,
        shifts: [],
      };
    }
    
    // שמירת שורת הכותרות
    const headers = data[0];
    console.log(`Headers: ${headers.join(', ')}`);
    
    // הסרת שורת הכותרות וסינון שורות ריקות
    const shifts = data.slice(1).filter(row => {
      // שורה נחשבת לא ריקה אם יש בה לפחות תא אחד עם תוכן
      return row.some(cell => cell !== '');
    });
    
    console.log(`Filtered data has ${shifts.length} non-empty rows`);
    
    // לוג מפורט יותר של הנתונים
    if (shifts.length > 0) {
      console.log(`First row sample: ${JSON.stringify(shifts[0])}`);
    }
    
    return {
      success: true,
      shifts: shifts,
    };
  } catch (error) {
    console.error(`Error in getShiftReportData: ${error.toString()}`);
    return { 
      success: false,
      error: 'שגיאה בשליפת נתוני דוח: ' + error.toString(),
      shifts: []
    };
  }
}