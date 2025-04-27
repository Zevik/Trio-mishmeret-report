import React, { useState, useEffect } from "react";

interface SimpleDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function SimpleDatePicker({ value, onChange, label }: SimpleDatePickerProps) {
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [daysInMonth, setDaysInMonth] = useState<number[]>([]);
  
  // Setup years array for select dropdown (10 years back, 10 years forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  
  // Setup months array
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Initialize from value
  useEffect(() => {
    if (value) {
      const [yearVal, monthVal, dayVal] = value.split("-");
      if (yearVal && monthVal && dayVal) {
        setYear(yearVal);
        setMonth(monthVal);
        setDay(dayVal);
      }
    }
  }, [value]);
  
  // Calculate days in month when month or year changes
  useEffect(() => {
    if (month && year) {
      const daysCount = new Date(parseInt(year), parseInt(month), 0).getDate();
      setDaysInMonth(Array.from({ length: daysCount }, (_, i) => i + 1));
    }
  }, [month, year]);
  
  // If no date is set, initialize with current date
  useEffect(() => {
    if (!value) {
      const now = new Date();
      const currentYear = now.getFullYear().toString();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
      const currentDay = now.getDate().toString().padStart(2, "0");
      onChange(`${currentYear}-${currentMonth}-${currentDay}`);
    }
  }, []);
  
  // Update the date value when any component changes
  useEffect(() => {
    if (year && month && day) {
      const formattedMonth = month.padStart(2, "0");
      const formattedDay = day.padStart(2, "0");
      onChange(`${year}-${formattedMonth}-${formattedDay}`);
    }
  }, [year, month, day]);

  // Common select styles
  const selectClassName = "h-full py-0 px-2 border-0 bg-transparent text-center outline-none text-lg appearance-none cursor-pointer";
  
  return (
    <div className="w-full">
      <label className="block mb-1 font-medium">{label} <span className="text-error">*</span></label>
      <div className="flex h-10 border border-neutral-medium rounded-md bg-white focus-within:ring-2 focus-within:ring-primary relative overflow-hidden">
        <div className="flex items-stretch w-full justify-between">
          {/* Year select - Left side (in LTR) */}
          <div className="relative flex-1">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={selectClassName}
              required
            >
              <option value="" disabled>שנה</option>
              {years.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center font-bold text-lg">/</div>
          
          {/* Month select - Middle */}
          <div className="relative flex-1">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={selectClassName}
              required
            >
              <option value="" disabled>חודש</option>
              {months.map((m) => (
                <option key={m} value={m.toString().padStart(2, "0")}>
                  {m}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center font-bold text-lg">/</div>
          
          {/* Day select - Right side (in LTR) */}
          <div className="relative flex-1">
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={selectClassName}
              required
            >
              <option value="" disabled>יום</option>
              {daysInMonth.map((d) => (
                <option key={d} value={d.toString().padStart(2, "0")}>
                  {d}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}