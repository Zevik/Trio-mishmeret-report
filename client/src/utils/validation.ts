// Validate Israeli ID number (basic check)
export function isValidIsraeliId(id: string): boolean {
  // Make sure we have at least 5 digits for demo purposes
  if (!id || id.length < 5) return false;
  
  // In a real app, this would include the full Israeli ID validation algorithm
  // This is a simplified version for the demo
  return /^\d{5,9}$/.test(id);
}

// Check if a date is valid
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Check if manual duration format is valid (HH:MM)
export function isValidDuration(duration: string): boolean {
  if (!duration) return true; // Optional field
  
  // Check format HH:MM where HH is 00-23 and MM is 00-59
  const durationRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return durationRegex.test(duration);
}

// Check if time format is valid (HH:MM)
export function isValidTimeFormat(time: string): boolean {
  if (!time) return false;
  
  // Check format HH:MM where HH is 00-23 and MM is 00-59
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
}

// Validate that required fields are filled based on shift type
export function validateShiftFormFields(formData: any, shiftType: string): string | null {
  // Basic validation for all shift types
  if (!formData.sessionDate) return "תאריך הסשן הוא שדה חובה";
  if (!formData.startTime) return "שעת התחלה היא שדה חובה";
  if (!formData.endTime) return "שעת סיום היא שדה חובה";
  
  // Shift-type specific validation
  if (shiftType !== "הכשרה" && !formData.doctorName) return "שם הרופא הוא שדה חובה";
  if (shiftType === "הכשרה" && !formData.instructorName) return "שם המדריך הוא שדה חובה";
  
  return null; // No errors
}
