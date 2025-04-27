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
import { formatHoursMinutes } from '@/utils/timeUtils';

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
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ [medicName: string]: number }>({});

  const calculateMedicHours = (shifts: ShiftRecord[], month: string) => {
    const medicHours: { [medicName: string]: number } = {};
    
    // Filter by selected month if any
    const filtered = month ? 
      shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        const shiftMonth = shiftDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
        return shiftMonth === month;
      }) : shifts;
    
    // Calculate hours for each medic
    filtered.forEach(shift => {
      const medicName = shift.medicName;
      const hoursStr = shift.reportedHours && shift.reportedHours !== shift.totalHours 
        ? shift.reportedHours 
        : shift.totalHours;
      
      // Convert HH:MM to minutes
      const [hours, minutes] = hoursStr.split(':').map(num => parseInt(num, 10));
      const totalMinutes = (hours * 60) + minutes;
      
      if (!medicHours[medicName]) {
        medicHours[medicName] = 0;
      }
      
      medicHours[medicName] += totalMinutes;
    });
    
    return medicHours;
  };

  const extractMonths = (shifts: ShiftRecord[]) => {
    const months = new Set<string>();
    
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      const monthYear = shiftDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
      months.add(monthYear);
    });
    
    return Array.from(months).sort((a, b) => {
      // Custom sort for Hebrew months
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      
      // Hebrew month order logic
      const hebrewMonths = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
      ];
      
      return hebrewMonths.indexOf(monthA) - hebrewMonths.indexOf(monthB);
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchMonthlyReport();
        
        // Convert data from Google Sheets format to our format
        const formattedData: ShiftRecord[] = data.map((row: any, index: number) => ({
          id: `${index}`,
          date: row[4], // E column - תאריך המשמרת
          medicName: row[1], // B column - שם רפואן
          shiftType: row[2], // C column - סוג המשמרת
          doctorName: row[3], // D column - שם הרופא
          startTime: row[5], // F column - שעת התחלה
          endTime: row[6], // G column - שעת סיום
          totalHours: row[7], // H column - משך המשמרת מחושב
          reportedHours: row[8] || null, // I column - משך משמרת מדווח
        }));
        
        setReportData(formattedData);
        setFilteredData(formattedData);
        
        // Extract available months
        const months = extractMonths(formattedData);
        setAvailableMonths(months);
        
        // If months available, select the latest one
        if (months.length > 0) {
          setSelectedMonth(months[months.length - 1]);
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
    let filtered = [...reportData];
    
    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter(shift => {
        const shiftDate = new Date(shift.date);
        const monthYear = shiftDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
        return monthYear === selectedMonth;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(shift => 
        shift.medicName.toLowerCase().includes(term)
      );
    }
    
    setFilteredData(filtered);
    
    // Calculate summary
    const medicHours = calculateMedicHours(filtered, selectedMonth);
    setSummary(medicHours);
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
                  <label className="block text-sm font-medium mb-1">בחירת חודש</label>
                  <Select 
                    value={selectedMonth} 
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר חודש" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">כל החודשים</SelectItem>
                      {availableMonths.map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                            <TableCell className="text-center">{formatHoursMinutes(minutes)}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <h3 className="text-lg font-bold mb-4">פירוט משמרות</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם רפואן</TableHead>
                      <TableHead className="text-right">תאריך</TableHead>
                      <TableHead className="text-right">שעת התחלה</TableHead>
                      <TableHead className="text-right">שעת סיום</TableHead>
                      <TableHead className="text-right">משך משמרת</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          לא נמצאו משמרות
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell className="font-medium">{shift.medicName}</TableCell>
                          <TableCell>{new Date(shift.date).toLocaleDateString('he-IL')}</TableCell>
                          <TableCell>{shift.startTime}</TableCell>
                          <TableCell>{shift.endTime}</TableCell>
                          <TableCell>
                            {shift.reportedHours && shift.reportedHours !== shift.totalHours 
                              ? `${shift.reportedHours} (דווח) / ${shift.totalHours} (מחושב)` 
                              : shift.totalHours}
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