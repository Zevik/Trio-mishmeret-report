import { useState, useEffect } from 'react';
import { format, parse, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { buildGASUrl } from '../utils/environment';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMonthlyReport, parseDate } from '@/utils/reportUtils';
import { formatHoursMinutes } from '@/utils/timeUtils';
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
  date: string;
  medicName: string; // רפואן
  shiftType: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  totalHours: string;
  reportedHours: string | null;
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
    
    // לוגיקה חדשה לחישוב שעות לפי רפואן
    const medicHoursRaw: { [medicName: string]: string[] } = {};
    const medicHours: { [medicName: string]: number } = {};
    
    // המידע יוצג במשתנה גלובלי לצורך דיבאג
    // @ts-ignore
    window.debugShiftData = {
      shifts: [...shifts],
      month,
      calculations: [],
      medicHoursRaw: {}
    };
    
    // Filter by selected month if any
    const filtered = month ? 
      shifts.filter(shift => {
        // חילוץ תאריך המשמרת מהמחרוזת
        let shiftDate: Date | null = null;
        
        try {
          // בדוק אם מדובר בתאריך ISO
          if (shift.date && shift.date.includes('T')) {
            shiftDate = new Date(shift.date);
            console.log(`Filtering date (ISO): ${shift.date} => ${shiftDate.toISOString()}`);
          } 
          // אחרת נסה לפרסר כ-DD/MM/YYYY
          else if (shift.date && shift.date.includes('/')) {
            const parts = shift.date.split('/');
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // חודשים מתחילים מ-0
              const year = parseInt(parts[2], 10);
              shiftDate = new Date(year, month, day);
              console.log(`Filtering date (DD/MM/YYYY): ${shift.date} => ${shiftDate.toISOString()}`);
            }
          }
          
          // אם לא הצלחנו לפרסר, נסה לפרסר עם parseDate
          if (!shiftDate || isNaN(shiftDate.getTime())) {
            shiftDate = parseDate(shift.date);
            if (shiftDate) {
              console.log(`Filtering date (parseDate): ${shift.date} => ${shiftDate.toISOString()}`);
            }
          }
          
          // בדוק אם הצלחנו לפרסר את התאריך
          if (!shiftDate || isNaN(shiftDate.getTime())) {
            console.warn(`Invalid date format for filtering: ${shift.date}`);
            return false;
          }
          
          // בדוק האם התאריך מתאים לחודש הנבחר
          const shiftMonthYear = shiftDate.toLocaleDateString('he-IL', { 
            month: 'long', 
            year: 'numeric' 
          });
          
          const matches = shiftMonthYear === month;
          console.log(`Filtering shift for ${shift.medicName}: ${shift.date} => ${shiftMonthYear} - matches "${month}": ${matches}`);
          
          return matches;
        } catch (err) {
          console.error(`Error filtering date: ${shift.date}`, err);
          return false;
        }
      }) : shifts;
      
      // הוסף לוג של מספר המשמרות אחרי הסינון
      console.log(`Filtered shifts: ${filtered.length} out of ${shifts.length} total shifts`);
      
      // הוסף לוג של כמה משמרות יש לכל רפואן אחרי הסינון
      const countByMedic = filtered.reduce((acc, shift) => {
        acc[shift.medicName] = (acc[shift.medicName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("Shifts per medic after filtering:", countByMedic);
      
    // אסוף את כל השעות לפי רפואן בפורמט המקורי
    filtered.forEach(shift => {
      const medicName = shift.medicName;
      // בחר משך זמן מדווח אם קיים, אחרת משך זמן מחושב
      const hoursStr = shift.reportedHours && shift.reportedHours !== shift.totalHours 
        ? shift.reportedHours 
        : shift.totalHours;
      
      // אתחל מערך לרפואן אם לא קיים
      if (!medicHoursRaw[medicName]) {
        medicHoursRaw[medicName] = [];
      }
      
      // הוסף את השעות למערך של הרפואן
      if (hoursStr) {
        medicHoursRaw[medicName].push(hoursStr);
        console.log(`Adding shift for ${medicName}: ${hoursStr}`);
      } else {
        console.warn(`Skipping invalid hours format for ${medicName}:`, hoursStr);
      }
    });
    
    // @ts-ignore
    window.debugShiftData.medicHoursRaw = {...medicHoursRaw};
    
    // חשב את סך הדקות לפי רפואן
    Object.entries(medicHoursRaw).forEach(([medicName, hoursList]) => {
      let totalMinutes = 0;
      
      console.log(`Calculating total for ${medicName} (${hoursList.length} shifts):`);
      
      hoursList.forEach(hoursStr => {
        try {
          let hours = 0;
          let minutes = 0;
          
          // בדוק אם זה פורמט של תאריך מלא (עם השנה 1899)
          if (hoursStr.includes('1899') || hoursStr.startsWith('18')) {
            // התמודדות עם פורמט הזמן של גוגל שיטס עם השנה 1899
            try {
              const date = new Date(hoursStr);
              
              if (!isNaN(date.getTime())) {
                // הוצא את משך הזמן מהשעה בתאריך המקורי
                // תאריכי 1899 בגוגל שיטס מייצגים משך זמן בשעות ודקות בלבד
                hours = date.getUTCHours(); // אנחנו רוצים את השעות ב-UTC
                minutes = date.getUTCMinutes();
                
                // החישוב עכשיו נכון יותר, כי אנחנו מתייחסים לשעון UTC
                // ולא מושפעים מאזור הזמן המקומי או שעון קיץ
                
                console.log(`  ${hoursStr} => Parsing as Google date (UTC) => ${hours}h ${minutes}m`);
              } else {
                console.warn(`  Failed to parse Google date format: ${hoursStr}`);
                return; // דלג על רשומה זו
              }
            } catch (err) {
              console.error(`  Error parsing Google date: ${hoursStr}`, err);
              return; // דלג על רשומה זו
            }
          } 
          // בדוק אם זה פורמט של "HH:MM"
          else if (hoursStr.includes(':')) {
            // המר את מחרוזת השעות לדקות
            const timeParts = hoursStr.trim().split(':');
            hours = parseInt(timeParts[0], 10);
            minutes = parseInt(timeParts[1], 10);
            console.log(`  ${hoursStr} => Parsing as HH:MM => ${hours}h ${minutes}m`);
          }
          // אחרת, נסה לפרש כמספר
          else {
            const num = parseFloat(hoursStr);
            if (!isNaN(num)) {
              hours = Math.floor(num);
              minutes = Math.round((num - hours) * 60);
              console.log(`  ${hoursStr} => Parsing as decimal hours => ${hours}h ${minutes}m`);
            } else {
              console.warn(`  Failed to parse as number: ${hoursStr}`);
              return; // דלג על רשומה זו
            }
          }
          
          if (!isNaN(hours) && !isNaN(minutes)) {
            const shiftMinutes = (hours * 60) + minutes;
            totalMinutes += shiftMinutes;
            console.log(`  → ${hours}h ${minutes}m (${shiftMinutes} minutes) => running total: ${totalMinutes} minutes`);
          } else {
            console.warn(`  Invalid parsed time: hours=${hours}, minutes=${minutes}`);
          }
        } catch (err) {
          console.error(`  Error processing time ${hoursStr}:`, err);
        }
      });
      
      // שמור את סך הדקות
      medicHours[medicName] = totalMinutes;
      console.log(`Final total for ${medicName}: ${totalMinutes} minutes (${formatHoursMinutes(totalMinutes)})`);
      
      // שמור לדיבאג
      // @ts-ignore
      window.debugShiftData.calculations.push({
        medicName,
        hoursList,
        totalMinutes,
        formattedTime: formatHoursMinutes(totalMinutes)
      });
    });
    
    // @ts-ignore
    window.debugShiftData.medicHours = {...medicHours};
    console.log('Final medicHours:', medicHours);
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
          console.log(`extractMonths: processing date "${dateStr}" from item ${index}`);
          
          const parsedDate = parseDate(dateStr);
          if (!parsedDate) {
            console.warn(`extractMonths: could not parse date "${dateStr}" from item ${index}`);
            return;
          }
          
          const monthFormat = parsedDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
          console.log(`extractMonths: extracted month format: "${monthFormat}" from date ${dateStr}`);
          
          months.add(monthFormat);
        } catch (e) {
          console.error(`extractMonths: Error processing item at index ${index}:`, e);
        }
      });
      
      // המרה למערך וסידור
      const uniqueMonths = Array.from(months);
      console.log('extractMonths: pre-sort months:', uniqueMonths);
      
      try {
        uniqueMonths.sort((a, b) => {
          console.log(`Comparing: "${a}" vs "${b}"`);
          
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
          
          console.log(`a: month=${aMonth}, year=${aYear}, b: month=${bMonth}, year=${bYear}`);
          
          // השוואה לפי שנים
          if (aYear !== bYear) {
            return bYear - aYear; // סדר יורד - חדש לישן
          }
          
          // אם השנים שוות, השוואה לפי חודש
          const aMonthIndex = getMonthIndex(aMonth);
          const bMonthIndex = getMonthIndex(bMonth);
          
          console.log(`Month indices: a=${aMonthIndex}, b=${bMonthIndex}`);
          
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
          console.log(`Evaluating date: "${dateStr}" for filter: "${selectedMonth}"`);
          
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
          console.log(`Date "${dateStr}" parsed to month-year: "${monthYear}" - matches filter: ${matches}`);
          
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