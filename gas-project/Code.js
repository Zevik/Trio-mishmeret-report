/**
 * קובץ Google Apps Script מקיף לניהול טופס דיווח משמרות
 * 
 * הקובץ מכיל פונקציות ל:
 * 1. אימות משתמשים מול גיליון Medic_card
 * 2. שליפת רשימת רופאים לפי סוג משמרת
 * 3. שמירת נתוני משמרת בגיליון Shift_card
 * 
 * הוראות התקנה:
 * 1. פתח את גיליון Google Sheets שלך (ID: 1UxQn7mAinamXXZ6WuK0Zp8aRdfYqXCQ6mf-n4fYVZ8c)
 * 2. לחץ על תפריט "כלים" > "עורך הסקריפטים"
 * 3. העתק את הקוד הזה לתוך העורך
 * 4. שמור את הפרויקט (תן לו שם כמו "מערכת דיווח משמרות")
 * 5. לחץ על "פריסה" > "פריסה חדשה" > "ווב אפליקציה"
 * 6. הגדר:
 *    - מי מריץ את האפליקציה: "אני" (או חשבון שירות)
 *    - מי יכול לגשת: "כל אחד, אפילו אנונימי"
 * 7. לחץ על "פרוס"
 * 8. העתק את כתובת האינטרנט שתתקבל - זו הכתובת שתשמש את האפליקציה
 */

// קבועים גלובליים
const SPREADSHEET_ID = '1UxQn7mAinamXXZ6WuK0Zp8aRdfYqXCQ6mf-n4fYVZ8c';
const MEDIC_CARD_SHEET_NAME = 'Medic_card';
const CLIENT_CARD_SHEET_NAME = 'Client_card';
const SHIFT_CARD_SHEET_NAME = 'Shift_card';

/**
 * פונקציה ראשית לטיפול בבקשות HTTP
 * מנתבת את הבקשות לפונקציות המתאימות לפי הנתיב
 */
function doGet(e) {
  try {
    // בדיקה אם זו בקשת OPTIONS (preflight)
    if (e.parameter && e.parameter.method === 'OPTIONS') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // בדיקה אם יש פרמטרים בבקשה
    if (!e || !e.parameter) {
      return createJsonResponse({ error: 'חסרים פרמטרים בבקשה' }, 400);
    }

    // נתב את הבקשה לפי הפעולה המבוקשת
    const action = e.parameter.action;
    
    console.log(`Processing GET request with action: ${action}`);
    
    switch (action) {
      case 'verifyUser':
        return verifyUser(e.parameter.userId);
      
      case 'getDoctors':
        return getDoctorsByType(e.parameter.shiftType);
      
      case 'getInstructors':
        return getInstructors();
      
      case 'getShiftReport':
        return getShiftReport();
      
      case 'ping':
        return createJsonResponse({ status: 'ok', message: 'שירות API זמין' }, 200);
      
      default:
        return createJsonResponse({ error: 'פעולה לא מוכרת' }, 400);
    }
  } catch (error) {
    console.error(`Error in doGet: ${error.toString()}`);
    return createJsonResponse({ error: 'שגיאה כללית: ' + error.toString() }, 500);
  }
}

/**
 * פונקציה ראשית לטיפול בבקשות POST
 * מיועדת בעיקר לשמירת נתוני משמרת
 */
function doPost(e) {
  try {
    // טיפול בבקשות OPTIONS (pre-flight CORS)
    if (e.method === 'OPTIONS') {
      return ContentService.createTextOutput(JSON.stringify({ message: 'CORS enabled' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // בדיקה שיש תוכן בבקשה
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ error: 'חסר תוכן בבקשה' }, 400);
    }

    // פענוח הנתונים שנשלחו
    const data = JSON.parse(e.postData.contents);
    
    console.log(`Processing POST request with data: ${JSON.stringify(data).substring(0, 100)}...`);
    
    // בדיקה אם יש פעולה מוגדרת
    const action = e.parameter && e.parameter.action ? e.parameter.action : 'submitShift';
    
    switch (action) {
      case 'submitShift':
        return submitShiftData(data);
      
      default:
        return createJsonResponse({ error: 'פעולת POST לא מוכרת' }, 400);
    }
  } catch (error) {
    console.error(`Error in doPost: ${error.toString()}`);
    return createJsonResponse({ error: 'שגיאה בעיבוד בקשת POST: ' + error.toString() }, 500);
  }
}

/**
 * פונקציה לאימות משתמש - מחזירה נתונים בלבד
 */
function verifyUserData(userId) {
  try {
    console.log(`Verifying user with ID: ${userId}`);
    
    // בדיקה שמספר הזהות תקין
    if (!userId || userId.length < 5) {
      return { error: 'מספר תעודת זהות חייב להיות לפחות 5 ספרות', statusCode: 400 };
    }

    // ניקוי מספר הזהות מתווים שאינם ספרות
    const cleanedUserId = userId.toString().replace(/\D/g, '');
    
    // פתיחת הגיליון
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(MEDIC_CARD_SHEET_NAME);
    
    if (!sheet) {
      return { error: `גיליון ${MEDIC_CARD_SHEET_NAME} לא נמצא`, statusCode: 404 };
    }
    
    // קריאת כל הנתונים מהגיליון
    const data = sheet.getDataRange().getValues();
    
    console.log(`Searching for user ID ${cleanedUserId} in ${data.length} rows`);
    
    // חיפוש המשתמש לפי מספר תעודת זהות בעמודה F (אינדקס 5)
    for (let i = 1; i < data.length; i++) { // מתחילים מ-1 כדי לדלג על כותרות
      const row = data[i];
      
      // בדיקה אם יש התאמה בעמודה F (אינדקס 5)
      if (row[5] && row[5].toString().replace(/\D/g, '') === cleanedUserId) {
        // מחזירים את שם המשתמש מעמודה B (אינדקס 1)
        const userName = row[1] || '';
        
        console.log(`Found user: ${userName}`);
        
        return {
          success: true,
          userId: cleanedUserId,
          userName: userName,
          statusCode: 200
        };
      }
    }
    
    // אם לא נמצא משתמש
    console.log(`User not found: ${cleanedUserId}`);
    return { error: 'משתמש לא נמצא', statusCode: 404 };
  } catch (error) {
    console.error(`Error in verifyUser: ${error.toString()}`);
    return { error: 'שגיאה באימות משתמש: ' + error.toString(), statusCode: 500 };
  }
}

/**
 * פונקציה לשליפת רשימת רופאים - מחזירה נתונים בלבד
 */
function getDoctorsByTypeData(shiftType) {
  try {
    console.log(`Getting doctors for shift type: ${shiftType}`);
    
    if (!shiftType) {
      return { error: 'חסר סוג משמרת', statusCode: 400 };
    }
    
    // פתיחת הגיליון
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CLIENT_CARD_SHEET_NAME);
    
    if (!sheet) {
      return { error: `גיליון ${CLIENT_CARD_SHEET_NAME} לא נמצא`, statusCode: 404 };
    }
    
    // קריאת כל הנתונים מהגיליון
    const data = sheet.getDataRange().getValues();
    
    // מערך לשמירת הרופאים המתאימים
    const doctors = [];
    
    // חיפוש רופאים לפי סוג משמרת
    for (let i = 1; i < data.length; i++) { // מתחילים מ-1 כדי לדלג על כותרות
      const row = data[i];
      const doctorType = row[0] || ''; // עמודה A (אינדקס 0) - סוג רופא
      const doctorName = row[1] || ''; // עמודה B (אינדקס 1) - שם רופא
      
      // בדיקה אם הרופא מתאים לסוג המשמרת
      if (
        (shiftType === 'מיזם טריו' && doctorType === 'מיזם טריו') ||
        (shiftType === 'רפואה שלמה' && doctorType === 'רפואה שלמה') ||
        (shiftType === 'דמו' && doctorType === 'מיזם טריו')
      ) {
        if (doctorName) {
          doctors.push(doctorName);
        }
      }
    }
    
    console.log(`Found ${doctors.length} doctors for shift type: ${shiftType}`);
    
    return {
      success: true,
      doctors: doctors,
      statusCode: 200
    };
  } catch (error) {
    console.error(`Error in getDoctorsByType: ${error.toString()}`);
    return { error: 'שגיאה בשליפת רופאים: ' + error.toString(), statusCode: 500 };
  }
}

/**
 * פונקציה לשליפת רשימת מדריכים - מחזירה נתונים בלבד
 */
function getInstructorsData() {
  try {
    console.log(`Getting instructors`);
    
    // פתיחת הגיליון
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CLIENT_CARD_SHEET_NAME);
    
    if (!sheet) {
      return { error: `גיליון ${CLIENT_CARD_SHEET_NAME} לא נמצא`, statusCode: 404 };
    }
    
    // קריאת כל הנתונים מהגיליון
    const data = sheet.getDataRange().getValues();
    
    // מערך לשמירת המדריכים
    const instructors = [];
    
    // חיפוש מדריכים
    for (let i = 1; i < data.length; i++) { // מתחילים מ-1 כדי לדלג על כותרות
      const row = data[i];
      const type = row[0] || ''; // עמודה A (אינדקס 0) - סוג
      const name = row[1] || ''; // עמודה B (אינדקס 1) - שם
      
      if (type === 'הכשרה' && name) {
        instructors.push(name);
      }
    }
    
    console.log(`Found ${instructors.length} instructors`);
    
    return {
      success: true,
      instructors: instructors,
      statusCode: 200
    };
  } catch (error) {
    console.error(`Error in getInstructors: ${error.toString()}`);
    return { error: 'שגיאה בשליפת מדריכים: ' + error.toString(), statusCode: 500 };
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
      return { 
        error: `גיליון ${SHIFT_CARD_SHEET_NAME} לא נמצא`, 
        statusCode: 404 
      };
    }
    
    // קריאת כל הנתונים מהגיליון
    const data = sheet.getDataRange().getValues();
    
    console.log(`Retrieved ${data.length} rows from ${SHIFT_CARD_SHEET_NAME}`);
    
    // הסרת שורת הכותרות והמרה לפורמט JSON
    const headers = data[0];
    const shifts = data.slice(1).map(row => row);
    
    return {
      success: true,
      shifts: shifts,
      statusCode: 200
    };
  } catch (error) {
    console.error(`Error in getShiftReportData: ${error.toString()}`);
    return { 
      error: 'שגיאה בשליפת נתוני דוח: ' + error.toString(),
      statusCode: 500 
    };
  }
}

/**
 * פונקציה לשמירת נתוני משמרת - מחזירה נתונים בלבד
 */
function submitShiftDataAndGetResponse(formData) {
  try {
    console.log(`Submitting shift data`);
    
    // בדיקה שיש נתונים
    if (!formData) {
      return { error: 'חסרים נתוני משמרת', statusCode: 400 };
    }
    
    // בדיקות תקינות בסיסיות
    if (!formData.shiftType) {
      return { error: 'חסר סוג משמרת', statusCode: 400 };
    }
    
    if (!formData.sessionDate || !formData.startTime || !formData.endTime) {
      return { error: 'חסרים פרטי זמן משמרת', statusCode: 400 };
    }
    
    // פתיחת הגיליון
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHIFT_CARD_SHEET_NAME);
    
    if (!sheet) {
      return { error: `גיליון ${SHIFT_CARD_SHEET_NAME} לא נמצא`, statusCode: 404 };
    }
    
    // הכנת מערך הנתונים לשמירה
    const dataArray = prepareShiftDataArray(formData);
    
    // הוספת השורה לגיליון
    sheet.appendRow(dataArray);
    
    console.log(`Shift data saved successfully`);
    
    // שליחת אימייל לממלא הטופס
    try {
      sendEmailToUser(formData);
    } catch (emailError) {
      console.error(`Error sending email: ${emailError.toString()}`);
      // ממשיכים גם אם יש שגיאה בשליחת האימייל
    }
    
    return {
      success: true,
      message: 'נתוני המשמרת נשמרו בהצלחה',
      statusCode: 200
    };
  } catch (error) {
    console.error(`Error in submitShiftData: ${error.toString()}`);
    return { error: 'שגיאה בשמירת נתוני משמרת: ' + error.toString(), statusCode: 500 };
  }
}

/**
 * פונקציה לשליחת אימייל לממלא הטופס
 */
function sendEmailToUser(formData) {
  try {
    // בדיקה שיש מזהה משתמש
    if (!formData.userId) {
      console.log("Missing userId, cannot send email");
      return;
    }
    
    // פתיחת הגיליון
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(MEDIC_CARD_SHEET_NAME);
    
    if (!sheet) {
      console.error(`Sheet ${MEDIC_CARD_SHEET_NAME} not found`);
      return;
    }
    
    // קריאת כל הנתונים מהגיליון
    const data = sheet.getDataRange().getValues();
    
    // חיפוש המשתמש לפי מספר תעודת זהות בעמודה F (אינדקס 5)
    let userEmail = null;
    const cleanedUserId = formData.userId.toString().replace(/\D/g, '');
    
    for (let i = 1; i < data.length; i++) { // מתחילים מ-1 כדי לדלג על כותרות
      const row = data[i];
      
      // בדיקה אם יש התאמה בעמודה F (אינדקס 5)
      if (row[5] && row[5].toString().replace(/\D/g, '') === cleanedUserId) {
        // מחלצים את האימייל מעמודה D (אינדקס 3)
        userEmail = row[3];
        break;
      }
    }
    
    if (!userEmail) {
      console.log(`Email not found for user ID: ${formData.userId}`);
      return;
    }
    
    console.log(`Found email ${userEmail} for user ID: ${formData.userId}`);
    
    // בניית תוכן האימייל
    const subject = `אישור דיווח משמרת - ${formData.shiftType}`;
    
    let htmlBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #3366cc; border-bottom: 1px solid #ddd; padding-bottom: 10px;">אישור דיווח משמרת</h2>
        
        <p>שלום ${formData.userName},</p>
        
        <p>דיווח המשמרת שלך התקבל בהצלחה במערכת. להלן פרטי המשמרת:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">שדה</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">ערך</th>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">סוג משמרת</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.shiftType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">תאריך</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.sessionDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">שעת התחלה</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.startTime}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">שעת סיום</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.endTime}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">משך זמן</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.calculatedDuration}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">מיקום</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.location}</td>
          </tr>
    `;
    
    // הוספת שדות לפי סוג המשמרת
    if (formData.shiftType === "רפואה שלמה") {
      htmlBody += `
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">שם רופא</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">מספר תיקים שטופלו</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.casesHandled}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">נשלחו צילומי מסך</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.screenshotsSent ? 'כן' : 'לא'}</td>
          </tr>
      `;
    } else if (formData.shiftType === "מיזם טריו") {
      htmlBody += `
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">שם רופא</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">מספר תיקים שטופלו</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.trioCasesHandled}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">משימות במערכת מכבי</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.macabiTasks}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">איכות המשמרת</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.shiftQuality}</td>
          </tr>
      `;
    } else if (formData.shiftType === "דמו") {
      htmlBody += `
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">שם רופא</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">מספר תיקים שטופלו</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.demoCasesHandled}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">סדר משמרת הדמו</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.demoOrder}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">בהירות התקשורת</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.communicationClarity}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">נעימות התקשורת</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.communicationPleasantness}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">נשלחו צילומי מסך</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.demoScreenshotsSent ? 'כן' : 'לא'}</td>
          </tr>
      `;
    } else if (formData.shiftType === "הכשרה") {
      htmlBody += `
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">שם המדריך</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.instructorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">סדר משמרת ההכשרה</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.trainingOrder}</td>
          </tr>
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">איכות ההדרכה</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.trainingQuality}</td>
          </tr>
      `;
    }
    
    // הוספת הערות אם יש
    if (formData.shiftNotes) {
      htmlBody += `
          <tr>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">הערות</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formData.shiftNotes}</td>
          </tr>
      `;
    }
    
    // סיום הטבלה והאימייל
    htmlBody += `
        </table>
        
        <p>תודה על הדיווח!</p>
        <p>בברכה,<br>מערכת דיווח משמרות</p>
      </div>
    `;
    
    // שליחת האימייל
    GmailApp.sendEmail(
      userEmail,
      subject,
      "אימייל זה מוצג בפורמט HTML. אנא אפשר תצוגת HTML כדי לראות את התוכן.",
      {
        htmlBody: htmlBody,
        name: "מערכת דיווח משמרות"
      }
    );
    
    console.log(`Email sent successfully to ${userEmail}`);
    
  } catch (error) {
    console.error(`Error in sendEmailToUser: ${error.toString()}`);
    throw error; // העברת השגיאה הלאה
  }
}

/**
 * פונקציה להכנת מערך הנתונים לשמירה בגיליון
 */
function prepareShiftDataArray(formData) {
  // מערך ריק עם 24 תאים כדי לכלול גם את עמודה X
  const dataArray = new Array(24).fill("");
  
  // A - חותמת זמן בפורמט DD/MM/YYYY HH:MM:SS
  const now = new Date();
  const formattedTimestamp = Utilities.formatDate(now, 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm:ss');
  dataArray[0] = formattedTimestamp;
  
  // B - שם רפואן
  dataArray[1] = formData.userName || '';
  
  // C - סוג משמרת
  dataArray[2] = formData.shiftType || '';
  
  // D - שם הרופא/מדריך
  if (formData.shiftType === "הכשרה") {
    dataArray[3] = formData.instructorName || '';
  } else {
    dataArray[3] = formData.doctorName || '';
  }
  
  // E - תאריך ססיה בפורמט DD/MM/YYYY
  // המרה מפורמט YYYY-MM-DD לפורמט DD/MM/YYYY
  if (formData.sessionDate) {
    const dateParts = formData.sessionDate.split('-');
    if (dateParts.length === 3) {
      dataArray[4] = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    } else {
      dataArray[4] = formData.sessionDate;
    }
  }
  
  // F - שעת התחלה
  dataArray[5] = formData.startTime || '';
  
  // G - שעת סיום
  dataArray[6] = formData.endTime || '';
  
  // H - משך משמרת מחושב
  dataArray[7] = formData.calculatedDuration || '';
  
  // I - משך משמרת ידני (רק אם המשתמש הזין ערך)
  if (formData.manualDuration && formData.manualDuration !== "00:00") {
    dataArray[8] = formData.manualDuration;
  }
  
  // J - מיקום המשמרת
  dataArray[9] = formData.location || '';
  
  // K - הערות למשמרת
  dataArray[10] = formData.shiftNotes || '';
  
  // שדות ייחודיים לפי סוג משמרת
  switch (formData.shiftType) {
    case "רפואה שלמה":
      // L - מספר התיקים שטופלו
      dataArray[11] = formData.casesHandled ? formData.casesHandled.toString() : "0";
      // Q - נשלחו צילומי מסך
      dataArray[16] = formData.screenshotsSent ? "כן" : "לא";
      break;
      
    case "מיזם טריו":
      // L - מספר תיקים שטופלו
      dataArray[11] = formData.trioCasesHandled ? formData.trioCasesHandled.toString() : "0";
      // M - מיזם טריו - משימות במערכת מכבי
      dataArray[12] = formData.macabiTasks ? formData.macabiTasks.toString() : "0";
      // N - איכות המשמרת
      dataArray[13] = formData.shiftQuality || "";
      break;
      
    case "דמו":
      // L - מספר התיקים שטופלו
      dataArray[11] = formData.demoCasesHandled ? formData.demoCasesHandled.toString() : "0";
      // O - דמו - בהירות התקשורת
      dataArray[14] = formData.communicationClarity || "";
      // P - דמו - נעימות התקשורת
      dataArray[15] = formData.communicationPleasantness || "";
      // Q - נשלחו צילומי מסך
      dataArray[16] = formData.demoScreenshotsSent ? "כן" : "לא";
      // R - סדר משמרת
      dataArray[17] = formData.demoOrder || "";
      break;
      
    case "הכשרה":
      // R - סדר משמרת
      dataArray[17] = formData.trainingOrder || "";
      // N - איכות ההדרכה
      dataArray[13] = formData.trainingQuality || "";
      break;
  }
  
  return dataArray;
}

/**
 * פונקציית עזר ליצירת תגובת JSON
 */
function createJsonResponse(data, statusCode) {
  // אם לא הועבר קוד סטטוס, השתמש בברירת מחדל 200
  if (typeof statusCode === 'undefined') {
    statusCode = 200;
  }
  
  // הוספת קוד סטטוס לנתונים
  var responseData = {};
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      responseData[key] = data[key];
    }
  }
  responseData.statusCode = statusCode;
  
  // יצירת תגובה עם סוג תוכן JSON
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * פונקציה לאימות משתמש - גרסה ישנה
 */
function verifyUser(userId) {
  return createJsonResponse(verifyUserData(userId));
}

/**
 * פונקציה לשליפת רשימת רופאים - גרסה ישנה
 */
function getDoctorsByType(shiftType) {
  return createJsonResponse(getDoctorsByTypeData(shiftType));
}

/**
 * פונקציה לשליפת רשימת מדריכים - גרסה ישנה
 */
function getInstructors() {
  return createJsonResponse(getInstructorsData());
}

/**
 * פונקציה לשליפת דוח שעות - גרסה ישנה
 */
function getShiftReport() {
  const reportData = getShiftReportData();
  return createJsonResponse(reportData, reportData.statusCode || 500);
}

/**
 * פונקציה לשמירת נתוני משמרת - גרסה ישנה
 */
function submitShiftData(formData) {
  return createJsonResponse(submitShiftDataAndGetResponse(formData));
}