/**
 * פונקציה שבודקת אם אנחנו בסביבת Netlify
 * נשמרת לצורך תאימות עם קוד קיים
 */
export function isNetlifyEnvironment(): boolean {
  const hostname = window.location.hostname;
  
  // אם אנחנו ב-localhost או replit, בטוח לא נטליפיי
  if (hostname === 'localhost' || 
      hostname.includes('.repl.co') || 
      hostname.includes('replit.dev')) {
    return false;
  }
  
  // אם אנחנו בדומיין של netlify או דומיין מותאם, בטוח נטליפיי
  return true;
}

/**
 * הגדרת משתני סביבה לפי הסביבה שהאפליקציה רצה בה
 */

// בדיקה האם משתמשים בנתונים מדומים
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// בסיס ה-URL של ה-API
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// כתובת ה-Google Apps Script
export const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 
  'https://script.google.com/macros/s/AKfycbxivT91bM88xJ3NxXnxmDMDdcr2Zzu8Kyb_8X-bGH5YjLUVTljGxAxUeWDK8uJ94fSGRQ/exec';

// פונקציה להמרת נתיבי API בהתאם לסביבה
// נשמרת לצורך תאימות עם קוד קיים
export function buildApiPath(endpoint: string): string {
  return endpoint;
}

/**
 * פונקציה לבניית כתובת URL מלאה לשירות Google Apps Script
 */
export function buildGASUrl(action: string, params: Record<string, string> = {}) {
  const url = new URL(GOOGLE_APPS_SCRIPT_URL);
  
  // הוספת פעולה כפרמטר
  url.searchParams.append('action', action);
  
  // הוספת פרמטרים נוספים
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  return url.toString();
}