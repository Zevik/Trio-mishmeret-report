import { useState, useEffect } from 'react';
import { format, parse, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { buildGASUrl } from '../utils/environment';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMonthlyReport } from '@/utils/reportUtils';
import { formatHoursMinutes, parseTimeToMinutes, sumTimeStrings, parseDate } from '@/utils/timeUtils';
import { Box, Typography } from "@/components/ui/ui";

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

type ShiftRecord = {
  id: string;
  date: string;         // תאריך המשמרת - string in DD.MM.YYYY or DD/MM/YYYY format
  medicName: string;    // רפואן
  shiftType: string;
  doctorName: string;
  startTime: string;    // שעת התחלה - HH:MM format
  endTime: string;      // שעת סיום - HH:MM format
  totalHours: string;   // שעות מחושבות - HH:MM or decimal format
  reportedHours: string | null; // שעות שדווחו ידנית - HH:MM or decimal format
};

type MonthlyReportData = {
  medicHours: {
    [medicName: string]: number; // Minutes
  };
  months: string[];
};

const Report = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<ShiftRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ShiftRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ [medicName: string]: number }>({});

  const calculateMedicHours = (shifts: ShiftRecord[], month: string) => {
    console.log("=========== DEBUG: Starting calculateMedicHours ===========");
    console.log(`calculateMedicHours: Month parameter: "${month}"`);
    
    // Initialize data structures
    const medicHoursRaw: { [medicName: string]: string[] } = {};
    const medicHours: { [medicName: string]: number } = {};
    
    // For debugging
    // @ts-ignore
    window.debugShiftData = {
      shifts: [...shifts],
      month,
      calculations: [],
      medicHoursRaw: {}
    };
    
    // Filter by selected month
    const filtered = month ? 
      shifts.filter(shift => {
        try {
          console.log(`calculateMedicHours: Checking shift date: "${shift.date}" for ${shift.medicName}`);
          
          // Parse the date using parseDate from timeUtils
          const parsedDate = parseDate(shift.date);
          
          // Check if we were able to parse the date
          if (!parsedDate) {
            console.warn(`Invalid date format for filtering: ${shift.date}`);
            return false;
          }
          
          // Format for debugging
          console.log(`calculateMedicHours: Parsed date: ${parsedDate.toISOString()}`);
          
          // Get formatted month and year for comparison
          const shiftMonthYear = parsedDate.toLocaleDateString('he-IL', { 
            month: 'long', 
            year: 'numeric' 
          });
          
          const matches = shiftMonthYear === month;
          console.log(`calculateMedicHours: Filtering shift for ${shift.medicName}: ${shift.date} => ${shiftMonthYear} - matches "${month}": ${matches}`);
          
          return matches;
        } catch (err) {
          console.error(`Error filtering date: ${shift.date}`, err);
          return false;
        }
      }) : shifts;
      
    // Log filtered shift count
    console.log(`calculateMedicHours: Filtered shifts: ${filtered.length} out of ${shifts.length} total shifts`);
    
    if (filtered.length > 0) {
      console.log("calculateMedicHours: Sample filtered shifts:");
      filtered.slice(0, 3).forEach((shift, i) => {
        console.log(`  [${i}] ${shift.medicName}, ${shift.date}, hours: ${shift.totalHours || 'none'}`);
      });
    }
    
    // Count shifts per medic after filtering
    const countByMedic = filtered.reduce((acc, shift) => {
      acc[shift.medicName] = (acc[shift.medicName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("calculateMedicHours: Shifts per medic after filtering:", countByMedic);
    
    // Process each shift and calculate total minutes per medic
    filtered.forEach(shift => {
      const medicName = shift.medicName;
      
      if (!medicName) {
        console.warn("calculateMedicHours: Skipping shift with no medic name", shift);
        return;
      }
      
      // Initialize if not exists
      if (!medicHours[medicName]) {
        medicHours[medicName] = 0;
        medicHoursRaw[medicName] = [];
      }
      
      // Calculate minutes for this shift - prefer reported hours if available
      let shiftMinutes = 0;
      
      if (shift.reportedHours) {
        // Use manually reported hours
        shiftMinutes = parseTimeToMinutes(shift.reportedHours);
        console.log(`calculateMedicHours: Using reported hours for ${medicName}: ${shift.reportedHours} -> ${shiftMinutes} minutes`);
      } else if (shift.totalHours) {
        // Use calculated hours
        shiftMinutes = parseTimeToMinutes(shift.totalHours);
        console.log(`calculateMedicHours: Using calculated hours for ${medicName}: ${shift.totalHours} -> ${shiftMinutes} minutes`);
      } else if (shift.startTime && shift.endTime) {
        // Calculate from start/end times
        shiftMinutes = calculateTimeDifference(shift.startTime, shift.endTime);
        console.log(`calculateMedicHours: Calculated from times for ${medicName}: ${shift.startTime}-${shift.endTime} -> ${shiftMinutes} minutes`);
      }
      
      // Skip if we couldn't calculate minutes
      if (shiftMinutes <= 0) {
        console.warn(`calculateMedicHours: Zero or negative minutes calculated for ${medicName}, skipping shift`, shift);
        return;
      }
      
      // Add to total
      medicHours[medicName] += shiftMinutes;
      
      // Store raw values for debugging
      if (shift.reportedHours) {
        medicHoursRaw[medicName].push(shift.reportedHours);
      } else if (shift.totalHours) {
        medicHoursRaw[medicName].push(shift.totalHours);
      }
    });
    
    // Log final totals
    console.log("calculateMedicHours: Final hour totals per medic:");
    Object.entries(medicHours).forEach(([name, minutes]) => {
      console.log(`  ${name}: ${minutes} minutes (${formatHoursMinutes(minutes)})`);
    });
    
    // Store for debugging
    // @ts-ignore
    window.debugShiftData.medicHoursRaw = {...medicHoursRaw};
    // @ts-ignore
    window.debugShiftData.medicHours = {...medicHours};
    
    console.log("=========== DEBUG: Finished calculateMedicHours ===========");
    return medicHours;
  };

  const extractMonths = (data: ShiftRecord[]): string[] => {
    console.log('extractMonths: starting with data length:', data.length);
    
    try {
      const months = new Set<string>();
      
      // בדיקת תקינות נתונים
      if (!Array.isArray(data)) {
        console.error('extractMonths: data is not an array:', typeof data);
        return [];
      }
      
      // מעבר על כל הנתונים וחילוץ חודשים ייחודיים
      data.forEach((item, index) => {
        if (!item || !item.date) {
          console.warn(`extractMonths: item at index ${index} has no date:`, item);
          return;
        }
        
        try {
          const dateStr = item.date;
          
          // Use our parseDate function from timeUtils
          const parsedDate = parseDate(dateStr);
          if (!parsedDate) {
            console.warn(`extractMonths: could not parse date "${dateStr}" from item ${index}`);
            return;
          }
          
          const monthFormat = parsedDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
          months.add(monthFormat);
        } catch (e) {
          console.error(`extractMonths: Error processing item at index ${index}:`, e);
        }
      });
      
      // המרה למערך וסידור
      const uniqueMonths = Array.from(months);
      
      try {
        uniqueMonths.sort((a, b) => {
          // חילוץ שנה וחודש
          const aParts = a.split(' ');
          const bParts = b.split(' ');
          
          if (aParts.length < 2 || bParts.length < 2) {
            console.warn(`extractMonths: Invalid month format - a: "${a}", parts: ${aParts.length}, b: "${b}", parts: ${bParts.length}`);
            return 0;
          }
          
          const aMonth = aParts[0];
          const aYear = parseInt(aParts[1], 10);
          const bMonth = bParts[0];
          const bYear = parseInt(bParts[1], 10);
          
          // השוואה לפי שנים
          if (aYear !== bYear) {
            return bYear - aYear; // סדר יורד - חדש לישן
          }
          
          // אם השנים שוות, השוואה לפי חודש
          const aMonthIndex = getMonthIndex(aMonth);
          const bMonthIndex = getMonthIndex(bMonth);
          
          return bMonthIndex - aMonthIndex; // סדר יורד - חדש לישן
        });
      } catch (e) {
        console.error('extractMonths: Error during sorting:', e);
      }
      
      // הוספת אופציית "כל החודשים"
      if (uniqueMonths.length > 0) {
        // אופציית "כל החודשים" תתווסף בקומפוננטה עצמה
        console.log('extractMonths: extracted and sorted unique months:', uniqueMonths);
      } else {
        console.log('extractMonths: no months found');
      }
      
      return uniqueMonths;
    } catch (e) {
      console.error('extractMonths: global error:', e);
      return [];
    }
  };

  // פונקציית עזר להמרת שם חודש עברי לאינדקס
  const getMonthIndex = (hebrewMonth: string): number => {
    const hebrewMonths = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    
    const index = hebrewMonths.indexOf(hebrewMonth);
    if (index === -1) {
      console.warn(`getMonthIndex: unknown Hebrew month "${hebrewMonth}"`);
      return 0;
    }
    
    return index;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log(`loadData: Fetching report data...`);
        const data = await fetchMonthlyReport();
        console.log(`loadData: Received ${data?.length || 0} records from API`);
        console.log(`loadData: First record sample:`, data && data.length > 0 ? data[0] : 'No data');
        
        // Convert data from Google Sheets format to our format
        const formattedData: ShiftRecord[] = data.map((row: any, index: number) => {
          const record = {
            id: `${index}`,
            date: row[4], // E column - תאריך המשמרת
            medicName: row[1], // B column - שם רפואן
            shiftType: row[2], // C column - סוג המשמרת
            doctorName: row[3], // D column - שם הרופא
            startTime: row[5], // F column - שעת התחלה
            endTime: row[6], // G column - שעת סיום
            totalHours: row[7], // H column - משך המשמרת מחושב
            reportedHours: row[8] || null, // I column - משך משמרת מדווח
          };
          
          if (index < 5) {
            console.log(`loadData: Formatted record #${index}:`, record);
          }
          
          return record;
        });
        
        console.log(`loadData: Formatted ${formattedData.length} records`);
        
        // בדיקת תאריכים
        console.log(`loadData: Validating date formats...`);
        const dateSamples = new Map<string, number>();
        const invalidDates: {index: number, date: string}[] = [];
        
        formattedData.forEach((record, index) => {
          const dateStr = record.date;
          if (!dateStr) {
            invalidDates.push({index, date: 'empty'});
            return;
          }
          
          // מעקב אחר פורמטים של תאריכים
          dateSamples.set(dateStr, (dateSamples.get(dateStr) || 0) + 1);
          
          // ניסיון לפרסר תאריך
          const parsedDate = parseDate(dateStr);
          if (!parsedDate) {
            invalidDates.push({index, date: dateStr});
          }
        });
        
        // הצגת סטטיסטיקה על התאריכים
        console.log(`loadData: Found ${dateSamples.size} unique date formats`);
        console.log(`loadData: Date format samples:`, 
          Array.from(dateSamples.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([format, count]) => `"${format}" (${count} occurrences)`)
        );
        
        if (invalidDates.length > 0) {
          console.warn(`loadData: Found ${invalidDates.length} records with invalid dates`);
          console.warn(`loadData: First 5 invalid dates:`, invalidDates.slice(0, 5));
        }
        
        setReportData(formattedData);
        setFilteredData(formattedData);
        
        // Extract available months
        console.log(`loadData: Extracting available months...`);
        const months = extractMonths(formattedData);
        console.log(`loadData: Extracted months array:`, months);
        
        // If months available, select the latest one
        if (months.length > 0) {
          // הוספת אופציית "כל החודשים"
          setAvailableMonths(months);
          
          // בחירת החודש האחרון כברירת מחדל (החודש העדכני ביותר)
          const latestMonth = months[0]; // אנחנו כבר מסדרים מהחדש לישן
          console.log(`loadData: Setting selected month to latest: "${latestMonth}"`);
          setSelectedMonth(latestMonth);
        } else {
          console.log(`loadData: No months available, setting to "all"`);
          setAvailableMonths([]);
          setSelectedMonth('all');
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading report data:", error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Update filtered data and summary when filters change
  useEffect(() => {
    console.log('Filter effect triggered - selectedMonth:', selectedMonth, 'searchTerm:', searchTerm);
    console.log('Current reportData length:', reportData.length);
    
    if (reportData.length === 0) {
      console.warn('No report data available to filter');
      return;
    }

    let filtered = [...reportData];
    
    // Filter by month
    if (selectedMonth && selectedMonth !== 'all') {
      console.log(`Filtering by month: "${selectedMonth}"`);
      filtered = filtered.filter(shift => {
        try {
          const dateStr = shift.date;
          
          // Attempt to parse date with our parseDate function from timeUtils
          const parsedDate = parseDate(dateStr);
          if (!parsedDate) {
            console.warn(`Could not parse date: "${dateStr}" - excluding from filter`);
            return false;
          }
          
          const monthYear = parsedDate.toLocaleDateString('he-IL', {
            month: 'long',
            year: 'numeric'
          });
          
          const matches = monthYear === selectedMonth;
          if (matches) {
            console.log(`Date "${dateStr}" matches filter: "${selectedMonth}"`);
          }
          
          return matches;
        } catch (e) {
          console.error(`Error filtering date "${shift.date}":`, e);
          return false;
        }
      });
      console.log(`After month filtering: ${filtered.length} records remain`);
    } else {
      console.log(`No month filtering applied (all months selected)`);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(shift => 
        shift.medicName.toLowerCase().includes(term)
      );
    }
    
    console.log(`Final filtered data length: ${filtered.length}`);
    setFilteredData(filtered);
    
    // Calculate summary
    const medicHours = calculateMedicHours(filtered, selectedMonth !== 'all' ? selectedMonth : '');
    setSummary(medicHours);
    console.log('Summary for table:', medicHours);
  }, [selectedMonth, searchTerm, reportData]);

  return (
    <div className="container mx-auto p-4 rtl">
      <Card className="w-full">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-xl text-center">דוח רפואנים חודשי</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">טוען נתונים...</div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="w-full md:w-1/2">
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">חודש</label>
                    <Select 
                      value={selectedMonth} 
                      onValueChange={(value) => {
                        console.log(`Month selection changed to: "${value}"`);
                        setSelectedMonth(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר חודש">
                          {selectedMonth === 'all' ? 'כל החודשים' : selectedMonth}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל החודשים</SelectItem>
                        {availableMonths.length > 0 ? (
                          availableMonths.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-months" disabled>
                            {loading ? 'טוען חודשים...' : 'אין חודשים זמינים'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {availableMonths.length === 0 && !loading && (
                      <div className="mt-1">
                        <p className="text-sm text-red-500">
                          לא נמצאו חודשים. יתכן שהתאריכים בדו"ח אינם בפורמט תקין.
                          <br />
                          {`מספר דיווחים שנטענו: ${reportData.length}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium mb-1">חיפוש רפואן</label>
                  <Input 
                    placeholder="הקלד שם רפואן" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <h3 className="text-lg font-bold mb-4">סיכום שעות לפי רפואן</h3>
              <div className="rounded-md border mb-8 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם רפואן</TableHead>
                      <TableHead className="text-center">סה"כ שעות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(summary).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4">
                          לא נמצאו נתונים
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(summary)
                        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB, 'he'))
                        .map(([medicName, minutes]) => (
                          <TableRow key={medicName}>
                            <TableCell className="font-medium">{medicName}</TableCell>
                            <TableCell className="text-center">
                              {formatHoursMinutes(minutes)}
                              {minutes > 10000 && <div className="text-xs text-red-500">{minutes} דקות</div>}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Report;