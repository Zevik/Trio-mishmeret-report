import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [displayDate, setDisplayDate] = useState("");

  // Format date to display as DD/MM/YYYY
  useEffect(() => {
    if (value) {
      // Convert ISO format (YYYY-MM-DD) to DD/MM/YYYY
      const [year, month, day] = value.split('-');
      if (year && month && day) {
        setDisplayDate(`${day}/${month}/${year}`);
      } else {
        setDisplayDate("");
      }
    } else {
      setDisplayDate("");
    }
  }, [value]);

  // הפונקציה שמתבצעת כאשר המשתמש משנה את התאריך
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative w-full">
      <label className="block mb-1 font-medium">{label} <span className="text-error">*</span></label>
      <div className="relative">
        <Input
          type="date"
          value={value}
          onChange={handleDateChange}
          className="h-10 opacity-1 cursor-pointer"
          required
        />
        {/* שכבת UI עליונה שמראה את התאריך בפורמט הרצוי */}
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
          <span className="text-neutral-darkest">📅</span>
        </div>
      </div>
    </div>
  );
}