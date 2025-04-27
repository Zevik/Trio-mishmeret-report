import { ChangeEvent } from "react";
import { Input } from "./ui/input";
import { isValidTimeFormat } from "@/utils/timeUtils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  hoursOnly?: boolean;
}

export default function TimePicker({ value, onChange, label, required = true, hoursOnly = false }: TimePickerProps) {
  // Handle manual time input with automatic colon insertion
  const handleTimeInput = (e: ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remove any non-digit characters for processing
    const digitsOnly = inputValue.replace(/\D/g, '');
    
    // Format with automatic colon after 2 digits
    if (digitsOnly.length > 2) {
      // First two digits + colon + remaining digits
      const hours = digitsOnly.substring(0, 2);
      const minutes = digitsOnly.substring(2);
      
      // Validate hours (0-23)
      if (parseInt(hours) > 23) {
        inputValue = "23:" + minutes;
      } else {
        inputValue = hours + ":" + minutes;
      }
      
      // If there are more than 4 digits total, truncate
      if (digitsOnly.length > 4) {
        const minutes = digitsOnly.substring(2, 4);
        // Validate minutes (0-59)
        if (parseInt(minutes) > 59) {
          inputValue = hours + ":59";
        } else {
          inputValue = hours + ":" + minutes;
        }
      }
    } else if (digitsOnly.length === 0) {
      // When cleared
      inputValue = "";
    } else {
      // Just digits without colon yet
      inputValue = digitsOnly;
    }
    
    onChange(inputValue);
  };

  return (
    <div className="w-full">
      <label className="block mb-1 font-medium">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleTimeInput}
        placeholder="הכנס זמן"
        className="w-full border border-neutral-medium rounded-md px-3 py-2"
        maxLength={5}
      />
      <p className="text-xs text-gray-500 mt-1">
        פורמט: שעות:דקות (לדוגמה: 08:30, 14:45, 23:15)
      </p>
    </div>
  );
}