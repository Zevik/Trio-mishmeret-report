import { useState, useEffect } from 'react';
import { format, parse, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildGASUrl } from '../utils/environment';
import { Skeleton } from '@/components/ui/skeleton';

// סוג נתונים עבור משמרת
interface Shift {
  date: string;         // תאריך המשמרת (עמודה E)
  doctorName: string;   // שם הרפואן (עמודה B)
  calculatedHours: string; // שעות מחושבות (עמודה H)
  manualHours: string;  // שעות שהוזנו ידנית (עמודה I)
}

// סוג נתונים עבור סיכום שעות של רפואן
interface DoctorSummary {
  doctorName: string;
  totalHours: number;
}

export default function Report() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // ברירת מחדל: החודש הנוכחי
    return format(new Date(), 'yyyy-MM');
  });
  
  // רשימת החודשים להצגה בתפריט הבחירה (תתעדכן לאחר טעינת הנתונים)
  const monthOptions = availableMonths.map(monthStr => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return {
      value: monthStr,
      label: format(date, 'MMMM yyyy', { locale: he })
    };
  });

  // פונקציה לחילוץ חודש מתאריך במגוון פורמטים
  const extractMonthFromDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    // פונקציה לניקוי התאריך מתווים מיוחדים
    const cleanDateStr = dateStr.trim();
    
    // בדיקה שמדובר בתאריך ולא במחרוזת אחרת
    if (!cleanDateStr.includes('/')) return null;
    
    try {
      // ניסיון פרסור בפורמט DD/MM/YYYY (הפורמט הנפוץ ביותר בגיליון)
      const dateParts = cleanDateStr.split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
          return `${year}-${month.toString().padStart(2, '0')}`;
        }
      }
      
      // ניסיון פרסור בפורמט DD/MM/YYYY HH:MM:SS
      if (cleanDateStr.includes(' ')) {
        const simpleDatePart = cleanDateStr.split(' ')[0];
        const simpleTimeParts = simpleDatePart.split('/');
        
        if (simpleTimeParts.length === 3) {
          const day = parseInt(simpleTimeParts[0]);
          const month = parseInt(simpleTimeParts[1]);
          const year = parseInt(simpleTimeParts[2]);
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
            return `${year}-${month.toString().padStart(2, '0')}`;
          }
        }
      }
      
      return null;
    } catch (e) {
      console.warn('Failed to extract month from date:', dateStr);
      return null;
    }
  };

  // פונקציה לטעינת נתוני המשמרות מ-Google Sheets
  const fetchShiftData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = buildGASUrl('getShiftReport');
      console.log('Fetching shift report from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`שגיאה בטעינת נתונים: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received shift data:', data);
      
      if (data.statusCode !== 200) {
        throw new Error(data.error || data.message || 'שגיאה בטעינת נתונים');
      }
      
      // ניקוי ועיבוד נתוני המשמרות
      const shiftsData: Shift[] = (data.shifts || [])
        .filter((shift: any) => shift && typeof shift === 'object')
        .filter((shift: any) => {
          // שומרים רק רשומות עם תאריך תקין
          const hasValidDate = shift.date && shift.date.includes && shift.date.includes('/');
          return hasValidDate && shift.doctorName;
        });
      
      console.log(`Filtered to ${shiftsData.length} valid shifts`);
      console.log('Shift data example:', shiftsData.length > 0 ? shiftsData[0] : 'No shifts');
      
      // שמירת נתוני המשמרות המסוננים
      setShifts(shiftsData);
      
      // חילוץ החודשים הזמינים (אחרי סינון)
      const months = new Set<string>();
      
      // עיבוד התאריכים וחילוץ החודשים
      shiftsData.forEach(shift => {
        const monthKey = extractMonthFromDate(shift.date);
        if (monthKey) {
          months.add(monthKey);
          console.log('Added month:', monthKey, 'from date:', shift.date);
        }
      });
      
      // המרה לרשימה ומיון
      const sortedMonths = Array.from(months).sort().reverse();
      console.log('Available months:', sortedMonths);
      
      if (sortedMonths.length === 0) {
        // אם אין חודשים, נוסיף את החודש הנוכחי והקודם
        const now = new Date();
        const currentMonth = format(now, 'yyyy-MM');
        const lastMonth = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM');
        
        sortedMonths.push(currentMonth, lastMonth);
        console.log('No months found, using current and previous:', sortedMonths);
      }
      
      // עדכון רשימת החודשים הזמינים
      setAvailableMonths(sortedMonths);
      
      // עדכון החודש הנבחר (אם יש חודשים זמינים וחודש ברירת המחדל לא נמצא ברשימה)
      if (sortedMonths.length > 0 && !sortedMonths.includes(selectedMonth)) {
        setSelectedMonth(sortedMonths[0]);
      }
    } catch (err: any) {
      console.error('Error fetching shift data:', err);
      setError(err.message || 'שגיאה בטעינת נתונים');
      
      // במקרה של שגיאה, נגדיר חודש אחד (החודש הנוכחי) כברירת מחדל
      const currentMonth = format(new Date(), 'yyyy-MM');
      setAvailableMonths([currentMonth]);
      setSelectedMonth(currentMonth);
    } finally {
      setLoading(false);
    }
  };

  // טעינת נתונים בעת טעינת העמוד
  useEffect(() => {
    fetchShiftData();
  }, []);

  // פילטור המשמרות לפי החודש הנבחר
  const filteredShifts = shifts.filter(shift => {
    if (!shift.date) return false;
    
    // חילוץ החודש מהתאריך
    const shiftMonth = extractMonthFromDate(shift.date);
    return shiftMonth === selectedMonth;
  });

  // פונקציה להמרת שעות ודקות למספר
  const extractHoursFromString = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
    try {
      // בדיקה אם יש מספר ישיר
      const directNumber = parseFloat(timeStr);
      if (!isNaN(directNumber)) return directNumber;
      
      // חיפוש פורמט של "XX שעות-YY דקות"
      const hoursMinutesMatch = timeStr.match(/(\d+)\s*שעות\s*-\s*(\d+)\s*דקות/);
      if (hoursMinutesMatch) {
        const hours = parseInt(hoursMinutesMatch[1]);
        const minutes = parseInt(hoursMinutesMatch[2]);
        return hours + (minutes / 60);
      }
      
      // חיפוש פורמט של "שעות XX" או רק "XX"
      const hoursMatch = timeStr.match(/(\d+(\.\d+)?)/);
      if (hoursMatch) {
        return parseFloat(hoursMatch[1]);
      }
      
      // חיפוש פורמט של Sat Dec 30 1899 HH:MM:00 GMT+0220
      const dateTimeMatch = timeStr.match(/\d+:\d+/);
      if (dateTimeMatch) {
        const [hours, minutes] = dateTimeMatch[0].split(':').map(Number);
        return hours + (minutes / 60);
      }
      
      return 0;
    } catch (e) {
      console.warn('Failed to parse hours from:', timeStr);
      return 0;
    }
  };

  // חישוב סיכום שעות לכל רפואן
  const calculateDoctorSummaries = (): DoctorSummary[] => {
    const doctorMap = new Map<string, number>();
    
    filteredShifts.forEach(shift => {
      if (!shift.doctorName) return;
      
      let hours = 0;
      
      // בדיקה אם יש ערך בשעות ידניות (עמודה I)
      if (shift.manualHours && shift.manualHours.trim() !== '') {
        const manualHoursNum = extractHoursFromString(shift.manualHours);
        hours = manualHoursNum;
      } 
      // אחרת, השתמש בשעות המחושבות (עמודה H)
      else if (shift.calculatedHours && shift.calculatedHours.trim() !== '') {
        const calcHoursNum = extractHoursFromString(shift.calculatedHours);
        hours = calcHoursNum;
      }
      
      console.log(`Doctor: ${shift.doctorName}, Hours: ${hours} (from: ${shift.calculatedHours} / ${shift.manualHours})`);
      
      const currentTotal = doctorMap.get(shift.doctorName) || 0;
      doctorMap.set(shift.doctorName, currentTotal + hours);
    });
    
    // המרה למערך וסידור לפי שם הרפואן
    return Array.from(doctorMap.entries())
      .map(([doctorName, totalHours]) => ({ doctorName, totalHours }))
      .sort((a, b) => a.doctorName.localeCompare(b.doctorName, 'he'));
  };

  // חישוב סיכום שעות - אם אין נתונים מהשרת או שיש שגיאה, מציגים מערך ריק
  const doctorSummaries = filteredShifts.length > 0 
    ? calculateDoctorSummaries() 
    : [];

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">דוח שעות רפואנים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-lg font-semibold">בחירת חודש:</h2>
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר חודש" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם הרפואן</TableHead>
                    <TableHead className="text-center">סה"כ שעות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorSummaries.length > 0 ? (
                    doctorSummaries.map((summary, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{summary.doctorName}</TableCell>
                        <TableCell className="text-center">{summary.totalHours.toFixed(1)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4">
                        לא נמצאו נתונים לחודש זה
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-4 text-center text-sm text-gray-500">
                סה"כ רפואנים: {doctorSummaries.length}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}