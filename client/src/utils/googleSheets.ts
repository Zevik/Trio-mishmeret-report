// ===== קובץ מיושן שהוחלף ב-googleSheetsUpdated.ts =====
// אנא השתמש ב-googleSheetsUpdated.ts במקום זה
// ===================================================

// לתשומת לב: פרוייקט זה משתמש בקובץ googleSheetsUpdated.ts
// קובץ זה נשמר רק לצורכי תיעוד והתייחסות היסטורית
// כל הפונקציות בקובץ הזה מכוונות לקובץ המעודכן מטה

import { FormData } from "@/context/ShiftFormContext";
import { buildApiPath } from './environment';
import { 
  fetchFromGoogleSheets as fetchSheets,
  fetchUserByIdFromSheet as fetchUser,
  fetchDoctorsByType as fetchDoctors,
  submitFormToSheets as submitForm
} from './googleSheetsUpdated';

// גרסאות מועתקות של הפונקציות מהקובץ החדש עם אותן חתימות
export const fetchFromGoogleSheets = fetchSheets;
export const fetchUserByIdFromSheet = fetchUser;
export const fetchDoctorsByType = fetchDoctors;
export const submitFormToSheets = submitForm;
